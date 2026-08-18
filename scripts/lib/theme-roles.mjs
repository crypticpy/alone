/**
 * Extract the headline syntax roles, font styles, ANSI slots and every hex
 * value from a built theme JSON. Pure functions; no I/O.
 */

import { isHexColor, normalizeHex } from './color.mjs';

/** Foreground of a semanticTokenColors entry (string or { foreground }). */
export function semanticForeground(theme, key) {
  const entry = theme.semanticTokenColors?.[key];
  const hex = typeof entry === 'string' ? entry : entry?.foreground;
  if (!hex) throw new Error(`semanticTokenColors["${key}"] not found or missing foreground`);
  return hex;
}

/** Style flags of a semanticTokenColors entry. */
export function semanticStyle(theme, key) {
  const entry = theme.semanticTokenColors?.[key];
  if (entry === undefined) throw new Error(`semanticTokenColors["${key}"] not found`);
  if (typeof entry === 'string') return normalizeStyle({});
  return normalizeStyle({
    bold: entry.bold === true,
    italic: entry.italic === true,
    underline: entry.underline === true,
    strikethrough: entry.strikethrough === true,
  });
}

/** Foreground of the tokenColors entry with the given `name`. */
export function tokenForeground(theme, name) {
  const entry = theme.tokenColors.find((t) => t.name === name);
  const hex = entry?.settings?.foreground;
  if (!hex) throw new Error(`tokenColors entry "${name}" not found or missing foreground`);
  return hex;
}

/** Style flags of the tokenColors entry with the given `name`. */
export function tokenStyle(theme, name) {
  const entry = theme.tokenColors.find((t) => t.name === name);
  if (!entry) throw new Error(`tokenColors entry "${name}" not found`);
  const words = (entry.settings?.fontStyle ?? '').split(/\s+/).filter(Boolean);
  return normalizeStyle({
    bold: words.includes('bold'),
    italic: words.includes('italic'),
    underline: words.includes('underline'),
    strikethrough: words.includes('strikethrough'),
  });
}

function normalizeStyle({ bold = false, italic = false, underline = false, strikethrough = false } = {}) {
  return { bold, italic, underline, strikethrough };
}

/** True if two style objects differ in any flag (a visual cue beyond colour). */
export function stylesDiffer(a, b) {
  return a.bold !== b.bold || a.italic !== b.italic || a.underline !== b.underline || a.strikethrough !== b.strikethrough;
}

/** Human label for a style, in the README's own vocabulary. */
export function styleLabel(style) {
  const parts = [];
  if (style.bold) parts.push('**Bold**');
  if (style.italic) parts.push('_Italic_');
  if (style.underline) parts.push('underline');
  if (style.strikethrough) parts.push('strikethrough');
  return parts.length ? parts.join(' ') : 'Normal';
}

/**
 * The ten-tier L* ladder, in documented order (top = brightest). Each entry
 * names its source so the same list drives every variant.
 */
export const LADDER_ROLES = [
  { name: 'Operators', sem: 'operator' },
  { name: 'Variables', sem: 'variable' },
  { name: 'Numbers', sem: 'number' },
  { name: 'Keywords', sem: 'keyword' },
  { name: 'Types', sem: 'type' },
  { name: 'Functions', sem: 'function' },
  { name: 'Strings', sem: 'string' },
  { name: 'Special', sem: 'decorator' },
  { name: 'Punctuation', tm: 'Punctuation' },
  { name: 'Comments', sem: 'comment' },
];

/**
 * The README "Syntax Colors" table — a superset of the ladder with the
 * font-style-differentiated roles included.
 */
export const SYNTAX_TABLE_ROLES = [
  { name: 'Operators', sem: 'operator' },
  { name: 'Variables', sem: 'variable' },
  { name: 'Numbers', sem: 'number' },
  { name: 'Keywords', sem: 'keyword' },
  { name: 'Types', sem: 'type' },
  { name: 'Interface/Type-param', sem: 'interface' },
  { name: 'Functions', sem: 'function' },
  { name: 'Built-in funcs', sem: 'function.defaultLibrary' },
  { name: 'Strings', sem: 'string' },
  { name: 'Escapes', tm: 'Escape Characters' },
  { name: 'Regex / decorators', sem: 'regexp' },
  { name: 'Comments', sem: 'comment' },
  { name: 'Errors', tm: 'Invalid Illegal' },
];

/** Roles that behave like identifiers for the APCA "body text" floor. */
export const IDENTIFIER_ROLES = ['Operators', 'Variables', 'Numbers', 'Keywords', 'Types', 'Functions'];

/** Extra roles used by the CVD pair check. */
const CVD_EXTRA_ROLES = [
  { name: 'Escapes', tm: 'Escape Characters' },
  { name: 'Errors', tm: 'Invalid Illegal' },
  { name: 'Parameter', sem: 'parameter' },
  { name: 'DefaultLib', sem: 'variable.defaultLibrary' },
];

/**
 * Pairs whose confusability matters most: adjacent ladder tiers that share
 * hue family, plus the red-vs-warm pairs a red-green observer collapses.
 * Each pair passes if ΔE2000 under simulation stays ≥ threshold OR the two
 * roles differ in font style.
 */
export const CVD_PAIRS = [
  ['Types', 'Functions'],
  ['Functions', 'Strings'],
  ['Keywords', 'Types'],
  ['Numbers', 'Keywords'],
  ['Strings', 'Special'],
  ['Errors', 'Functions'],
  ['Errors', 'Special'],
  ['Escapes', 'Variables'],
  ['DefaultLib', 'Types'],
  ['Variables', 'Parameter'],
];

/** Resolve a role descriptor to { name, hex, style } against a theme. */
export function resolveRole(theme, role) {
  if (role.sem) {
    return { name: role.name, hex: semanticForeground(theme, role.sem), style: semanticStyle(theme, role.sem) };
  }
  return { name: role.name, hex: tokenForeground(theme, role.tm), style: tokenStyle(theme, role.tm) };
}

/** name → { name, hex, style } for the ladder + CVD extras. */
export function roleMap(theme) {
  const out = {};
  for (const r of [...LADDER_ROLES, ...CVD_EXTRA_ROLES]) out[r.name] = resolveRole(theme, r);
  return out;
}

export const ANSI_SLOTS = [
  'Black', 'Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White',
  'BrightBlack', 'BrightRed', 'BrightGreen', 'BrightYellow', 'BrightBlue', 'BrightMagenta', 'BrightCyan', 'BrightWhite',
];

/** [{ slot, key, hex }] for the 16 terminal.ansi* colours. */
export function ansiColors(theme) {
  return ANSI_SLOTS.map((slot) => {
    const key = `terminal.ansi${slot}`;
    const hex = theme.colors?.[key];
    if (!hex) throw new Error(`colors["${key}"] missing`);
    return { slot, key, hex };
  });
}

/** Six bracket-pair foregrounds in depth order. */
export function bracketColors(theme) {
  return [1, 2, 3, 4, 5, 6].map((i) => {
    const key = `editorBracketHighlight.foreground${i}`;
    const hex = theme.colors?.[key];
    if (!hex) throw new Error(`colors["${key}"] missing`);
    return { depth: i, key, hex };
  });
}

/**
 * Every hex-valued leaf in the theme: [{ path, hex }]. `hex` is normalized
 * (uppercase, alpha stripped); `path` is dotted (tokenColors.12.settings.foreground).
 */
export function allHexes(theme) {
  const out = [];
  const visit = (node, p) => {
    if (typeof node === 'string') {
      if (isHexColor(node)) out.push({ path: p, hex: normalizeHex(node) });
      return;
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) visit(v, p ? `${p}.${k}` : k);
    }
  };
  visit(theme, '');
  return out;
}
