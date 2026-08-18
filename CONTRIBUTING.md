# Contributing to Alone

Thanks for helping. This file covers how the theme is built and verified, how to change the palette or add a variant, and what a pull request needs to pass.

## Layout

```
themes/_src/base.yaml            structural skeleton shared by every variant (${token} placeholders)
themes/_src/variants/<name>.yaml per-variant bindings: display, filename, verify, tokens
themes/*.json                    GENERATED — never edit by hand
themes/_snapshot/                immutable v1.2.0 baseline used by the coverage test
scripts/build-themes.mjs         generator CLI (scripts/lib/build.mjs)
scripts/verify-palette.mjs       palette verifier + README table renderer
scripts/lib/color.mjs            colour math: sRGB/Lab/LCh, WCAG, APCA, ΔE2000, CVD, dominant wavelength
scripts/lib/theme-roles.mjs      the syntax-role ladder and CVD pairs the verifier checks
tests/                           node:test suites (colour math, generator, pipeline, verifier smoke)
terminal/                        Kitty / iTerm2 / Alacritty / Windows Terminal schemes (mirror the ANSI slots)
samples/                         demo files for eyeballing every variant
```

## Building

The shipped `themes/*.json` files are **generated**. Don't edit them directly — your edits will be overwritten on the next build.

- **`themes/_src/base.yaml`** — every key the variants share (shape, scopes, font styles, and any hex that is identical across all variants) lives here as a literal. Every leaf that varies across variants is written as `${token.name}`. A bare `${token}` is replaced by whatever type the variant binds (string, boolean, …); a token inside a longer string is interpolated as text.
- **`themes/_src/variants/<name>.yaml`** — `display`, `filename`, a `verify` block (`isStandard` marks the variant the L\* ladder and README tables come from; `wavelengthBand`; optional `apcaFloors` overrides), and a flat `tokens:` map supplying every `${token.name}` the base references — including the two font-style tokens `style.italic` (`italic` or `""`) and `style.semanticItalic` (`true`/`false`) that Alone Roman binds to "off". The generator errors on unknown tokens and on tokens a variant declares but the base never uses.

```bash
npm ci
npm run build:themes                            # regenerate themes/*.json from _src/
npm run verify                                  # L* ladder, APCA floors, CVD + ANSI ΔE2000, wavelength scan, key parity, README tables
npm run check                                   # build + verify + palette-PNG freshness
npm run render:palette                          # regenerate images/palette-*.png after a palette change
npm test                                        # node --test tests/
node scripts/verify-palette.mjs --write-readme  # re-render the verifier-owned README tables after a palette change
npx @vscode/vsce package                        # build the VSIX locally
```

## The verifier is the contract

`scripts/verify-palette.mjs` hard-fails on:

- **Ladder** — the ten syntax roles (Operators → Comments) must stay in descending L\* order on the standard variant, with no adjacent gap under 3 L\* or ΔE2000 under 4.
- **APCA floors** — identifiers ≥ 60, syntax ≥ 40, Special/Strings ≥ 37, punctuation ≥ 28, comments ≥ 22 (Alone Soft carries its own floors in its variant file).
- **CVD** — the role pairs in `scripts/lib/theme-roles.mjs` must stay ΔE2000 ≥ 5 apart after protan and deutan simulation, or differ in font style. Alone Roman has no italic cue, so its pairs must pass on colour alone.
- **ANSI** — the eight normal terminal slots pairwise ΔE2000 ≥ 10.
- **Wavelength** — two parts. The ten ladder roles must pass the variant's declared band (`warm` = no blue/cyan hex). Separately, *every* chromatic hex in the theme — UI chrome, terminal, everything — must have a dominant wavelength ≥ 575 nm (`SCAN_MIN_NM`); neutrals below the chroma threshold are skipped. Note the whole-theme scan does not apply the declared band: a narrower band (a future `red-only` variant, say) constrains the ten roles, not the rest of the theme.
- **Parity** — every variant has exactly the same keys, rules and selectors as every other.
- **Palette PNGs** — `images/palette-*.png` must match what `scripts/render-palette.mjs` produces (`--check`).
- **README** — the tables between `<!-- verify:<name>:start/end -->` markers must match what the palette produces.

The header of the script explains the policy: since 2.0.0 every check is a hard failure. If you are deliberately moving the palette, demote the affected check to `warn` in the same PR that changes the palette and restore it before merge — do not add environment overrides.

## Changing the palette

1. Edit the hex in `themes/_src/variants/<name>.yaml` (or `base.yaml` if it is shared by every variant).
2. `npm run check` — read the verifier output; fix any failure rather than relaxing the threshold.
3. `node scripts/verify-palette.mjs --write-readme` and `npm run render:palette`; commit the README diff and `images/palette-*.png` along with the regenerated `themes/*.json`.
4. If you touched an ANSI slot, mirror it in the four `terminal/` files (the README ANSI table is the reference).
5. Note the change under `## [Unreleased]` in `CHANGELOG.md`. Visible look changes are a minor/major bump; fixes that don't change rendered colours are patch.

If the README makes a numeric claim that isn't inside a verifier block (blue-subpixel share, rod-stimulation ratios, L\* of a specific hex), recompute it from the new palette before publishing — the verifier can't see prose.

## Adding a scope or semantic token

Edit `base.yaml` only. Bind the new rule to an existing role token (`${tokenColors.<rule>.settings.foreground}` or `${semanticTokenColors.<sel>.foreground}`, or `${colors.<key>}`) so every variant inherits it and the parity check stays green; a new hex means a new token in every variant file. Add a demo line to the relevant `samples/` file, and extend `tests/pipeline.test.mjs` only if the coverage guarantee itself changes.

## Adding a variant

1. Copy the closest existing `themes/_src/variants/*.yaml`, change `display` / `filename` / `verify`, and fill in the `tokens:` block.
2. Add a `contributes.themes` entry in `package.json`, a README blurb under **Theme Variants**, and a CHANGELOG line.
3. `npm run check && npm test`. No `base.yaml` edits are needed unless the variant introduces a new key or scope, in which case every variant must add it.

## Pull requests

- Conventional commit prefixes: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`.
- `npm run check && npm test` green locally; CI runs the same plus `git diff --exit-code themes/` (committed JSON must be what the build produces) and a `vsce package` dry run on Node 22 and 24.
- Keep generated JSON, README tables and CHANGELOG in the same PR as the palette change that caused them.

## Releasing

See [docs/PUBLISHING.md](docs/PUBLISHING.md): bump `version`, move CHANGELOG entries out of `[Unreleased]`, merge, tag `vX.Y.Z` — the release workflow packages, creates the GitHub Release and publishes to the Marketplace and Open VSX.
