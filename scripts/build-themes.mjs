#!/usr/bin/env node
/**
 * Theme generator (CLI).
 *
 * Reads themes/_src/base.yaml (structural skeleton with ${token} placeholders
 * at leaves that vary across variants) and themes/_src/variants/*.yaml (per-
 * variant token bindings) and emits themes/<filename>.json for each variant.
 *
 * The substitution and validation rules live in scripts/lib/build.mjs so they
 * can be unit-tested; this file only does discovery, I/O, and the cross-
 * variant duplicate-filename check.
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
import { validateVariant, buildTheme, serializeTheme } from './lib/build.mjs';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const SRC = path.join(ROOT, 'themes', '_src');
const OUT = path.join(ROOT, 'themes');

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
// collisions. Canonicalized via path.resolve inside validateVariant so two
// variants with e.g. "foo.json" and "./foo.json" collide as the same
// destination.
const seenFilenames = new Map();
const OUT_ABS = path.resolve(OUT);

for (const f of variantFiles) {
  const variant = loadYaml(path.join(variantsDir, f));
  const resolvedOut = validateVariant(variant, f, OUT_ABS);

  if (seenFilenames.has(resolvedOut)) {
    const prior = seenFilenames.get(resolvedOut);
    throw new Error(
      `${f}: filename "${variant.filename}" (canonical: ${path.relative(OUT_ABS, resolvedOut)}) ` +
        `already used by ${prior}. Each variant must produce a unique output JSON.`
    );
  }
  seenFilenames.set(resolvedOut, f);

  const built = buildTheme(base, variant, f);
  fs.writeFileSync(resolvedOut, serializeTheme(built));
  console.log(`  wrote ${path.relative(ROOT, resolvedOut)}  (${variant.display})`);
}
