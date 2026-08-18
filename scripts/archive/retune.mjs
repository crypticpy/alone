#!/usr/bin/env node
/**
 * One-shot retune script for the Alone theme (v1.2.0).
 *
 * Applies the palette changes documented in docs/plans/2026-05-21-theme-retune.md
 * to the three theme JSONs in themes/. Uses anchored string find/replace so
 * the source files keep their blank-line structure (JSON.parse/stringify would
 * collapse the visual sections).
 *
 * Each edit's `find` includes a unique anchor (typically a JSON key) and we
 * assert that every edit matches at least once — silent misses fail the run.
 *
 * Usage: node scripts/archive/retune.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const THEMES = path.join(HERE, '..', '..', 'themes'); // scripts/archive/ → repo root

// ────────────────────────────────────────────────────────────────────
// Palette deltas — see docs/plans/2026-05-21-theme-retune.md for rationale.
//
// Standard palette changes (v1.1.0 → v1.2.0):
//   Functions:        #B07850 (L* 57) → #C08868 (L* 62)   ladder fix + Function/Type gap
//   Cursor:           #E8B850 (L* 80) → #D4A048 (L* 70)   drop brightest hex on near-black
//   Find-match:       gold family   → burnt-sienna     hue offset from selection gold
//   Inlay hint fg:    #5C544A (L* 37) → #7A7268 (L* 49)   raise above comments
//   Bracket pairs:    narrow gold band → monotonic L* descent (75 → 35) (depth = dimness)
//   Escape chars:     #A87878 italic  → #D4B088 bold      pop out of italic strings
//   Semantic tokens:  interface/typeParameter/namespace/module/defaultLibrary → italic
// ────────────────────────────────────────────────────────────────────

/** Edits shared by Standard and Focused (Focused inherits Standard syntax). */
const STANDARD_EDITS = [
  // #1, #5 Functions: global hex swap (hex only appears in Function/Method roles).
  { find: /#B07850/g, replace: '#C08868', label: 'functions L*57→62' },

  // #3 Cursor: drop brightest gold to mid-tier gold.
  { find: /"editorCursor\.foreground": "#E8B850"/, replace: '"editorCursor.foreground": "#D4A048"', label: 'editor cursor' },
  { find: /"terminalCursor\.foreground": "#E8B850"/, replace: '"terminalCursor.foreground": "#D4A048"', label: 'terminal cursor' },

  // #6 Find match hue offset: gold family → burnt-sienna (#C89068) family.
  { find: /"editor\.findMatchBackground": "#D4A04850"/, replace: '"editor.findMatchBackground": "#C8906850"', label: 'findMatch bg' },
  { find: /"editor\.findMatchBorder": "#E8B850"/, replace: '"editor.findMatchBorder": "#C89068"', label: 'findMatch border' },
  { find: /"editor\.findMatchHighlightBackground": "#D4A04830"/, replace: '"editor.findMatchHighlightBackground": "#C8906830"', label: 'findMatchHighlight bg' },
  { find: /"editor\.findMatchHighlightBorder": "#D4A04860"/, replace: '"editor.findMatchHighlightBorder": "#C8906860"', label: 'findMatchHighlight border' },
  { find: /"searchEditor\.findMatchBackground": "#D4A04840"/, replace: '"searchEditor.findMatchBackground": "#C8906840"', label: 'searchEditor findMatch bg' },
  { find: /"searchEditor\.findMatchBorder": "#D4A048"/, replace: '"searchEditor.findMatchBorder": "#C89068"', label: 'searchEditor findMatch border' },

  // #7 Inlay hint contrast tier: raise foreground from L*37 → L*49.
  { find: /"editorInlayHint\.foreground": "#5C544A"/, replace: '"editorInlayHint.foreground": "#7A7268"', label: 'inlayHint fg' },
  { find: /"editorInlayHint\.typeForeground": "#6B635A"/, replace: '"editorInlayHint.typeForeground": "#7A7268"', label: 'inlayHint typeFg' },
  { find: /"editorInlayHint\.parameterForeground": "#6B635A"/, replace: '"editorInlayHint.parameterForeground": "#8A8278"', label: 'inlayHint paramFg' },

  // #4 Bracket pair colors: monotonic L* descent so depth maps to dimness.
  // Old:  D4A048 / C89068 / B8956E / A89860 / C4A078 / D4B088 (all L* ~58-72, no descent)
  // New:  E0B868 / C89868 / B08458 / 967048 / 7A5C3C / 604830 (L* ~78 / 67 / 58 / 50 / 42 / 34)
  { find: /"editorBracketHighlight\.foreground1": "#D4A048"/, replace: '"editorBracketHighlight.foreground1": "#E0B868"', label: 'bracket1' },
  { find: /"editorBracketHighlight\.foreground2": "#C89068"/, replace: '"editorBracketHighlight.foreground2": "#C89868"', label: 'bracket2' },
  { find: /"editorBracketHighlight\.foreground3": "#B8956E"/, replace: '"editorBracketHighlight.foreground3": "#B08458"', label: 'bracket3' },
  { find: /"editorBracketHighlight\.foreground4": "#A89860"/, replace: '"editorBracketHighlight.foreground4": "#967048"', label: 'bracket4' },
  { find: /"editorBracketHighlight\.foreground5": "#C4A078"/, replace: '"editorBracketHighlight.foreground5": "#7A5C3C"', label: 'bracket5' },
  { find: /"editorBracketHighlight\.foreground6": "#D4B088"/, replace: '"editorBracketHighlight.foreground6": "#604830"', label: 'bracket6' },

  // Bracket pair guides — match the new bracket colors (alpha preserved).
  { find: /"editorBracketPairGuide\.activeBackground1": "#D4A04860"/, replace: '"editorBracketPairGuide.activeBackground1": "#E0B86860"', label: 'guide active 1' },
  { find: /"editorBracketPairGuide\.activeBackground2": "#C8906860"/, replace: '"editorBracketPairGuide.activeBackground2": "#C8986860"', label: 'guide active 2' },
  { find: /"editorBracketPairGuide\.activeBackground3": "#B8956E60"/, replace: '"editorBracketPairGuide.activeBackground3": "#B0845860"', label: 'guide active 3' },
  { find: /"editorBracketPairGuide\.activeBackground4": "#A8986060"/, replace: '"editorBracketPairGuide.activeBackground4": "#96704860"', label: 'guide active 4' },
  { find: /"editorBracketPairGuide\.activeBackground5": "#C4A07860"/, replace: '"editorBracketPairGuide.activeBackground5": "#7A5C3C60"', label: 'guide active 5' },
  { find: /"editorBracketPairGuide\.activeBackground6": "#D4B08860"/, replace: '"editorBracketPairGuide.activeBackground6": "#60483060"', label: 'guide active 6' },
  { find: /"editorBracketPairGuide\.background1": "#D4A04830"/, replace: '"editorBracketPairGuide.background1": "#E0B86830"', label: 'guide bg 1' },
  { find: /"editorBracketPairGuide\.background2": "#C8906830"/, replace: '"editorBracketPairGuide.background2": "#C8986830"', label: 'guide bg 2' },
  { find: /"editorBracketPairGuide\.background3": "#B8956E30"/, replace: '"editorBracketPairGuide.background3": "#B0845830"', label: 'guide bg 3' },
  { find: /"editorBracketPairGuide\.background4": "#A8986030"/, replace: '"editorBracketPairGuide.background4": "#96704830"', label: 'guide bg 4' },
  { find: /"editorBracketPairGuide\.background5": "#C4A07830"/, replace: '"editorBracketPairGuide.background5": "#7A5C3C30"', label: 'guide bg 5' },
  { find: /"editorBracketPairGuide\.background6": "#D4B08830"/, replace: '"editorBracketPairGuide.background6": "#60483030"', label: 'guide bg 6' },

  // #9 Escape characters: split off the dusty-rose; make them pop inside italic strings.
  // Replace the Escape Characters block's foreground (A87878 italic) → D4B088 bold.
  {
    find: /(\{\s*\n\s*"name": "Escape Characters",\s*\n\s*"scope": \[\s*\n\s*"constant\.character\.escape",\s*\n\s*"constant\.character\.unicode"\s*\n\s*\],\s*\n\s*"settings": \{\s*\n\s*"foreground": ")#A87878(",\s*\n\s*"fontStyle": ")italic(")/,
    replace: '$1#D4B088$2bold$3',
    label: 'escape chars'
  },

  // #2 Semantic-token differentiation: italic on interface/typeParameter/namespace/module.
  { find: /"interface": "#9A8048",\n    "interface\.declaration": "#9A8048",/,
    replace: '"interface": { "foreground": "#9A8048", "italic": true },\n    "interface.declaration": { "foreground": "#9A8048", "italic": true },',
    label: 'interface italic' },
  { find: /"typeParameter": "#9A8048",/,
    replace: '"typeParameter": { "foreground": "#9A8048", "italic": true },',
    label: 'typeParameter italic' },
  { find: /"namespace": "#9A8048",\n    "module": "#9A8048",/,
    replace: '"namespace": { "foreground": "#9A8048", "italic": true },\n    "module": { "foreground": "#9A8048", "italic": true },',
    label: 'namespace/module italic' },

  // #8 defaultLibrary differentiation: italic on function/method/variable/property defaults.
  // Note: function.defaultLibrary and method.defaultLibrary already had their hex globally
  // remapped (#B07850 → #C08868) above, so we match the NEW hex here.
  { find: /"function\.defaultLibrary": "#C08868",/,
    replace: '"function.defaultLibrary": { "foreground": "#C08868", "italic": true },',
    label: 'function.defaultLibrary italic' },
  { find: /"method\.defaultLibrary": "#C08868",/,
    replace: '"method.defaultLibrary": { "foreground": "#C08868", "italic": true },',
    label: 'method.defaultLibrary italic' },
  { find: /"variable\.defaultLibrary": "#B89860",/,
    replace: '"variable.defaultLibrary": { "foreground": "#B89860", "italic": true },',
    label: 'variable.defaultLibrary italic' },
  { find: /"property\.defaultLibrary": "#B89860",/,
    replace: '"property.defaultLibrary": { "foreground": "#B89860", "italic": true },',
    label: 'property.defaultLibrary italic' },
];

/** Edits for the Soft variant (~80% luminance of Standard). */
const SOFT_EDITS = [
  // #1, #5 Functions: 0.8 scale of new Standard #C08868 → #9A6D53.
  { find: /#8D6040/g, replace: '#9A6D53', label: 'soft functions' },

  // #3 Cursor: dim Standard's new #D4A048 by 0.8 → #A08033 (already present elsewhere in Soft as the gold accent).
  { find: /"editorCursor\.foreground": "#BA9340"/, replace: '"editorCursor.foreground": "#A08033"', label: 'soft editor cursor' },
  { find: /"terminalCursor\.foreground": "#BA9340"/, replace: '"terminalCursor.foreground": "#A08033"', label: 'soft terminal cursor' },

  // #6 Find match hue offset: Soft's existing gold (#AA8039) → Soft's burnt-sienna (#A07353).
  { find: /"editor\.findMatchBackground": "#AA803940"/, replace: '"editor.findMatchBackground": "#A0735340"', label: 'soft findMatch bg' },
  { find: /"editor\.findMatchBorder": "#BA9340"/, replace: '"editor.findMatchBorder": "#A07353"', label: 'soft findMatch border' },
  { find: /"editor\.findMatchHighlightBackground": "#AA803925"/, replace: '"editor.findMatchHighlightBackground": "#A0735325"', label: 'soft findMatchHighlight bg' },
  { find: /"editor\.findMatchHighlightBorder": "#AA803950"/, replace: '"editor.findMatchHighlightBorder": "#A0735350"', label: 'soft findMatchHighlight border' },
  { find: /"searchEditor\.findMatchBackground": "#AA803935"/, replace: '"searchEditor.findMatchBackground": "#A0735335"', label: 'soft searchEditor findMatch bg' },
  { find: /"searchEditor\.findMatchBorder": "#AA8039"/, replace: '"searchEditor.findMatchBorder": "#A07353"', label: 'soft searchEditor findMatch border' },

  // #7 Inlay hint contrast: Soft already has the right tier (foreground #625B53 = L*~40).
  //    No edits needed for Soft inlay hints.

  // #4 Bracket pairs: 0.8 scale of new Standard spread.
  //   Std E0B868 / C89868 / B08458 / 967048 / 7A5C3C / 604830
  //   Soft B39353 / A07A53 / 8C6946 / 785939 / 614A30 / 4D3A26
  { find: /"editorBracketHighlight\.foreground1": "#AA8039"/, replace: '"editorBracketHighlight.foreground1": "#B39353"', label: 'soft bracket1' },
  { find: /"editorBracketHighlight\.foreground2": "#A07353"/, replace: '"editorBracketHighlight.foreground2": "#A07A53"', label: 'soft bracket2' },
  { find: /"editorBracketHighlight\.foreground3": "#937758"/, replace: '"editorBracketHighlight.foreground3": "#8C6946"', label: 'soft bracket3' },
  { find: /"editorBracketHighlight\.foreground4": "#867A4D"/, replace: '"editorBracketHighlight.foreground4": "#785939"', label: 'soft bracket4' },
  { find: /"editorBracketHighlight\.foreground5": "#9D8060"/, replace: '"editorBracketHighlight.foreground5": "#614A30"', label: 'soft bracket5' },
  { find: /"editorBracketHighlight\.foreground6": "#AA8D6D"/, replace: '"editorBracketHighlight.foreground6": "#4D3A26"', label: 'soft bracket6' },

  // Bracket pair guides — Soft uses alpha 50 (active) and 25 (idle).
  { find: /"editorBracketPairGuide\.activeBackground1": "#AA803950"/, replace: '"editorBracketPairGuide.activeBackground1": "#B3935350"', label: 'soft guide active 1' },
  { find: /"editorBracketPairGuide\.activeBackground2": "#A0735350"/, replace: '"editorBracketPairGuide.activeBackground2": "#A07A5350"', label: 'soft guide active 2' },
  { find: /"editorBracketPairGuide\.activeBackground3": "#93775850"/, replace: '"editorBracketPairGuide.activeBackground3": "#8C694650"', label: 'soft guide active 3' },
  { find: /"editorBracketPairGuide\.activeBackground4": "#867A4D50"/, replace: '"editorBracketPairGuide.activeBackground4": "#78593950"', label: 'soft guide active 4' },
  { find: /"editorBracketPairGuide\.activeBackground5": "#9D806050"/, replace: '"editorBracketPairGuide.activeBackground5": "#614A3050"', label: 'soft guide active 5' },
  { find: /"editorBracketPairGuide\.activeBackground6": "#AA8D6D50"/, replace: '"editorBracketPairGuide.activeBackground6": "#4D3A2650"', label: 'soft guide active 6' },
  { find: /"editorBracketPairGuide\.background1": "#AA803925"/, replace: '"editorBracketPairGuide.background1": "#B3935325"', label: 'soft guide bg 1' },
  { find: /"editorBracketPairGuide\.background2": "#A0735325"/, replace: '"editorBracketPairGuide.background2": "#A07A5325"', label: 'soft guide bg 2' },
  { find: /"editorBracketPairGuide\.background3": "#93775825"/, replace: '"editorBracketPairGuide.background3": "#8C694625"', label: 'soft guide bg 3' },
  { find: /"editorBracketPairGuide\.background4": "#867A4D25"/, replace: '"editorBracketPairGuide.background4": "#78593925"', label: 'soft guide bg 4' },
  { find: /"editorBracketPairGuide\.background5": "#9D806025"/, replace: '"editorBracketPairGuide.background5": "#614A3025"', label: 'soft guide bg 5' },
  { find: /"editorBracketPairGuide\.background6": "#AA8D6D25"/, replace: '"editorBracketPairGuide.background6": "#4D3A2625"', label: 'soft guide bg 6' },

  // #9 Escape characters: split off Soft's dusty-rose (#866060) → #AA8D6D bold.
  {
    find: /(\{\s*\n\s*"name": "Escape Characters",\s*\n\s*"scope": \[\s*\n\s*"constant\.character\.escape",\s*\n\s*"constant\.character\.unicode"\s*\n\s*\],\s*\n\s*"settings": \{\s*\n\s*"foreground": ")#866060(",\s*\n\s*"fontStyle": ")italic(")/,
    replace: '$1#AA8D6D$2bold$3',
    label: 'soft escape chars'
  },

  // #2 Semantic-token differentiation in Soft (interface/typeParameter/namespace/module).
  // Soft uses #7B663A for these.
  { find: /"interface": "#7B663A",\n    "interface\.declaration": "#7B663A",/,
    replace: '"interface": { "foreground": "#7B663A", "italic": true },\n    "interface.declaration": { "foreground": "#7B663A", "italic": true },',
    label: 'soft interface italic' },
  { find: /"typeParameter": "#7B663A",/,
    replace: '"typeParameter": { "foreground": "#7B663A", "italic": true },',
    label: 'soft typeParameter italic' },
  { find: /"namespace": "#7B663A",\n    "module": "#7B663A",/,
    replace: '"namespace": { "foreground": "#7B663A", "italic": true },\n    "module": { "foreground": "#7B663A", "italic": true },',
    label: 'soft namespace/module italic' },

  // #8 Soft defaultLibrary italic. function/method defaultLibrary now use the new #9A6D53.
  { find: /"function\.defaultLibrary": "#9A6D53",/,
    replace: '"function.defaultLibrary": { "foreground": "#9A6D53", "italic": true },',
    label: 'soft function.defaultLibrary italic' },
  { find: /"method\.defaultLibrary": "#9A6D53",/,
    replace: '"method.defaultLibrary": { "foreground": "#9A6D53", "italic": true },',
    label: 'soft method.defaultLibrary italic' },
  { find: /"variable\.defaultLibrary": "#937A4D",/,
    replace: '"variable.defaultLibrary": { "foreground": "#937A4D", "italic": true },',
    label: 'soft variable.defaultLibrary italic' },
  { find: /"property\.defaultLibrary": "#937A4D",/,
    replace: '"property.defaultLibrary": { "foreground": "#937A4D", "italic": true },',
    label: 'soft property.defaultLibrary italic' },
];

/** Focused variant: same syntax as Standard, but UI chrome uses dimmer alpha values.
 *  We start from STANDARD_EDITS and override the bracket-guide / find-match
 *  entries whose alpha differs in the Focused source. */
const FOCUSED_OVERRIDES = new Map([
  // searchEditor border uses 80 alpha in Focused, not solid.
  ['searchEditor findMatch border', { find: /"searchEditor\.findMatchBorder": "#D4A04880"/, replace: '"searchEditor.findMatchBorder": "#C8906880"', label: 'searchEditor findMatch border' }],
  // Focused doesn't set editor.findMatchHighlightBorder (it's transparent #00000000). Skip.
  ['findMatchHighlight border', null],
  // Bracket-pair guides use alpha 40 (active) and 20 (idle) in Focused, not 60/30.
  ['guide active 1', { find: /"editorBracketPairGuide\.activeBackground1": "#D4A04840"/, replace: '"editorBracketPairGuide.activeBackground1": "#E0B86840"', label: 'guide active 1' }],
  ['guide active 2', { find: /"editorBracketPairGuide\.activeBackground2": "#C8906840"/, replace: '"editorBracketPairGuide.activeBackground2": "#C8986840"', label: 'guide active 2' }],
  ['guide active 3', { find: /"editorBracketPairGuide\.activeBackground3": "#B8956E40"/, replace: '"editorBracketPairGuide.activeBackground3": "#B0845840"', label: 'guide active 3' }],
  ['guide active 4', { find: /"editorBracketPairGuide\.activeBackground4": "#A8986040"/, replace: '"editorBracketPairGuide.activeBackground4": "#96704840"', label: 'guide active 4' }],
  ['guide active 5', { find: /"editorBracketPairGuide\.activeBackground5": "#C4A07840"/, replace: '"editorBracketPairGuide.activeBackground5": "#7A5C3C40"', label: 'guide active 5' }],
  ['guide active 6', { find: /"editorBracketPairGuide\.activeBackground6": "#D4B08840"/, replace: '"editorBracketPairGuide.activeBackground6": "#60483040"', label: 'guide active 6' }],
  ['guide bg 1', { find: /"editorBracketPairGuide\.background1": "#D4A04820"/, replace: '"editorBracketPairGuide.background1": "#E0B86820"', label: 'guide bg 1' }],
  ['guide bg 2', { find: /"editorBracketPairGuide\.background2": "#C8906820"/, replace: '"editorBracketPairGuide.background2": "#C8986820"', label: 'guide bg 2' }],
  ['guide bg 3', { find: /"editorBracketPairGuide\.background3": "#B8956E20"/, replace: '"editorBracketPairGuide.background3": "#B0845820"', label: 'guide bg 3' }],
  ['guide bg 4', { find: /"editorBracketPairGuide\.background4": "#A8986020"/, replace: '"editorBracketPairGuide.background4": "#96704820"', label: 'guide bg 4' }],
  ['guide bg 5', { find: /"editorBracketPairGuide\.background5": "#C4A07820"/, replace: '"editorBracketPairGuide.background5": "#7A5C3C20"', label: 'guide bg 5' }],
  ['guide bg 6', { find: /"editorBracketPairGuide\.background6": "#D4B08820"/, replace: '"editorBracketPairGuide.background6": "#60483020"', label: 'guide bg 6' }],
]);

const FOCUSED_EDITS = STANDARD_EDITS
  .map((e) => {
    if (FOCUSED_OVERRIDES.has(e.label)) return FOCUSED_OVERRIDES.get(e.label);
    return e;
  })
  .filter(Boolean);

/** Applies an edit list to a file. Every edit must match at least once.
 *  `find` is always a RegExp (string-form is rejected to avoid accidental
 *  regex interpretation of literal substrings). One-shot script — to
 *  re-run it, `git checkout -- themes/` first. */
function applyEdits(file, edits) {
  let content = fs.readFileSync(file, 'utf8');
  const misses = [];
  for (const { find, replace, label } of edits) {
    if (!(find instanceof RegExp)) {
      throw new Error(`edit "${label}": find must be a RegExp, got ${typeof find}`);
    }
    const before = content;
    content = content.replace(find, replace);
    if (content === before) misses.push(label);
  }
  if (misses.length) {
    throw new Error(`${path.basename(file)}: edits with zero matches:\n  - ${misses.join('\n  - ')}`);
  }
  try {
    JSON.parse(content);
  } catch (e) {
    throw new Error(`${path.basename(file)}: produced invalid JSON: ${e.message}`);
  }
  fs.writeFileSync(file, content);
  console.log(`  ${path.basename(file)}: ${edits.length} edits applied`);
}

console.log('Applying palette retune (v1.2.0)...\n');

applyEdits(path.join(THEMES, 'alone-color-theme.json'), STANDARD_EDITS);
applyEdits(path.join(THEMES, 'alone-focused-color-theme.json'), FOCUSED_EDITS);
applyEdits(path.join(THEMES, 'alone-soft-color-theme.json'), SOFT_EDITS);

console.log('\nDone.');
