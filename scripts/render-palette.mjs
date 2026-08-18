#!/usr/bin/env node
/**
 * Render a palette strip PNG for every variant → images/palette-<variant>.png
 *
 *   node scripts/render-palette.mjs            # write all
 *   node scripts/render-palette.mjs --check    # exit 1 if any PNG differs from what the palette produces
 *
 * Dependency-free: raw RGBA buffer + node:zlib deflate + hand-rolled PNG
 * chunks, with a tiny 5×7 bitmap font for the labels. The strip shows the
 * ten-rung syntax ladder (swatch, role, hex, L*), the six bracket colours and
 * the sixteen ANSI slots, on the variant's own editor background. Used by the
 * README / Marketplace page as an always-in-sync visual of the palette.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { hexToRgb255, cielabL } from './lib/color.mjs';
import { LADDER_ROLES, resolveRole, bracketColors, ansiColors } from './lib/theme-roles.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THEMES_DIR = path.join(ROOT, 'themes');
const OUT_DIR = path.join(ROOT, 'images');
const CHECK = process.argv.includes('--check');

// ─── 5×7 bitmap font (uppercase, digits, a few marks) ─────────────────────
// Each glyph: 7 rows of 5 bits, MSB = leftmost pixel.
const FONT = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11], B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e], D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f], F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f], H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e], J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11], L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11], N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e], P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d], R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e], T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e], V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11], X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04], Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  0: [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e], 1: [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  2: [0x0e, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1f], 3: [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  4: [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02], 5: [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  6: [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e], 7: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  8: [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e], 9: [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  '#': [0x0a, 0x0a, 0x1f, 0x0a, 0x1f, 0x0a, 0x0a], '*': [0x00, 0x04, 0x15, 0x0e, 0x15, 0x04, 0x00],
  '-': [0x00, 0x00, 0x00, 0x1f, 0x00, 0x00, 0x00], '.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x0c, 0x0c],
  '/': [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10], ' ': [0, 0, 0, 0, 0, 0, 0],
  '(': [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02], ')': [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  ',': [0x00, 0x00, 0x00, 0x00, 0x0c, 0x04, 0x08],
};

// ─── Canvas ─────────────────────────────────────────────────────────────
class Canvas {
  constructor(w, h, bg) {
    this.w = w; this.h = h; this.px = Buffer.alloc(w * h * 4);
    this.rect(0, 0, w, h, bg);
  }
  set(x, y, [r, g, b]) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.px[i] = r; this.px[i + 1] = g; this.px[i + 2] = b; this.px[i + 3] = 255;
  }
  rect(x, y, w, h, rgb) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, rgb);
  }
  /** Draw `text` (uppercased; unknown glyphs render as space) at (x,y), pixel scale `s`. Returns advance width. */
  text(x, y, str, rgb, s = 2) {
    let cx = x;
    for (const ch of String(str).toUpperCase()) {
      const g = FONT[ch] ?? FONT[' '];
      for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++) {
        if (g[row] & (0x10 >> col)) this.rect(cx + col * s, y + row * s, s, s, rgb);
      }
      cx += 6 * s;
    }
    return cx - x;
  }
  png() {
    const stride = this.w * 4;
    const raw = Buffer.alloc((stride + 1) * this.h);
    for (let y = 0; y < this.h; y++) {
      raw[y * (stride + 1)] = 0; // filter: none
      this.px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0); ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit RGBA
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

// ─── Layout ─────────────────────────────────────────────────────────────
const W = 1200, PAD = 32, ROW = 40, SW = 28;

export function renderVariant(theme) {
  const bg = hexToRgb255(theme.colors['editor.background']);
  const fg = hexToRgb255(theme.colors['editor.foreground']);
  const dim = hexToRgb255(theme.colors['editorLineNumber.foreground'] ?? theme.colors['editor.foreground']);
  const ladder = LADDER_ROLES.map((r) => resolveRole(theme, r));
  const brackets = bracketColors(theme);
  const ansi = ansiColors(theme);
  const H = PAD + 24 + ladder.length * ROW + 24 + 60 + 24 + 60 + PAD;
  const c = new Canvas(W, H, bg);
  let y = PAD;
  c.text(PAD, y, `${theme.name} - syntax ladder, brackets, ANSI`, fg, 2); y += 24;
  for (const r of ladder) {
    c.rect(PAD, y, SW * 2, SW, hexToRgb255(r.hex));
    const label = `${r.name}${r.style.italic ? ' (italic)' : ''}${r.style.bold ? ' (bold)' : ''}`;
    c.text(PAD + SW * 2 + 16, y + 6, label.padEnd(22), hexToRgb255(r.hex), 2);
    c.text(PAD + SW * 2 + 16 + 22 * 12 + 16, y + 6, r.hex, hexToRgb255(r.hex), 2);
    c.text(PAD + SW * 2 + 16 + 22 * 12 + 16 + 8 * 12 + 16, y + 6, `L* ${cielabL(r.hex).toFixed(0)}`, dim, 2);
    // a bar proportional to L*, like the README ladder
    const barX = PAD + SW * 2 + 16 + 22 * 12 + 16 + 8 * 12 + 16 + 6 * 12 + 16;
    c.rect(barX, y + 8, Math.round((W - PAD - barX) * cielabL(r.hex) / 100), SW - 16, hexToRgb255(r.hex));
    y += ROW;
  }
  y += 8;
  c.text(PAD, y, 'bracket pairs (depth 1-6)', dim, 2); y += 20;
  brackets.forEach((b, i) => c.rect(PAD + i * (SW * 2 + 8), y, SW * 2, SW, hexToRgb255(b.hex)));
  y += SW + 28;
  c.text(PAD, y, 'ANSI 0-7 / 8-15', dim, 2); y += 20;
  ansi.forEach((a, i) => c.rect(PAD + (i % 8) * (SW * 2 + 8), y + Math.floor(i / 8) * (SW + 6), SW * 2, SW, hexToRgb255(a.hex)));
  return c.png();
}

function main() {
  const files = fs.readdirSync(THEMES_DIR).filter((f) => f.endsWith('-color-theme.json')).sort();
  if (!CHECK) fs.mkdirSync(OUT_DIR, { recursive: true });
  let drift = 0;
  for (const f of files) {
    const theme = JSON.parse(fs.readFileSync(path.join(THEMES_DIR, f), 'utf8'));
    const out = path.join(OUT_DIR, `palette-${f.replace('-color-theme.json', '')}.png`);
    const png = renderVariant(theme);
    if (CHECK) {
      const cur = fs.existsSync(out) ? fs.readFileSync(out) : null;
      if (!cur || !cur.equals(png)) { console.error(`✗ ${path.relative(ROOT, out)} is stale — run: node scripts/render-palette.mjs`); drift++; }
      else console.log(`✓ ${path.relative(ROOT, out)} current`);
    } else {
      fs.writeFileSync(out, png);
      console.log(`wrote ${path.relative(ROOT, out)} (${png.length} bytes)`);
    }
  }
  if (drift) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
