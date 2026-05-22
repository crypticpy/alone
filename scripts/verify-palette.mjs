#!/usr/bin/env node
/**
 * Palette verifier for the Alone theme family.
 *
 * Discovers every variant under themes/_src/variants/*.yaml, loads the
 * corresponding built JSON from themes/, and checks:
 *
 *   1. L* ladder (on the "standard" variant) — every headline syntax
 *      role's L* descends in the documented order (monotonic). Out-of-
 *      order pairs hard-fail. Adjacent gaps below TIGHT_GAP_THRESHOLD
 *      (3 L*) emit a soft warning rather than failing, because the
 *      warm-only palette can't deliver large gaps across all ten tiers —
 *      the middle runs in the ~3 L* range and relies on font style + hue.
 *   2. WCAG contrast ratios in README.md match computed values against
 *      the editor background (within ±WCAG_TOLERANCE), checked on the
 *      "standard" variant.
 *   3. Wavelength constraint — per-variant. Each variant declares its
 *      wavelength band via `verify.wavelengthBand` in its yaml. Bands:
 *        warm     — no syntax hex in the blue/cyan band (B>R and B>G)
 *        red-amber — long-wave dominant; R≥G≥B and R-B ≥ 0x40
 *        red-only  — strict mono-red; R≥G+0x30 and R≥B+0x60
 *      Default is `warm` if unspecified. (Tighter bands are placeholders
 *      for future scotopic-red variants; no current variant uses them.)
 *   4. Variant key parity — every variant declares the same set of
 *      `colors.*` keys and `semanticTokenColors.*` keys.
 *
 * Exits non-zero on any failure with a per-check report.
 *
 * Usage: node scripts/verify-palette.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import YAML from 'yaml';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const THEMES = path.join(ROOT, 'themes');
const VARIANTS_DIR = path.join(THEMES, '_src', 'variants');

const TIGHT_GAP_THRESHOLD = 3.0;
const WCAG_TOLERANCE = 0.05;

// ─── Color math ──────────────────────────────────────────────────────
function hexToLinearRgb(hex) {
  const h = hex.replace('#', '').slice(0, 6);
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return [lin(r), lin(g), lin(b)];
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToLinearRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function cielab_L(hex) {
  const Y = relativeLuminance(hex);
  const f = (t) => (t > Math.pow(6 / 29, 3) ? Math.cbrt(t) : (1 / 3) * Math.pow(29 / 6, 2) * t + 4 / 29);
  return 116 * f(Y) - 16;
}

function contrastRatio(fg, bg) {
  const lFg = relativeLuminance(fg);
  const lBg = relativeLuminance(bg);
  const [lighter, darker] = lFg > lBg ? [lFg, lBg] : [lBg, lFg];
  return (lighter + 0.05) / (darker + 0.05);
}

function rgbChannels(hex) {
  const h = hex.replace('#', '').slice(0, 6);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

// ─── Discover variants ───────────────────────────────────────────────
const variantFiles = fs
  .readdirSync(VARIANTS_DIR)
  .filter((f) => f.endsWith('.yaml'))
  .sort();

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
  return {
    sourceFile: f,
    display: meta.display ?? theme.name,
    filename: meta.filename,
    band: meta.verify?.wavelengthBand ?? 'warm',
    isStandard: meta.verify?.isStandard === true,
    theme,
  };
});

// "Standard" variant is the one used for the L* ladder + README WCAG checks.
// Marked via verify.isStandard: true. Fall back to source filename "alone.yaml".
// Multiple isStandard declarations are ambiguous (which variant pegs the
// ladder?) — reject rather than silently pick the first.
const standardCandidates = variants.filter((v) => v.isStandard);
let standard;
if (standardCandidates.length > 1) {
  console.error(
    `Ambiguous standard: ${standardCandidates.length} variants declare verify.isStandard: true — ` +
      standardCandidates.map((v) => v.sourceFile).join(', ') +
      '. Exactly one variant should be marked standard.'
  );
  process.exit(1);
}
if (standardCandidates.length === 1) {
  standard = standardCandidates[0];
} else {
  standard = variants.find((v) => v.sourceFile === 'alone.yaml');
}
if (!standard) {
  console.error('No "standard" variant — set verify.isStandard: true on one variant yaml.');
  process.exit(1);
}

console.log(`Found ${variants.length} variant(s): ${variants.map((v) => v.display).join(', ')}`);
console.log(`Standard = ${standard.display} (${standard.sourceFile})\n`);

const BG = standard.theme.colors?.['editor.background'];
if (typeof BG !== 'string' || !/^#[0-9a-fA-F]{6,8}$/.test(BG)) {
  console.error(
    `Standard variant (${standard.sourceFile}) is missing or has a malformed ` +
      `colors["editor.background"] — got ${JSON.stringify(BG)}. ` +
      `All contrast math is computed against this value, so it must be a 6- or 8-digit hex string.`
  );
  process.exit(1);
}

// ─── 1. L* ladder (standard only) ────────────────────────────────────
const sem = standard.theme.semanticTokenColors;
const fg = (v) => (typeof v === 'string' ? v : v.foreground);
function tokenForegroundByName(theme, name) {
  const entry = theme.tokenColors.find((t) => t.name === name);
  const hex = entry?.settings?.foreground;
  if (!hex) throw new Error(`tokenColors entry "${name}" not found or missing foreground`);
  return hex;
}

const ROLES = {
  Operators:   fg(sem['operator']),
  Variables:   fg(sem['variable']),
  Numbers:     fg(sem['number']),
  Keywords:    fg(sem['keyword']),
  Types:       fg(sem['type']),
  Functions:   fg(sem['function']),
  Strings:     fg(sem['string']),
  Special:     fg(sem['decorator']),
  Punctuation: tokenForegroundByName(standard.theme, 'Punctuation'),
  Comments:    fg(sem['comment']),
};

const ladder = Object.entries(ROLES).map(([name, hex]) => ({
  name, hex, L: cielab_L(hex), contrast: contrastRatio(hex, BG),
}));

console.log(`L* ladder for ${standard.display} (against bg ${BG}):\n`);
console.log('  Role          Hex       L*     Δ    Contrast');
console.log('  ──────────────────────────────────────────────');
for (let i = 0; i < ladder.length; i++) {
  const { name, hex, L, contrast } = ladder[i];
  const gap = i === 0 ? '' : (ladder[i - 1].L - L).toFixed(1).padStart(4);
  console.log(`  ${name.padEnd(13)} ${hex}   ${L.toFixed(1).padStart(5)}  ${gap}    ${contrast.toFixed(2)}:1`);
}

let failures = 0;
let warnings = 0;

for (let i = 1; i < ladder.length; i++) {
  const prev = ladder[i - 1];
  const cur = ladder[i];
  const pairKey = `${prev.name}→${cur.name}`;
  const gap = prev.L - cur.L;
  if (gap < 0) {
    console.log(`\n  ✗ ladder out of order: ${cur.name} (L*${cur.L.toFixed(1)}) > ${prev.name} (L*${prev.L.toFixed(1)})`);
    failures++;
  } else if (gap < TIGHT_GAP_THRESHOLD) {
    console.log(`\n  ⚠ tight gap (<${TIGHT_GAP_THRESHOLD}): ${pairKey} = ${gap.toFixed(1)} L*  — rely on font style + hue`);
    warnings++;
  }
}

// ─── 2. Headline WCAG contrast claims from README ────────────────────
const README_CONTRAST = {
  Variables: 10.1,
  Keywords:   8.1,
  Functions:  6.6,
  Strings:    5.9,
  Comments:   2.7,
};

console.log('\nWCAG contrast vs README claims:\n');
console.log('  Role        Computed  Claimed  Δ');
console.log('  ───────────────────────────────────');
for (const [name, claimed] of Object.entries(README_CONTRAST)) {
  const row = ladder.find((r) => r.name === name);
  const delta = row.contrast - claimed;
  const ok = Math.abs(delta) <= WCAG_TOLERANCE ? '✓' : '✗';
  console.log(`  ${name.padEnd(10)} ${row.contrast.toFixed(2).padStart(6)}    ${claimed.toFixed(1).padStart(4)}    ${delta >= 0 ? '+' : ''}${delta.toFixed(2)}  ${ok}`);
  if (Math.abs(delta) > WCAG_TOLERANCE) failures++;
}

// ─── 3. Wavelength check per variant ─────────────────────────────────
function bandCheck(band, hex) {
  const { r, g, b } = rgbChannels(hex);
  switch (band) {
    case 'warm':
      // No syntax hex in the blue/cyan band (B > R and B > G).
      return !(b > r && b > g);
    case 'red-amber':
      // Long-wave dominant: R ≥ G ≥ B, with R-B headroom ≥ 0x40.
      return r >= g && g >= b && (r - b) >= 0x40;
    case 'red-only':
      // Strict mono-red: R dominates both G and B by wide margins.
      return r >= g + 0x30 && r >= b + 0x60;
    default:
      throw new Error(`unknown wavelength band: ${band}`);
  }
}

function rolesForVariant(theme) {
  // Same headline-role extraction as the standard, but per-variant.
  const s = theme.semanticTokenColors;
  return {
    Operators:   fg(s['operator']),
    Variables:   fg(s['variable']),
    Numbers:     fg(s['number']),
    Keywords:    fg(s['keyword']),
    Types:       fg(s['type']),
    Functions:   fg(s['function']),
    Strings:     fg(s['string']),
    Special:     fg(s['decorator']),
    Punctuation: tokenForegroundByName(theme, 'Punctuation'),
    Comments:    fg(s['comment']),
  };
}

console.log('\nWavelength check (per variant):\n');
for (const v of variants) {
  const roles = rolesForVariant(v.theme);
  const offenders = Object.entries(roles).filter(([_, hex]) => !bandCheck(v.band, hex));
  if (offenders.length === 0) {
    console.log(`  ✓ ${v.display.padEnd(20)} band=${v.band.padEnd(10)}  all syntax roles in band`);
  } else {
    console.log(`  ✗ ${v.display} band=${v.band}: ${offenders.length} role(s) outside band:`);
    for (const [name, hex] of offenders) {
      console.log(`      ${name} (${hex})`);
      failures++;
    }
  }
}

// ─── 4. Variant key parity ───────────────────────────────────────────
console.log('\nVariant key parity:\n');
function keySet(obj) {
  return new Set(Object.keys(obj));
}
function diffSets(a, b, label) {
  const onlyA = [...a].filter((k) => !b.has(k));
  const onlyB = [...b].filter((k) => !a.has(k));
  if (onlyA.length || onlyB.length) {
    console.log(`  ✗ ${label}:`);
    if (onlyA.length) console.log(`     only in left:  ${onlyA.slice(0, 5).join(', ')}${onlyA.length > 5 ? '…' : ''}`);
    if (onlyB.length) console.log(`     only in right: ${onlyB.slice(0, 5).join(', ')}${onlyB.length > 5 ? '…' : ''}`);
    return false;
  }
  return true;
}

// All variants must match the standard's key set, both for colors and
// semanticTokenColors. N-way: standard vs each non-standard.
const stdColors = keySet(standard.theme.colors);
const stdSem = keySet(standard.theme.semanticTokenColors);

let parityOk = true;
for (const v of variants) {
  if (v === standard) continue;
  const vColors = keySet(v.theme.colors);
  const vSem = keySet(v.theme.semanticTokenColors);
  parityOk = diffSets(stdColors, vColors, `colors: ${standard.display} vs ${v.display}`) && parityOk;
  parityOk = diffSets(stdSem, vSem, `semanticTokenColors: ${standard.display} vs ${v.display}`) && parityOk;
}
if (parityOk) console.log(`  ✓ all ${variants.length} variants share identical key sets`);
else failures++;

// ─── Result ──────────────────────────────────────────────────────────
console.log('');
if (failures > 0) {
  console.log(`✗ ${failures} check(s) failed (${warnings} warning${warnings === 1 ? '' : 's'})`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`✓ all checks passed (${warnings} tight-gap warning${warnings === 1 ? '' : 's'})`);
} else {
  console.log('✓ all checks passed');
}
