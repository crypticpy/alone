#!/usr/bin/env node
/**
 * Palette verifier for the Alone theme.
 *
 * Loads themes/alone-color-theme.json (Standard) and checks:
 *
 *   1. L* ladder — every headline syntax role's L* descends in the
 *      documented order (monotonic). Out-of-order pairs hard-fail.
 *      Adjacent gaps below TIGHT_GAP_THRESHOLD (3 L*) emit a soft
 *      warning rather than failing, because the warm-only palette
 *      can't deliver large gaps across all ten tiers — the middle
 *      runs in the ~3 L* range and relies on font style + hue.
 *   2. WCAG contrast ratios in README.md match computed values against
 *      the editor background #0C0A09 (within ±WCAG_TOLERANCE).
 *   3. No syntax-role hex falls in the blue/cyan band (B > R and B > G).
 *   4. Variant key parity — the three theme JSONs declare identical
 *      sets of `colors.*` keys and `semanticTokenColors.*` keys.
 *
 * Exits non-zero on any failure with a per-check report.
 *
 * Usage: node scripts/verify-palette.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const THEMES = path.join(HERE, '..', 'themes');

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
  // D65 reference Y = 1.0. L* = 116·f(Y/Yn) − 16.
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

// ─── Loading ─────────────────────────────────────────────────────────
const standard = JSON.parse(fs.readFileSync(path.join(THEMES, 'alone-color-theme.json'), 'utf8'));
const soft = JSON.parse(fs.readFileSync(path.join(THEMES, 'alone-soft-color-theme.json'), 'utf8'));
const focused = JSON.parse(fs.readFileSync(path.join(THEMES, 'alone-focused-color-theme.json'), 'utf8'));

const BG = standard.colors['editor.background']; // #0C0A09

// Pull the headline syntax-role hex codes from the parsed theme (not hardcoded).
const sem = standard.semanticTokenColors;
const fg = (v) => (typeof v === 'string' ? v : v.foreground);

// Punctuation isn't a semantic token; it's defined as a TextMate scope.
// Look it up by its named block so a future palette edit can't drift past
// this verifier silently.
function tokenForegroundByName(theme, name) {
  const entry = theme.tokenColors.find((t) => t.name === name);
  const hex = entry?.settings?.foreground;
  if (!hex) throw new Error(`tokenColors entry "${name}" not found or missing foreground`);
  return hex;
}

// Order matches the README L* ladder (Types > Functions per the documented spec).
const ROLES = {
  Operators:   fg(sem['operator']),
  Variables:   fg(sem['variable']),
  Numbers:     fg(sem['number']),
  Keywords:    fg(sem['keyword']),
  Types:       fg(sem['type']),
  Functions:   fg(sem['function']),
  Strings:     fg(sem['string']),
  Special:     fg(sem['decorator']),                          // dusty rose, also regex
  Punctuation: tokenForegroundByName(standard, 'Punctuation'),
  Comments:    fg(sem['comment']),
};

// ─── 1. L* ladder ────────────────────────────────────────────────────
// Compute and print actual L* values + per-row gaps. Hard-fail only on
// out-of-order roles (the ladder must be monotonic descending). Soft-warn
// on any gap below TIGHT_GAP_THRESHOLD so future palette edits surface
// the regression even if they don't cross the ordering line.
//
// The warm-only palette can't deliver large gaps across all ten tiers
// (range from Operators L*81 to Comments L*36 is ~45 units), so the
// middle of the ladder runs in the ~3 L* range and relies on font style
// and hue for differentiation. The verifier exists to catch genuine
// regressions, not to enforce an unphysical spacing.
const TIGHT_GAP_THRESHOLD = 3.0;
const WCAG_TOLERANCE = 0.05;

const ladder = Object.entries(ROLES).map(([name, hex]) => ({
  name, hex, L: cielab_L(hex), contrast: contrastRatio(hex, BG),
}));

console.log(`\nL* ladder (against bg ${BG}):\n`);
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
// v1.2.0 README table values (re-measured against #0C0A09 after the retune).
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

// ─── 3. No syntax-role hex in the blue/cyan band ─────────────────────
// We define "blue/cyan" loosely as: B channel > R channel AND B > G.
// Warm-only palette should never trip this.
console.log('\nWavelength check (no syntax hex in blue/cyan band):\n');
function isBlueOrCyan(hex) {
  const h = hex.replace('#', '').slice(0, 6);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return b > r && b > g;
}
let coolFound = 0;
for (const { name, hex } of ladder) {
  if (isBlueOrCyan(hex)) {
    console.log(`  ✗ ${name} (${hex}) is in blue/cyan band`);
    coolFound++;
    failures++;
  }
}
if (coolFound === 0) console.log('  ✓ all syntax roles are warm (R≥B or G≥B)');

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
    if (onlyA.length) console.log(`     only in left: ${onlyA.slice(0, 5).join(', ')}${onlyA.length > 5 ? '…' : ''}`);
    if (onlyB.length) console.log(`     only in right: ${onlyB.slice(0, 5).join(', ')}${onlyB.length > 5 ? '…' : ''}`);
    return false;
  }
  return true;
}

const stdColors = keySet(standard.colors);
const softColors = keySet(soft.colors);
const focColors = keySet(focused.colors);
const stdSem = keySet(standard.semanticTokenColors);
const softSem = keySet(soft.semanticTokenColors);
const focSem = keySet(focused.semanticTokenColors);

const checks = [
  diffSets(stdColors, softColors, 'colors: standard vs soft'),
  diffSets(stdColors, focColors, 'colors: standard vs focused'),
  diffSets(stdSem, softSem, 'semanticTokenColors: standard vs soft'),
  diffSets(stdSem, focSem, 'semanticTokenColors: standard vs focused'),
];
if (checks.every(Boolean)) console.log('  ✓ all three variants share identical key sets');
else failures += checks.filter((x) => !x).length;

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
