/**
 * Markdown helpers for verifier-rendered README sections.
 *
 * A rendered block lives between two HTML-comment markers:
 *
 *   <!-- verify:<name>:start -->
 *
 *   ...generated markdown...
 *
 *   <!-- verify:<name>:end -->
 *
 * The blank lines are part of the contract so the markdown that follows the
 * start comment begins a fresh block rather than being swallowed into the
 * HTML comment block.
 */

export function startMarker(name) {
  return `<!-- verify:${name}:start -->`;
}
export function endMarker(name) {
  return `<!-- verify:${name}:end -->`;
}

/** Full block text for a section body (body should not have surrounding blank lines). */
export function renderBlock(name, body) {
  return `${startMarker(name)}\n\n${body.replace(/\s+$/, '')}\n\n${endMarker(name)}`;
}

/** Locate a marker block. Returns { start, end } indexes into `text` (inclusive of markers) or null. */
export function findBlock(text, name) {
  const s = text.indexOf(startMarker(name));
  if (s === -1) return null;
  const e = text.indexOf(endMarker(name), s);
  if (e === -1) throw new Error(`README: found ${startMarker(name)} without a matching end marker`);
  return { start: s, end: e + endMarker(name).length };
}

/** Replace the block named `name` with `body`. Throws if the block is absent. */
export function replaceBlock(text, name, body) {
  const loc = findBlock(text, name);
  if (!loc) throw new Error(`README: missing marker block "${name}" (${startMarker(name)} … ${endMarker(name)})`);
  return text.slice(0, loc.start) + renderBlock(name, body) + text.slice(loc.end);
}

/** GitHub-flavoured markdown table with padded columns. */
export function mdTable(headers, rows) {
  const cols = headers.length;
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
  const line = (cells) => '| ' + cells.map((c, i) => String(c).padEnd(widths[i])).join(' | ') + ' |';
  const sep = '| ' + widths.map((w) => '-'.repeat(w)).join(' | ') + ' |';
  if (rows.some((r) => r.length !== cols)) throw new Error('mdTable: ragged rows');
  return [line(headers), sep, ...rows.map(line)].join('\n');
}
