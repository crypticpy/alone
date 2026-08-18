/**
 * The palette-strip renderer must produce a well-formed, deterministic PNG
 * for every committed theme, and the committed PNGs must be current.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { renderVariant } from '../scripts/render-palette.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const themes = fs.readdirSync(path.join(ROOT, 'themes')).filter((f) => f.endsWith('-color-theme.json')).sort();

test('renderVariant emits a valid RGBA PNG whose IDAT inflates to width*height*4 (+filter bytes)', () => {
  for (const f of themes) {
    const theme = JSON.parse(fs.readFileSync(path.join(ROOT, 'themes', f), 'utf8'));
    const png = renderVariant(theme);
    assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], `${f}: PNG signature`);
    assert.equal(png.toString('latin1', 12, 16), 'IHDR');
    const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
    assert.equal(png[24], 8); assert.equal(png[25], 6); // 8-bit RGBA
    const idatLen = png.readUInt32BE(33);
    assert.equal(png.toString('latin1', 37, 41), 'IDAT');
    const raw = zlib.inflateSync(png.subarray(41, 41 + idatLen));
    assert.equal(raw.length, (w * 4 + 1) * h, `${f}: decoded size`);
    assert.equal(png.toString('latin1', png.length - 8, png.length - 4), 'IEND');
  }
});

test('renderVariant is deterministic and images/palette-*.png are current', () => {
  for (const f of themes) {
    const theme = JSON.parse(fs.readFileSync(path.join(ROOT, 'themes', f), 'utf8'));
    const a = renderVariant(theme), b = renderVariant(theme);
    assert.ok(a.equals(b), `${f}: two renders differ`);
    const out = path.join(ROOT, 'images', `palette-${f.replace('-color-theme.json', '')}.png`);
    assert.ok(fs.existsSync(out), `${path.relative(ROOT, out)} missing — run npm run render:palette`);
    assert.ok(fs.readFileSync(out).equals(a), `${path.relative(ROOT, out)} stale — run npm run render:palette`);
  }
});
