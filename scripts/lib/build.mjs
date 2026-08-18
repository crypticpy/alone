/**
 * Pure core of the theme generator (see scripts/build-themes.mjs for the
 * CLI). Kept dependency-free and side-effect-free so tests can exercise the
 * token-resolution and variant-validation rules directly.
 *
 * Token substitution rule:
 *   - A leaf string of the form "${name}" is replaced by the variant's
 *     tokens[name] value verbatim. The replaced value can be any JSON type
 *     (string, number, boolean) — typically a hex color string.
 *   - A leaf string containing "${name}" inside other characters (e.g.
 *     "${accent}80" for an alpha-suffixed color) is replaced by string
 *     interpolation: each ${name} substring becomes the stringified token
 *     value.
 *   - Non-string leaves (numbers, booleans) and literal strings (no `${`)
 *     pass through unchanged.
 */

import path from 'node:path';

const TOKEN_RE = /\$\{([^}]+)\}/g;
const BARE_TOKEN_RE = /^\$\{([^}]+)\}$/;

// Diagnostic helpers for the variant-shape validation below. `typeof null`
// is "object" and `typeof []` is "object" — both are useless in error
// messages, so describeType normalizes to the labels a user actually
// recognizes ("null", "array", "undefined", "string", …). isPlainObject
// is the dual: matches what `tokens` and the variant root must be.
export function describeType(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function resolveValue(val, tokens, ctxPath, used) {
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

export function walk(node, tokens, used, pathArr = []) {
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

/**
 * Validate a parsed variant document and resolve its output path.
 *
 * Steps: root must be a mapping, filename must be a non-empty string with no
 * path separators that resolves strictly inside outAbs, tokens must be a
 * mapping. `f` is the source filename used in error messages. Returns the
 * canonical absolute output path.
 */
export function validateVariant(variant, f, outAbs) {
  if (!isPlainObject(variant)) {
    throw new Error(`${f}: variant root must be a mapping/object (got ${describeType(variant)}).`);
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
  // outAbs — anything else (filename of ".", "..", or a path that resolves
  // outside the dir) is rejected.
  const resolvedOut = path.resolve(outAbs, variant.filename);
  if (!resolvedOut.startsWith(outAbs + path.sep)) {
    throw new Error(
      `${f}: filename "${variant.filename}" resolves outside themes/ (${resolvedOut}). ` +
        `Variant filenames must be plain JSON names under themes/.`
    );
  }
  return resolvedOut;
}

/**
 * Resolve base against a variant's tokens. Throws on unknown tokens and on
 * declared-but-unreferenced tokens (typo'd or stale declarations that would
 * otherwise silently ship wrong values). Returns the built theme object.
 */
export function buildTheme(base, variant, f) {
  const used = new Set();
  const built = walk(base, variant.tokens, used);
  const declared = new Set(Object.keys(variant.tokens));
  const unused = [...declared].filter((t) => !used.has(t));
  if (unused.length > 0) {
    throw new Error(
      `${f}: ${unused.length} declared token(s) are not referenced by base.yaml ` +
        `(typo or stale binding): ${unused.slice(0, 8).join(', ')}` +
        (unused.length > 8 ? `, …(+${unused.length - 8} more)` : '')
    );
  }
  return built;
}

/** Serialize exactly as the pipeline writes it: 2-space indent, trailing newline. */
export function serializeTheme(theme) {
  return JSON.stringify(theme, null, 2) + '\n';
}
