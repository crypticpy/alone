#!/usr/bin/env node
/**
 * Theme generator.
 *
 * Reads themes/_src/base.yaml (structural skeleton with ${token} placeholders
 * at leaves that vary across variants) and themes/_src/variants/*.yaml (per-
 * variant token bindings) and emits themes/<filename>.json for each variant.
 *
 * Token substitution rule:
 *   - A leaf string of the form "${name}" is replaced by the variant's
 *     tokens[name] value verbatim. The replaced value can be any JSON type
 *     (string, number, boolean) — typically a hex color string.
 *   - A leaf string containing "${name}" inside other characters (e.g.
 *     "${accent}80" for an alpha-suffixed color) is replaced by string
 *     interpolation: each ${name} substring becomes the stringified token
 *     value. The current base.yaml only uses bare "${name}" leaves, but
 *     the interpolation path is supported for future hand-edited base.yaml
 *     entries that want to share a token across alpha variants.
 *   - Non-string leaves (numbers, booleans) and literal strings (no `${`)
 *     pass through unchanged.
 *
 * Output ordering: object key order follows base.yaml insertion order
 * (preserved by the yaml package on parse and by JSON.stringify on emit).
 * The build is deterministic.
 *
 * Usage: node scripts/build-themes.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import YAML from 'yaml';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const SRC = path.join(ROOT, 'themes', '_src');
const OUT = path.join(ROOT, 'themes');

const TOKEN_RE = /\$\{([^}]+)\}/g;
const BARE_TOKEN_RE = /^\$\{([^}]+)\}$/;

function resolveValue(val, tokens, ctxPath, used) {
  if (typeof val !== 'string') return val;
  const bare = val.match(BARE_TOKEN_RE);
  if (bare) {
    const name = bare[1];
    if (!(name in tokens)) {
      throw new Error(`unknown token "${name}" at ${ctxPath}`);
    }
    used.add(name);
    return tokens[name];
  }
  if (val.includes('${')) {
    return val.replace(TOKEN_RE, (_, name) => {
      if (!(name in tokens)) {
        throw new Error(`unknown token "${name}" in interpolation at ${ctxPath}`);
      }
      used.add(name);
      return String(tokens[name]);
    });
  }
  return val;
}

function walk(node, tokens, used, pathArr = []) {
  if (node === null || node === undefined) return node;
  if (typeof node !== 'object') {
    return resolveValue(node, tokens, pathArr.join('.'), used);
  }
  if (Array.isArray(node)) {
    return node.map((item, i) => walk(item, tokens, used, [...pathArr, i]));
  }
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    out[k] = walk(v, tokens, used, [...pathArr, k]);
  }
  return out;
}

function loadYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

const base = loadYaml(path.join(SRC, 'base.yaml'));
const variantsDir = path.join(SRC, 'variants');
const variantFiles = fs
  .readdirSync(variantsDir)
  .filter((f) => f.endsWith('.yaml'))
  .sort();

if (variantFiles.length === 0) {
  console.error(`No variant files found in ${variantsDir}`);
  process.exit(1);
}

// Track filename → source variant yaml so we can fail fast on collisions.
// Two variants writing to the same themes/<filename>.json would silently
// race; ordering by readdir is not stable enough to call this "the user
// intended the later one to win".
const seenFilenames = new Map();

for (const f of variantFiles) {
  const variant = loadYaml(path.join(variantsDir, f));
  if (!variant.filename || !variant.tokens) {
    throw new Error(`${f}: missing required keys "filename" and/or "tokens"`);
  }
  if (seenFilenames.has(variant.filename)) {
    const prior = seenFilenames.get(variant.filename);
    throw new Error(
      `${f}: filename "${variant.filename}" already used by ${prior}. ` +
        `Each variant must produce a unique output JSON.`
    );
  }
  seenFilenames.set(variant.filename, f);

  // Resolve, tracking which tokens were actually referenced by base.yaml.
  const used = new Set();
  const built = walk(base, variant.tokens, used);

  // Surface unused tokens — typo'd or stale declarations that silently ship
  // wrong values when later edits add a reference under a slightly different
  // name. Hard-fail rather than warn: a build that quietly drifts is exactly
  // what this pipeline exists to prevent.
  const declared = new Set(Object.keys(variant.tokens));
  const unused = [...declared].filter((t) => !used.has(t));
  if (unused.length > 0) {
    throw new Error(
      `${f}: ${unused.length} declared token(s) are not referenced by base.yaml ` +
        `(typo or stale binding): ${unused.slice(0, 8).join(', ')}` +
        (unused.length > 8 ? `, …(+${unused.length - 8} more)` : '')
    );
  }

  const outPath = path.join(OUT, variant.filename);
  // Match the snapshot format: 2-space indent, trailing newline.
  fs.writeFileSync(outPath, JSON.stringify(built, null, 2) + '\n');
  console.log(`  wrote ${path.relative(ROOT, outPath)}  (${variant.display})`);
}
