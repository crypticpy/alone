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

// Diagnostic helpers for the variant-shape validation below. `typeof null`
// is "object" and `typeof []` is "object" — both are useless in error
// messages, so describeType normalizes to the labels a user actually
// recognizes ("null", "array", "undefined", "string", …). isPlainObject
// is the dual: matches what `tokens` and the variant root must be.
function describeType(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

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

// Track resolved-path → source variant yaml so we can fail fast on
// collisions. We canonicalize via path.resolve so two variants with
// e.g. "foo.json" and "./foo.json" collide as the same destination.
// The error-message contract is "plain JSON names under themes/", so
// we also reject any filename containing a path separator (subdirectories
// are not part of the pipeline's output shape — all theme JSONs live
// flat in themes/).
const seenFilenames = new Map();
const OUT_ABS = path.resolve(OUT);

for (const f of variantFiles) {
  const variant = loadYaml(path.join(variantsDir, f));

  // Variant-shape validation. yaml.parse will hand us whatever's in the
  // source — including the document root being null (empty file), a
  // scalar (e.g. just "42"), or an array — so guard at the boundary in
  // three steps: root must be a mapping, filename must be a non-empty
  // string, tokens must be a mapping. Without the root guard, the
  // `variant.filename` access on a null root would throw a raw TypeError
  // before our validation runs.
  if (!isPlainObject(variant)) {
    throw new Error(
      `${f}: variant root must be a mapping/object (got ${describeType(variant)}).`
    );
  }
  if (typeof variant.filename !== 'string' || variant.filename.length === 0) {
    throw new Error(
      `${f}: "filename" must be a non-empty string (got ${describeType(variant.filename)}). ` +
        `Variant filenames must be plain JSON names under themes/.`
    );
  }
  if (!isPlainObject(variant.tokens)) {
    throw new Error(
      `${f}: "tokens" must be a mapping of token-name → value (got ${describeType(variant.tokens)}).`
    );
  }

  // Reject anything containing a path separator. Catches "sub/foo.json"
  // (which would have passed the containment check below) and absolute
  // paths like "/etc/passwd". On POSIX path.sep === '/' so the second
  // disjunct is redundant; on Windows it catches backslash separators.
  if (variant.filename.includes('/') || variant.filename.includes(path.sep)) {
    throw new Error(
      `${f}: filename "${variant.filename}" contains a path separator. ` +
        `Variant filenames must be plain JSON names under themes/.`
    );
  }

  // Canonical containment check. resolvedOut must live strictly inside
  // OUT_ABS — anything else (filename of ".", "..", or a path that
  // resolves outside the dir) is rejected. startsWith(OUT_ABS + sep) is
  // the canonical pattern for "path inside directory"; it handles the
  // empty-relative, parent-dir, and Windows-different-drive cases in
  // one check.
  const resolvedOut = path.resolve(OUT_ABS, variant.filename);
  if (!resolvedOut.startsWith(OUT_ABS + path.sep)) {
    throw new Error(
      `${f}: filename "${variant.filename}" resolves outside themes/ (${resolvedOut}). ` +
        `Variant filenames must be plain JSON names under themes/.`
    );
  }

  if (seenFilenames.has(resolvedOut)) {
    const prior = seenFilenames.get(resolvedOut);
    throw new Error(
      `${f}: filename "${variant.filename}" (canonical: ${path.relative(OUT_ABS, resolvedOut)}) ` +
        `already used by ${prior}. Each variant must produce a unique output JSON.`
    );
  }
  seenFilenames.set(resolvedOut, f);

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

  // Match the snapshot format: 2-space indent, trailing newline.
  fs.writeFileSync(resolvedOut, JSON.stringify(built, null, 2) + '\n');
  console.log(`  wrote ${path.relative(ROOT, resolvedOut)}  (${variant.display})`);
}
