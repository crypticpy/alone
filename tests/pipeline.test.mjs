/**
 * End-to-end checks on the real _src tree: the build is deterministic, the
 * committed themes/*.json are what the build produces, and each variant keeps
 * the structure (keys, tokenColors rules, semantic selectors, font styles) of
 * the immutable v1.2.0 snapshot — values are allowed to move (2.0.0 retune).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';
import YAML from 'yaml';
import { validateVariant, buildTheme, serializeTheme } from '../scripts/lib/build.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'themes', '_src');
const THEMES = path.join(ROOT, 'themes');
const SNAPSHOT = path.join(THEMES, '_snapshot');

const base = YAML.parse(fs.readFileSync(path.join(SRC, 'base.yaml'), 'utf8'));
const variantFiles = fs.readdirSync(path.join(SRC, 'variants')).filter((f) => f.endsWith('.yaml')).sort();
const variants = variantFiles.map((f) => ({ f, doc: YAML.parse(fs.readFileSync(path.join(SRC, 'variants', f), 'utf8')) }));

test('there is at least one variant and every variant validates', () => {
  assert.ok(variants.length >= 3);
  for (const { f, doc } of variants) validateVariant(doc, f, path.resolve(THEMES));
});

test('build is deterministic: two passes are byte-identical', () => {
  for (const { f, doc } of variants) {
    const a = serializeTheme(buildTheme(base, doc, f));
    const b = serializeTheme(buildTheme(base, doc, f));
    assert.equal(a, b, f);
  }
});

test('committed themes/*.json match a fresh build (run npm run build:themes if this fails)', () => {
  for (const { f, doc } of variants) {
    const built = serializeTheme(buildTheme(base, doc, f));
    const onDisk = fs.readFileSync(path.join(THEMES, doc.filename), 'utf8');
    assert.equal(onDisk, built, `${doc.filename} is stale relative to ${f}`);
  }
});

test('every generated theme carries the color-theme $schema as its first key', () => {
  for (const { f, doc } of variants) {
    const built = buildTheme(base, doc, f);
    assert.equal(Object.keys(built)[0], '$schema', f);
    assert.equal(built.$schema, 'vscode://schemas/color-theme');
  }
});

test('v1.2.0 snapshot structural parity (shape/keys/scopes/fontStyles; values moved in 2.0.0)', () => {
  // The palette was retuned in 2.0.0, so hex values legitimately differ from
  // the immutable v1.2.0 snapshot. What must NOT drift silently is the shape:
  // the same colour keys, the same tokenColors rules (name/scope/fontStyle),
  // the same semanticTokenColors selectors and font styles.
  const shape = (theme) => ({
    colors: Object.keys(theme.colors).sort(),
    tokenColors: theme.tokenColors.map((r) => ({
      name: r.name, scope: r.scope, fontStyle: r.settings?.fontStyle ?? null,
    })),
    semantic: Object.fromEntries(
      Object.entries(theme.semanticTokenColors).map(([k, v]) => [
        k, typeof v === 'string' ? null : (v.fontStyle ?? null),
      ]).sort(([a], [b]) => a.localeCompare(b))
    ),
  });
  for (const { f, doc } of variants) {
    const snapPath = path.join(SNAPSHOT, doc.filename);
    if (!fs.existsSync(snapPath)) continue; // variants added after v1.2.0 have no snapshot
    const built = buildTheme(base, doc, f);
    const snap = JSON.parse(fs.readFileSync(snapPath, 'utf8'));
    assert.deepEqual(shape(built), shape(snap), `${doc.filename} shape diverges from themes/_snapshot`);
  }
});

test('verifier exits 0 on the committed palette and reports README tables current', () => {
  const out = execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'verify-palette.mjs')], { encoding: 'utf8' });
  assert.match(out, /README tables match the palette/);
  assert.match(out, /✓ all (hard )?checks passed/);
});
