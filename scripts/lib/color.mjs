/**
 * Colour math shared by the verifier and its tests.
 *
 * Everything here is pure: hex strings in, numbers (or hex strings) out.
 * sRGB is assumed for every hex; alpha suffixes are ignored (the first six
 * digits are used).
 *
 * References
 *   - sRGB → linear, luminance, WCAG 2.x contrast: W3C WCAG 2.1 §1.4.3
 *   - CIE L*a*b* (D65, 2°): CIE 15:2004
 *   - CIEDE2000: Sharma, Wu & Dalal (2005) — including the hue-mean edge cases
 *   - APCA: Somers, APCA 0.0.98G-4 (the SAPC/APCA "G" constants)
 *   - CVD simulation: Viénot, Brettel & Mollon (1999) linear-RGB matrices for
 *     protanopia/deuteranopia; Brettel-style tritan matrix in the same form
 *   - Dominant wavelength: ray from D65 white through the colour's chromaticity
 *     intersected with a tabulated CIE 1931 spectral locus (5–10 nm steps)
 */

// ─── sRGB / XYZ / Lab ────────────────────────────────────────────────

/** '#RRGGBB' or '#RRGGBBAA' → [r, g, b] in 0..255. */
export function hexToRgb255(hex) {
  const h = hex.replace('#', '').slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/** [r, g, b] in 0..255 → '#RRGGBB' (uppercase). */
export function rgb255ToHex([r, g, b]) {
  return '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('').toUpperCase();
}

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const linearToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

/** hex → linear-light [r, g, b] in 0..1. */
export function hexToLinearRgb(hex) {
  return hexToRgb255(hex).map((c) => srgbToLinear(c / 255));
}

/** linear-light [r, g, b] (0..1, clamped) → '#RRGGBB'. */
export function linearRgbToHex(lin) {
  return rgb255ToHex(lin.map((c) => linearToSrgb(Math.min(1, Math.max(0, c))) * 255));
}

/** hex → CIE XYZ (D65, Y=1 for white). */
export function hexToXyz(hex) {
  const [r, g, b] = hexToLinearRgb(hex);
  return [
    0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    0.2126729 * r + 0.7151522 * g + 0.072175 * b,
    0.0193339 * r + 0.119192 * g + 0.9503041 * b,
  ];
}

/** WCAG relative luminance (0..1). */
export function relativeLuminance(hex) {
  const [r, g, b] = hexToLinearRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const D65 = [0.95047, 1.0, 1.08883];

/** hex → CIE L*a*b* (D65 white, 2° observer). */
export function hexToLab(hex) {
  const [X, Y, Z] = hexToXyz(hex);
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  const [fx, fy, fz] = [X / D65[0], Y / D65[1], Z / D65[2]].map(f);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** hex → [L*, C*, h°] (h in 0..360). */
export function hexToLch(hex) {
  const [L, a, b] = hexToLab(hex);
  return [L, Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360];
}

/** CIE L* alone (the ladder metric). */
export function cielabL(hex) {
  return hexToLab(hex)[0];
}

// ─── Contrast ────────────────────────────────────────────────────────

/** WCAG 2.x contrast ratio, ≥ 1. Order of arguments does not matter. */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * APCA Lc (0.0.98G-4). Positive for dark-on-light, negative for light-on-dark
 * (light text on our near-black backgrounds comes out negative). Callers
 * usually want Math.abs().
 */
export function apcaLc(textHex, bgHex) {
  const screenY = (hex) => {
    const [r, g, b] = hexToRgb255(hex).map((c) => Math.pow(c / 255, 2.4));
    let y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
    if (y < 0.022) y += Math.pow(0.022 - y, 1.414);
    return y;
  };
  const yTxt = screenY(textHex);
  const yBg = screenY(bgHex);
  let sapc;
  if (yBg > yTxt) sapc = (Math.pow(yBg, 0.56) - Math.pow(yTxt, 0.57)) * 1.14;
  else sapc = (Math.pow(yBg, 0.65) - Math.pow(yTxt, 0.62)) * 1.14;
  if (Math.abs(sapc) < 0.1) return 0;
  return (sapc > 0 ? sapc - 0.027 : sapc + 0.027) * 100;
}

// ─── ΔE2000 ──────────────────────────────────────────────────────────

/** CIEDE2000 colour difference between two hexes (kL = kC = kH = 1). */
export function deltaE2000(hexA, hexB) {
  const [L1, a1, b1] = hexToLab(hexA);
  const [L2, a2, b2] = hexToLab(hexB);
  const d2r = Math.PI / 180;
  const r2d = 180 / Math.PI;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + Math.pow(25, 7))));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const hp = (a, b) => {
    if (a === 0 && b === 0) return 0;
    const h = Math.atan2(b, a) * r2d;
    return h < 0 ? h + 360 : h;
  };
  const h1p = hp(a1p, b1);
  const h2p = hp(a2p, b2);
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp;
  if (C1p * C2p === 0) dhp = 0;
  else if (Math.abs(h2p - h1p) <= 180) dhp = h2p - h1p;
  else dhp = h2p - h1p > 180 ? h2p - h1p - 360 : h2p - h1p + 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * d2r);
  const Lbp = (L1 + L2) / 2;
  const Cbp = (C1p + C2p) / 2;
  let hbp;
  if (C1p * C2p === 0) hbp = h1p + h2p;
  else if (Math.abs(h1p - h2p) <= 180) hbp = (h1p + h2p) / 2;
  else hbp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
  const T =
    1 -
    0.17 * Math.cos((hbp - 30) * d2r) +
    0.24 * Math.cos(2 * hbp * d2r) +
    0.32 * Math.cos((3 * hbp + 6) * d2r) -
    0.2 * Math.cos((4 * hbp - 63) * d2r);
  const dTheta = 30 * Math.exp(-Math.pow((hbp - 275) / 25, 2));
  const RC = 2 * Math.sqrt(Math.pow(Cbp, 7) / (Math.pow(Cbp, 7) + Math.pow(25, 7)));
  const SL = 1 + (0.015 * Math.pow(Lbp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbp - 50, 2));
  const SC = 1 + 0.045 * Cbp;
  const SH = 1 + 0.015 * Cbp * T;
  const RT = -Math.sin(2 * dTheta * d2r) * RC;
  return Math.sqrt(
    Math.pow(dLp / SL, 2) + Math.pow(dCp / SC, 2) + Math.pow(dHp / SH, 2) + RT * (dCp / SC) * (dHp / SH)
  );
}

// ─── Colour-vision deficiency ────────────────────────────────────────

const CVD_MATRICES = {
  protan: [
    [0.11238, 0.88762, 0],
    [0.11238, 0.88762, 0],
    [0.00401, -0.00401, 1],
  ],
  deutan: [
    [0.29275, 0.70725, 0],
    [0.29275, 0.70725, 0],
    [-0.02234, 0.02234, 1],
  ],
  tritan: [
    [1, 0.14461, -0.14461],
    [0, 0.85924, 0.14076],
    [0, 0.85924, 0.14076],
  ],
};

export const CVD_TYPES = Object.keys(CVD_MATRICES);

/** Simulate dichromatic vision. type ∈ 'protan' | 'deutan' | 'tritan'. Returns hex. */
export function simulateCvd(hex, type) {
  const m = CVD_MATRICES[type];
  if (!m) throw new Error(`unknown CVD type: ${type}`);
  const v = hexToLinearRgb(hex);
  return linearRgbToHex(m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]));
}

// ─── Dominant wavelength ─────────────────────────────────────────────

// CIE 1931 2° spectral locus (x, y) at selected wavelengths.
const LOCUS = [
  [380, 0.1741, 0.005], [400, 0.1733, 0.0048], [420, 0.1714, 0.0051], [440, 0.1644, 0.0109],
  [450, 0.1566, 0.0177], [460, 0.144, 0.0297], [470, 0.1241, 0.0578], [480, 0.0913, 0.1327],
  [490, 0.0454, 0.295], [500, 0.0082, 0.5384], [510, 0.0139, 0.7502], [520, 0.0743, 0.8338],
  [530, 0.1547, 0.8059], [540, 0.2296, 0.7543], [550, 0.3016, 0.6923], [555, 0.3373, 0.6589],
  [560, 0.3731, 0.6245], [565, 0.4087, 0.5896], [570, 0.4441, 0.5547], [575, 0.4788, 0.5202],
  [580, 0.5125, 0.4866], [585, 0.5448, 0.4544], [590, 0.5752, 0.4242], [595, 0.6029, 0.3965],
  [600, 0.627, 0.3725], [605, 0.6482, 0.3514], [610, 0.6658, 0.334], [620, 0.6915, 0.3083],
  [630, 0.7079, 0.292], [640, 0.719, 0.2809], [650, 0.726, 0.274], [700, 0.7347, 0.2653],
];
const WHITE_XY = [0.3127, 0.329];

/**
 * Dominant wavelength in nm and excitation purity (0..1) for a hex.
 * Returns { lambda: NaN, purity: NaN } for neutrals (chroma too small to
 * define a direction) and for colours on the purple line (no spectral
 * intersection — magentas/purples). Callers should treat NaN as "not
 * spectral" rather than as an error.
 */
export function dominantWavelength(hex) {
  const [X, Y, Z] = hexToXyz(hex);
  const s = X + Y + Z;
  if (s === 0) return { lambda: NaN, purity: NaN };
  const x = X / s;
  const y = Y / s;
  const dx = x - WHITE_XY[0];
  const dy = y - WHITE_XY[1];
  if (Math.hypot(dx, dy) < 1e-4) return { lambda: NaN, purity: NaN };
  let best = null;
  for (let i = 0; i < LOCUS.length - 1; i++) {
    const [l1, x1, y1] = LOCUS[i];
    const [l2, x2, y2] = LOCUS[i + 1];
    const ex = x2 - x1;
    const ey = y2 - y1;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) continue;
    // Solve W + t·d = P1 + u·(P2 − P1). t > 0 → same side as the colour.
    const t = ((x1 - WHITE_XY[0]) * ey - (y1 - WHITE_XY[1]) * ex) / den;
    const u = ((x1 - WHITE_XY[0]) * dy - (y1 - WHITE_XY[1]) * dx) / den;
    if (t > 0 && u >= 0 && u <= 1) {
      best = { lambda: l1 + u * (l2 - l1), purity: 1 / t };
    }
  }
  return best ? { lambda: Math.round(best.lambda), purity: best.purity } : { lambda: NaN, purity: NaN };
}

// ─── Misc helpers ────────────────────────────────────────────────────

/** True for '#RRGGBB' or '#RRGGBBAA'. */
export function isHexColor(value) {
  return typeof value === 'string' && /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
}

/** Uppercase '#RRGGBB' with any alpha suffix dropped. */
export function normalizeHex(hex) {
  return '#' + hex.replace('#', '').slice(0, 6).toUpperCase();
}
