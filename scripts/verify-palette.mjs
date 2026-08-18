#!/usr/bin/env node
/**
 * Palette verifier for the Alone theme family.
 *
 * Discovers every variant under themes/_src/variants/*.yaml, loads the
 * corresponding built JSON from themes/, and runs these checks. Each check
 * has a severity in POLICY below — `fail` exits non-zero, `warn` is reported
 * but does not fail the run. (v2 introduced the perceptual checks as
 * warnings; they flip to `fail` once the palette meets them.)
 *
 *   1. L* ladder (standard variant) — the ten headline roles descend in the
 *      documented order. Out-of-order → fail. Adjacent gaps below
 *      TIGHT_GAP_L (3 L*) or ΔE2000 below TIGHT_GAP_DE → tightGap.
 *   2. APCA floors (every variant) — |Lc| against editor.background per
 *      role class (body / syntax / special / punctuation / comments). Floors
 *      come from APCA_FLOORS, overridable per variant via
 *      `verify.apcaFloors` in its yaml (Soft runs a scaled set).
 *   3. CVD confusability (every variant) — for each pair in CVD_PAIRS the
 *      ΔE2000 after protan/deutan simulation must stay ≥ CVD_MIN_DE, or the
 *      two roles must differ in font style.
 *   4. ANSI palette (every variant) — pairwise ΔE2000 among the eight
 *      normal slots ≥ ANSI_MIN_DE.
 *   5. Wavelength — (a) the ten roles pass the variant's declared band
 *      (`verify.wavelengthBand`: warm | red-amber | red-only; fail), and
 *      (b) every hex anywhere in the theme with chroma ≥ SCAN_MIN_CHROMA has a
 *      dominant wavelength ≥ SCAN_MIN_NM (wavelengthScan).
 *   6. Variant key parity — every variant declares the same `colors.*` and
 *      `semanticTokenColors.*` key sets.
 *   7. README tables — the blocks between `<!-- verify:<name>:start/end -->`
 *      markers in README.md are rendered from the standard variant. Default
 *      mode fails on drift; `--write-readme` rewrites them in place.
 *
 * Usage: node scripts/verify-palette.mjs [--write-readme]
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import YAML from 'yaml';
import {
  cielabL, contrastRatio, apcaLc, deltaE2000, simulateCvd, dominantWavelength,
  hexToLch, hexToRgb255, isHexColor,
} from './lib/color.mjs';
import {
  LADDER_ROLES, SYNTAX_TABLE_ROLES, CVD_PAIRS, resolveRole, roleMap, stylesDiffer,
  styleLabel, ansiColors, bracketColors, allHexes,
} from './lib/theme-roles.mjs';
import { mdTable, replaceBlock, findBlock } from './lib/readme.mjs';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const THEMES = path.join(ROOT, 'themes');
const VARIANTS_DIR = path.join(THEMES, '_src', 'variants');
const README = path.join(ROOT, 'README.md');

const WRITE_README = process.argv.includes('--write-readme');

// ─── Policy & thresholds ─────────────────────────────────────────────
// Severity per check. Flip a `warn` to `fail` once the palette meets it.
const POLICY = {
  ladderOrder: 'fail',
  tightGap: 'warn',
  apca: 'warn',
  cvd: 'warn',
  ansi: 'warn',
  wavelengthBand: 'fail',
  wavelengthScan: 'warn',
  parity: 'fail',
  readme: 'fail',
};

const TIGHT_GAP_L = 3.0;
const TIGHT_GAP_DE = 4.0;
const CVD_MIN_DE = 5.0;
const ANSI_MIN_DE = 10.0;
const SCAN_MIN_NM = 575;
const SCAN_MIN_CHROMA = 3.0;

// APCA |Lc| floors by role class (standard variant). Lc is compared after
// rounding to the nearest integer, matching how APCA levels are quoted.
const APCA_FLOORS = { body: 60, syntax: 40, special: 37, punctuation: 28, comments: 22 };
const APCA_CLASS = {
  Operators: 'body', Variables: 'body',
  Numbers: 'syntax', Keywords: 'syntax', Types: 'syntax', Functions: 'syntax', Strings: 'syntax',
  Special: 'special', Punctuation: 'punctuation', Comments: 'comments',
};

// ─── Reporting ───────────────────────────────────────────────────────
let failures = 0;
let warnings = 0;
const tally = {};
function finding(check, message) {
  const sev = POLICY[check];
  if (sev === 'fail') {
    failures++;
    console.log(`  ✗ ${message}`);
  } else {
    warnings++;
    console.log(`  ⚠ ${message}`);
  }
  tally[check] = (tally[check] ?? 0) + 1;
}
const f1 = (n) => n.toFixed(1);
const lc = (hex, bg) => Math.round(Math.abs(apcaLc(hex, bg)));

// ─── Discover variants ───────────────────────────────────────────────
const variantFiles = fs.readdirSync(VARIANTS_DIR).filter((f) => f.endsWith('.yaml')).sort();
if (variantFiles.length === 0) {
  console.error(`No variants found under ${VARIANTS_DIR}`);
  process.exit(1);
}

const variants = variantFiles.map((f) => {
  const meta = YAML.parse(fs.readFileSync(path.join(VARIANTS_DIR, f), 'utf8'));
  if (!meta.filename) throw new Error(`${f}: missing "filename"`);
  const jsonPath = path.join(THEMES, meta.filename);
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`${f} references ${meta.filename} but it does not exist — run npm run build:themes first`);
  }
  const theme = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const bg = theme.colors?.['editor.background'];
  if (!isHexColor(bg)) {
    throw new Error(`${f}: colors["editor.background"] must be a 6- or 8-digit hex (got ${JSON.stringify(bg)})`);
  }
  return {
    sourceFile: f,
    display: meta.display ?? theme.name,
    filename: meta.filename,
    band: meta.verify?.wavelengthBand ?? 'warm',
    isStandard: meta.verify?.isStandard === true,
    apcaFloors: { ...APCA_FLOORS, ...(meta.verify?.apcaFloors ?? {}) },
    bg,
    theme,
  };
});

// "Standard" variant pegs the L* ladder and the README tables. Marked via
// verify.isStandard: true; falls back to alone.yaml. Multiple declarations
// are ambiguous — reject rather than silently pick the first.
const standardCandidates = variants.filter((v) => v.isStandard);
if (standardCandidates.length > 1) {
  console.error(
    `Ambiguous standard: ${standardCandidates.length} variants declare verify.isStandard: true — ` +
      standardCandidates.map((v) => v.sourceFile).join(', ') + '. Exactly one variant should be marked standard.'
  );
  process.exit(1);
}
const standard = standardCandidates[0] ?? variants.find((v) => v.sourceFile === 'alone.yaml');
if (!standard) {
  console.error('No "standard" variant — set verify.isStandard: true on one variant yaml.');
  process.exit(1);
}

// Report the standard first, then the rest in file order.
variants.sort((a, b) => (a === standard ? -1 : b === standard ? 1 : 0));

console.log(`Found ${variants.length} variant(s): ${variants.map((v) => v.display).join(', ')}`);
console.log(`Standard = ${standard.display} (${standard.sourceFile})\n`);

// ─── 1. L* ladder (standard) ─────────────────────────────────────────
const BG = standard.bg;
const ladder = LADDER_ROLES.map((r) => {
  const { name, hex, style } = resolveRole(standard.theme, r);
  return { name, hex, style, L: cielabL(hex), wcag: contrastRatio(hex, BG), lc: lc(hex, BG) };
});

console.log(`1. L* ladder — ${standard.display} against ${BG}\n`);
console.log('  Role          Hex       L*     Δ    WCAG    APCA');
console.log('  ───────────────────────────────────────────────────');
for (let i = 0; i < ladder.length; i++) {
  const { name, hex, L, wcag, lc: apca } = ladder[i];
  const gap = i === 0 ? '' : f1(ladder[i - 1].L - L).padStart(4);
  console.log(`  ${name.padEnd(13)} ${hex}   ${f1(L).padStart(5)}  ${gap.padStart(4)}   ${f1(wcag).padStart(5)}   Lc ${String(apca).padStart(2)}`);
}
console.log('');
for (let i = 1; i < ladder.length; i++) {
  const prev = ladder[i - 1];
  const cur = ladder[i];
  const gap = prev.L - cur.L;
  const dE = deltaE2000(prev.hex, cur.hex);
  if (gap < 0) {
    finding('ladderOrder', `ladder out of order: ${cur.name} (L*${f1(cur.L)}) > ${prev.name} (L*${f1(prev.L)})`);
  } else if (gap < TIGHT_GAP_L || dE < TIGHT_GAP_DE) {
    const why = [gap < TIGHT_GAP_L ? `${f1(gap)} L* < ${TIGHT_GAP_L}` : null, dE < TIGHT_GAP_DE ? `ΔE00 ${f1(dE)} < ${TIGHT_GAP_DE}` : null]
      .filter(Boolean).join(', ');
    finding('tightGap', `tight gap ${prev.name}→${cur.name}: ${why} — relies on font style + hue`);
  }
}
if (!tally.ladderOrder && !tally.tightGap) console.log('  ✓ monotonic with comfortable gaps');

// ─── 2. APCA floors (per variant) ────────────────────────────────────
console.log('\n2. APCA floors (|Lc| vs editor.background, rounded)\n');
for (const v of variants) {
  const roles = roleMap(v.theme);
  const misses = [];
  const cells = [];
  for (const r of LADDER_ROLES) {
    const cls = APCA_CLASS[r.name];
    const floor = v.apcaFloors[cls];
    const value = lc(roles[r.name].hex, v.bg);
    cells.push(`${r.name} ${value}`);
    if (value < floor) misses.push(`${r.name} Lc ${value} < ${floor} (${cls})`);
  }
  console.log(`  ${v.display.padEnd(16)} ${cells.join(' · ')}`);
  for (const m of misses) finding('apca', `${v.display}: ${m}`);
}
if (!tally.apca) console.log('  ✓ every role clears its floor in every variant');

// ─── 3. CVD confusability (per variant) ──────────────────────────────
function cvdRows(roles) {
  return CVD_PAIRS.map(([a, b]) => {
    const A = roles[a];
    const B = roles[b];
    const sim = Object.fromEntries(
      ['protan', 'deutan', 'tritan'].map((t) => [t, deltaE2000(simulateCvd(A.hex, t), simulateCvd(B.hex, t))])
    );
    const styled = stylesDiffer(A.style, B.style);
    const worst = Math.min(sim.protan, sim.deutan);
    return { a, b, normal: deltaE2000(A.hex, B.hex), sim, styled, worst, ok: styled || worst >= CVD_MIN_DE };
  });
}
const cvdLine = (r) =>
  `  ${`${r.a} vs ${r.b}`.padEnd(26)} ${f1(r.normal).padStart(5)}   ${f1(r.sim.protan).padStart(5)}   ` +
  `${f1(r.sim.deutan).padStart(5)}   ${f1(r.sim.tritan).padStart(5)}   ${r.styled ? 'differs' : 'same'}${r.ok ? '' : '   ✗'}`;

console.log(`\n3. Colour-vision deficiency — ΔE2000 after simulation (min ${CVD_MIN_DE} unless font style differs)\n`);
console.log('  Pair                       normal  protan  deutan  tritan  style');
console.log('  ─────────────────────────────────────────────────────────────────');
for (const v of variants) {
  const rows = cvdRows(roleMap(v.theme));
  const bad = rows.filter((r) => !r.ok);
  if (v === standard) {
    for (const r of rows) console.log(cvdLine(r));
  } else {
    console.log(`  — ${v.display}: ${bad.length ? `${bad.length} pair(s) collapse` : '✓ all pairs separable'}`);
    for (const r of bad) console.log(cvdLine(r));
  }
  for (const r of bad) {
    finding('cvd', `${v.display}: ${r.a} vs ${r.b} collapse under red-green simulation (ΔE00 ${f1(r.worst)}) with identical font style`);
  }
}

// ─── 4. ANSI palette (per variant) ───────────────────────────────────
console.log(`\n4. Terminal ANSI — pairwise ΔE2000 among the normal 8 (min ${ANSI_MIN_DE})\n`);
for (const v of variants) {
  const ansi = ansiColors(v.theme);
  const normal = ansi.slice(0, 8);
  if (v === standard) {
    console.log('  Slot           Hex       L*    λd');
    console.log('  ─────────────────────────────────');
    for (const { slot, hex } of ansi) {
      const { lambda } = dominantWavelength(hex);
      const [, C] = hexToLch(hex);
      console.log(`  ${slot.padEnd(14)} ${hex}   ${f1(cielabL(hex)).padStart(4)}   ${C < SCAN_MIN_CHROMA ? 'neutral' : `${lambda} nm`}`);
    }
    console.log('');
  }
  let worst = Infinity;
  for (let i = 0; i < normal.length; i++) {
    for (let j = i + 1; j < normal.length; j++) {
      const d = deltaE2000(normal[i].hex, normal[j].hex);
      worst = Math.min(worst, d);
      if (d < ANSI_MIN_DE) finding('ansi', `${v.display}: ansi ${normal[i].slot} vs ${normal[j].slot} ΔE00 ${f1(d)} < ${ANSI_MIN_DE}`);
    }
  }
  console.log(`  ${v.display.padEnd(16)} closest normal pair ΔE00 ${f1(worst)}`);
}

// ─── 5. Wavelength (per variant) ─────────────────────────────────────
function bandCheck(band, hex) {
  const [r, g, b] = hexToRgb255(hex);
  switch (band) {
    case 'warm':
      // No syntax hex in the blue/cyan band (B > R and B > G).
      return !(b > r && b > g);
    case 'red-amber':
      // Long-wave dominant: R ≥ G ≥ B, with R-B headroom ≥ 0x40.
      return r >= g && g >= b && r - b >= 0x40;
    case 'red-only':
      // Strict mono-red: R dominates both G and B by wide margins.
      return r >= g + 0x30 && r >= b + 0x60;
    default:
      throw new Error(`unknown wavelength band: ${band}`);
  }
}

console.log(`\n5. Wavelength — role band check + whole-theme scan (λd ≥ ${SCAN_MIN_NM} nm for chroma ≥ ${SCAN_MIN_CHROMA})\n`);
for (const v of variants) {
  const roles = roleMap(v.theme);
  const offenders = LADDER_ROLES.map((r) => roles[r.name]).filter(({ hex }) => !bandCheck(v.band, hex));
  for (const { name, hex } of offenders) finding('wavelengthBand', `${v.display}: ${name} (${hex}) outside band "${v.band}"`);

  const hexes = allHexes(v.theme);
  const byHex = new Map();
  for (const { path: p, hex } of hexes) {
    if (!byHex.has(hex)) byHex.set(hex, []);
    byHex.get(hex).push(p);
  }
  let scanned = 0;
  let scanOffenders = 0;
  for (const [hex, paths] of byHex) {
    const [, C] = hexToLch(hex);
    if (C < SCAN_MIN_CHROMA) continue;
    scanned++;
    const { lambda } = dominantWavelength(hex);
    if (Number.isNaN(lambda) || lambda < SCAN_MIN_NM) {
      scanOffenders++;
      finding('wavelengthScan', `${v.display}: ${hex} λd=${Number.isNaN(lambda) ? 'non-spectral' : lambda + ' nm'} (C* ${f1(C)}) at ${paths.slice(0, 3).join(', ')}${paths.length > 3 ? ` (+${paths.length - 3})` : ''}`);
    }
  }
  const mark = offenders.length || scanOffenders ? ' ' : '✓';
  console.log(`  ${mark} ${v.display.padEnd(16)} band=${v.band.padEnd(9)} roles ${offenders.length ? `${offenders.length} outside` : 'in band'}; scanned ${byHex.size} unique hexes (${scanned} chromatic), ${scanOffenders} below ${SCAN_MIN_NM} nm`);
}

// ─── 6. Variant key parity ───────────────────────────────────────────
console.log('\n6. Variant key parity\n');
const keySet = (obj) => new Set(Object.keys(obj));
function diffSets(a, b, label) {
  const onlyA = [...a].filter((k) => !b.has(k));
  const onlyB = [...b].filter((k) => !a.has(k));
  if (onlyA.length || onlyB.length) {
    const detail = [
      onlyA.length ? `only in left: ${onlyA.slice(0, 5).join(', ')}${onlyA.length > 5 ? '…' : ''}` : null,
      onlyB.length ? `only in right: ${onlyB.slice(0, 5).join(', ')}${onlyB.length > 5 ? '…' : ''}` : null,
    ].filter(Boolean).join('; ');
    finding('parity', `${label}: ${detail}`);
    return false;
  }
  return true;
}
const stdColors = keySet(standard.theme.colors);
const stdSem = keySet(standard.theme.semanticTokenColors);
let parityOk = true;
for (const v of variants) {
  if (v === standard) continue;
  parityOk = diffSets(stdColors, keySet(v.theme.colors), `colors: ${standard.display} vs ${v.display}`) && parityOk;
  parityOk = diffSets(stdSem, keySet(v.theme.semanticTokenColors), `semanticTokenColors: ${standard.display} vs ${v.display}`) && parityOk;
}
if (parityOk) console.log(`  ✓ all ${variants.length} variants share identical key sets`);

// ─── 7. README tables ────────────────────────────────────────────────
function wcagLevel(ratio) {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA (large)';
  return '—';
}

function renderReadmeSections() {
  const t = standard.theme;
  const sections = {};

  // Ladder — plain-text bar chart, one line per tier.
  const styleNote = (s) => (s.bold ? ' (bold)' : s.italic ? ' (italic)' : '');
  sections.ladder = '```text\n' + ladder
    .map(({ name, style, L }) => `L* ${String(Math.round(L)).padStart(2)}  ${'█'.repeat(Math.round(L / 3)).padEnd(28)}  ${name}${styleNote(style)}`)
    .join('\n') + '\n```';

  // Syntax colours — Element | Hex | Style.
  sections['syntax-colors'] = mdTable(
    ['Element', 'Hex', 'Style'],
    SYNTAX_TABLE_ROLES.map((r) => {
      const { name, hex, style } = resolveRole(t, r);
      return [name, `\`${hex}\``, styleLabel(style)];
    })
  );

  // Bracket pairs — ordered list, depth → dimness.
  const BRACKET_NAMES = ['Bright Gold', 'Gold', 'Amber-Brown', 'Umber', 'Dark Umber', 'Deep Brown'];
  sections['bracket-colors'] = bracketColors(t)
    .map(({ depth, hex }) => `${depth}. ${BRACKET_NAMES[depth - 1]} \`${hex}\` (L\\* ~${Math.round(cielabL(hex))})`)
    .join('\n');

  // Contrast — WCAG and APCA side by side for the eight quoted roles.
  const CONTRAST_ROLES = ['Operators', 'Variables', 'Numbers', 'Keywords', 'Types', 'Functions', 'Strings', 'Comments'];
  sections.contrast = mdTable(
    ['Element', 'Color', 'WCAG', 'WCAG level', 'APCA Lc'],
    CONTRAST_ROLES.map((name) => {
      const row = ladder.find((r) => r.name === name);
      return [name, `\`${row.hex}\``, `${f1(row.wcag)}:1`, wcagLevel(row.wcag), String(row.lc)];
    })
  );

  // ANSI — the sixteen terminal slots with L*.
  sections.ansi = mdTable(
    ['Slot', 'Hex', 'L\\*', 'Bright slot', 'Hex', 'L\\*'],
    ansiColors(t).slice(0, 8).map(({ slot, hex }, i) => {
      const bright = ansiColors(t)[i + 8];
      return [slot, `\`${hex}\``, String(Math.round(cielabL(hex))), bright.slot, `\`${bright.hex}\``, String(Math.round(cielabL(bright.hex)))];
    })
  );
  return sections;
}

console.log(`\n7. README tables (${WRITE_README ? 'writing' : 'checking'} verifier-rendered blocks)\n`);
{
  const sections = renderReadmeSections();
  let readme = fs.readFileSync(README, 'utf8');
  const original = readme;
  const drifted = [];
  for (const [name, body] of Object.entries(sections)) {
    if (!findBlock(readme, name)) {
      finding('readme', `README.md is missing the "${name}" marker block — add <!-- verify:${name}:start --> … <!-- verify:${name}:end --> where the table belongs`);
      continue;
    }
    const next = replaceBlock(readme, name, body);
    if (next !== readme) drifted.push(name);
    readme = next;
  }
  if (WRITE_README) {
    if (readme !== original) {
      fs.writeFileSync(README, readme);
      console.log(`  ✓ rewrote ${drifted.length} block(s): ${drifted.join(', ')}`);
    } else {
      console.log('  ✓ README already current');
    }
  } else if (drifted.length) {
    finding('readme', `README.md tables out of date (${drifted.join(', ')}) — run: node scripts/verify-palette.mjs --write-readme`);
  } else if (!tally.readme) {
    console.log('  ✓ README tables match the palette');
  }
}

// ─── Result ──────────────────────────────────────────────────────────
console.log('');
const summary = Object.entries(tally).map(([k, n]) => `${k} ×${n}`).join(', ');
if (failures > 0) {
  console.log(`✗ ${failures} failure(s), ${warnings} warning(s)${summary ? ` — ${summary}` : ''}`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`✓ all hard checks passed with ${warnings} warning(s) — ${summary}`);
} else {
  console.log('✓ all checks passed');
}
