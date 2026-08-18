import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { resolveValue, walk, validateVariant, buildTheme, describeType, serializeTheme } from '../scripts/lib/build.mjs';

const OUT = path.resolve('/tmp/alone-themes-out');

test('resolveValue: bare token returns the token value verbatim (any JSON type)', () => {
  const used = new Set();
  assert.equal(resolveValue('${accent}', { accent: '#D4A048' }, 'x', used), '#D4A048');
  assert.equal(resolveValue('${flag}', { flag: true }, 'x', used), true);
  assert.equal(resolveValue('${n}', { n: 3 }, 'x', used), 3);
  assert.deepEqual([...used].sort(), ['accent', 'flag', 'n']);
});

test('resolveValue: embedded tokens interpolate as strings', () => {
  const used = new Set();
  assert.equal(resolveValue('${accent}80', { accent: '#D4A048' }, 'x', used), '#D4A04880');
  assert.equal(resolveValue('${a}-${b}', { a: 1, b: 'z' }, 'x', used), '1-z');
});

test('resolveValue: literals and non-strings pass through', () => {
  const used = new Set();
  assert.equal(resolveValue('#0C0A09', {}, 'x', used), '#0C0A09');
  assert.equal(resolveValue(42, {}, 'x', used), 42);
  assert.equal(used.size, 0);
});

test('resolveValue: unknown tokens throw with the JSON path', () => {
  assert.throws(() => resolveValue('${nope}', {}, 'colors.editor.background', new Set()), /unknown token "nope" at colors\.editor\.background/);
  assert.throws(() => resolveValue('${nope}80', {}, 'colors.x', new Set()), /unknown token "nope" in interpolation at colors\.x/);
});

test('walk: resolves nested objects and arrays, preserving key order', () => {
  const base = { name: '${name}', colors: { 'editor.background': '${bg}', 'x': '#111111' }, tokenColors: [{ settings: { foreground: '${fg}' } }] };
  const out = walk(base, { name: 'T', bg: '#000000', fg: '#FFFFFF' }, new Set());
  assert.deepEqual(out, { name: 'T', colors: { 'editor.background': '#000000', x: '#111111' }, tokenColors: [{ settings: { foreground: '#FFFFFF' } }] });
  assert.deepEqual(Object.keys(out), ['name', 'colors', 'tokenColors']);
});

test('validateVariant: rejects non-object roots with a readable type name', () => {
  for (const [root, label] of [[null, 'null'], [[], 'array'], ['42', 'string'], [undefined, 'undefined']]) {
    assert.throws(() => validateVariant(root, 'v.yaml', OUT), new RegExp(`variant root must be a mapping/object \\(got ${label}\\)`));
  }
  assert.equal(describeType(null), 'null');
  assert.equal(describeType([]), 'array');
});

test('validateVariant: filename and tokens shape', () => {
  assert.throws(() => validateVariant({ tokens: {} }, 'v.yaml', OUT), /"filename" must be a non-empty string \(got undefined\)/);
  assert.throws(() => validateVariant({ filename: '', tokens: {} }, 'v.yaml', OUT), /"filename" must be a non-empty string/);
  assert.throws(() => validateVariant({ filename: 'a.json', tokens: [] }, 'v.yaml', OUT), /"tokens" must be a mapping .* \(got array\)/);
  assert.throws(() => validateVariant({ filename: 'a.json' }, 'v.yaml', OUT), /"tokens" must be a mapping/);
});

test('validateVariant: filenames must be plain names inside the output dir', () => {
  assert.throws(() => validateVariant({ filename: 'sub/a.json', tokens: {} }, 'v.yaml', OUT), /contains a path separator/);
  assert.throws(() => validateVariant({ filename: '/etc/passwd', tokens: {} }, 'v.yaml', OUT), /contains a path separator/);
  assert.throws(() => validateVariant({ filename: '..', tokens: {} }, 'v.yaml', OUT), /resolves outside themes\//);
  assert.throws(() => validateVariant({ filename: '.', tokens: {} }, 'v.yaml', OUT), /resolves outside themes\//);
  assert.equal(validateVariant({ filename: 'a.json', tokens: {} }, 'v.yaml', OUT), path.join(OUT, 'a.json'));
});

test('buildTheme: unused declared tokens are a hard error', () => {
  const base = { colors: { bg: '${bg}' } };
  assert.throws(() => buildTheme(base, { tokens: { bg: '#000', stale: '#fff' } }, 'v.yaml'), /1 declared token\(s\) are not referenced by base\.yaml .*stale/);
  assert.deepEqual(buildTheme(base, { tokens: { bg: '#000' } }, 'v.yaml'), { colors: { bg: '#000' } });
});

test('serializeTheme: 2-space indent with trailing newline', () => {
  assert.equal(serializeTheme({ a: 1 }), '{\n  "a": 1\n}\n');
});
