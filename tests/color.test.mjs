import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  contrastRatio, cielabL, apcaLc, deltaE2000, simulateCvd, dominantWavelength,
  hexToLab, hexToLch, isHexColor, normalizeHex, linearRgbToHex, hexToLinearRgb,
} from '../scripts/lib/color.mjs';

const near = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg ?? ''} expected ${expected}±${tol}, got ${actual}`);

test('WCAG contrast: white on black is 21:1, identical colours 1:1, symmetric', () => {
  near(contrastRatio('#FFFFFF', '#000000'), 21, 1e-9);
  near(contrastRatio('#000000', '#FFFFFF'), 21, 1e-9);
  near(contrastRatio('#808080', '#808080'), 1, 1e-9);
});

test('CIE L*: white = 100, black = 0, mid-grey ≈ 53.6, ignores alpha suffix', () => {
  near(cielabL("#FFFFFF"), 100, 1e-4);
  near(cielabL("#000000"), 0, 1e-4);
  near(cielabL('#808080'), 53.59, 0.05);
  near(cielabL('#80808080'), cielabL('#808080'), 1e-12);
});

test('Lab: neutrals have ~zero a*/b*; sRGB red has positive a*', () => {
  const [, a, b] = hexToLab('#808080');
  near(a, 0, 0.05);
  near(b, 0, 0.05);
  assert.ok(hexToLab('#FF0000')[1] > 60);
  const [, C] = hexToLch('#808080');
  near(C, 0, 0.05);
});

test('APCA Lc: black-on-white ≈ +106, white-on-black ≈ −108, same-colour ≈ 0', () => {
  near(apcaLc('#000000', '#FFFFFF'), 106.04, 0.5);
  near(apcaLc('#FFFFFF', '#000000'), -107.88, 0.5);
  assert.equal(apcaLc('#777777', '#777777'), 0);
});

test('ΔE2000: identity is 0, symmetric, red-vs-green ≈ 86.6', () => {
  assert.equal(deltaE2000('#C08868', '#C08868'), 0);
  near(deltaE2000('#C08868', '#9A8B60'), deltaE2000('#9A8B60', '#C08868'), 1e-9);
  near(deltaE2000('#FF0000', '#00FF00'), 86.6, 0.5);
  // small step in lightness only ≈ ΔL*/S_L
  assert.ok(deltaE2000('#808080', '#828282') < 1.5);
});

test('CVD simulation: neutrals survive unchanged; red and green converge for protan/deutan', () => {
  assert.equal(simulateCvd('#808080', 'protan'), '#808080');
  assert.equal(simulateCvd('#808080', 'deutan'), '#808080');
  const before = deltaE2000('#B85450', '#9A8B60');
  const after = deltaE2000(simulateCvd('#B85450', 'deutan'), simulateCvd('#9A8B60', 'deutan'));
  assert.ok(after < before, `expected red/green to converge (${before} → ${after})`);
  assert.throws(() => simulateCvd('#808080', 'nope'), /unknown CVD type/);
});

test('dominant wavelength: sRGB primaries land near their textbook λd; neutrals and purples are non-spectral', () => {
  near(dominantWavelength('#FF0000').lambda, 611, 4, 'red');
  near(dominantWavelength('#00FF00').lambda, 549, 4, 'green');
  near(dominantWavelength('#0000FF').lambda, 464, 4, 'blue');
  assert.ok(Number.isNaN(dominantWavelength('#808080').lambda));
  assert.ok(Number.isNaN(dominantWavelength('#FF00FF').lambda));
  // Alone's palette lives in the amber band
  const { lambda, purity } = dominantWavelength('#D4A048');
  assert.ok(lambda >= 575 && lambda <= 585, `amber λd ${lambda}`);
  assert.ok(purity > 0 && purity < 1);
});

test('linear round-trip and hex helpers', () => {
  assert.equal(linearRgbToHex(hexToLinearRgb('#C08868')), '#C08868');
  assert.ok(isHexColor('#0C0A09') && isHexColor('#0C0A0980'));
  assert.ok(!isHexColor('#0C0A0') && !isHexColor('0C0A09') && !isHexColor('#0C0A098'));
  assert.equal(normalizeHex('#c08868ff'), '#C08868');
});
