# Changelog

All notable changes to the **Alone** theme will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed — Internal: verifier v2, tests, CI (no palette changes)

- **Verifier v2** (`scripts/verify-palette.mjs`). New checks alongside the L\* ladder, wavelength band, and key parity: an **APCA Lc** column and per-role floors (body 60 / syntax 40 / special 37 / punctuation 28 / comments 22, overridable per variant via `verify.apcaFloors` — Alone Soft declares a scaled set); **ΔE2000** on every tight ladder gap; a **colour-vision-deficiency** table (Viénot protan/deutan/tritan simulation) over the ten most confusable role pairs, passing on ΔE2000 ≥ 5 or a font-style difference; **ANSI** pairwise ΔE2000 among the eight normal terminal slots (≥ 10); and a **whole-theme wavelength scan** — every chromatic hex in every variant, not just the ten headline roles, must have a dominant wavelength ≥ 575 nm. The new perceptual checks report as **warnings** in this release (the current palette misses several — comments Lc 16, ANSI blue/cyan ΔE 5.2, Variables/Parameter under CVD); they become hard failures with the 2.0.0 retune. Each check's severity is a one-line `POLICY` entry.
- **README tables are now rendered by the verifier.** The L\* ladder, Syntax Colors table, bracket list, contrast table (now WCAG **and** APCA) and a new ANSI table live between `<!-- verify:<name>:start/end -->` markers; `node scripts/verify-palette.mjs --write-readme` re-renders them, and the default run fails on drift.
- **Colour math extracted** to `scripts/lib/color.mjs` (sRGB/XYZ/Lab, WCAG, APCA 0.0.98G-4, CIEDE2000, CVD matrices, dominant wavelength) and the generator's substitution/validation rules to `scripts/lib/build.mjs`, so both are unit-testable. `build-themes.mjs` output is byte-identical.
- **Tests** (`npm test`, `node:test`): colour-math sanity (21:1, L\* 100, APCA ±106/108, ΔE2000 red/green ≈ 86.6, sRGB primaries' λd), generator edge cases (bare vs interpolated tokens, unknown/unused tokens, non-object variant roots, path-escaping filenames), build determinism, committed-JSON freshness, `$schema` presence, v1.2.0 snapshot parity (skippable with `PALETTE_CHANGED=1`), and a verifier smoke run.
- **CI** (`.github/workflows/ci.yml`): Node 22 + 24 — `npm ci` → build → `git diff --exit-code themes/` → verify → test → `vsce package` (VSIX uploaded as an artifact). Dependabot for npm and GitHub Actions, monthly.
- `@vscode/vsce` added as a devDependency; `npm run package` builds the VSIX.

---

## [1.3.1] - 2026-08-18

### Changed — Packaging hygiene (no palette changes)

The shipped `themes/*.json` files are semantically identical to v1.3.0 apart from a new `$schema` key. This release cleans up what goes into the VSIX and what the repo carries, ahead of Marketplace publication.

- **`.vscodeignore` rewritten** so the VSIX ships only `package.json`, `README.md`, `CHANGELOG.md`, `LICENSE`, the icon, `themes/*.json`, and the `terminal/` configs. `scripts/`, `tests/`, `docs/`, `samples/`, `themes/_src/`, `themes/_snapshot/`, `.github/`, `.vscode/`, and `node_modules/` are excluded. Verify with `npx @vscode/vsce ls`.
- **Committed VSIX files removed** (`alone-1.0.1.vsix`, `alone-1.1.0.vsix`). Packages are release artifacts, not source; `.gitignore` now ignores `*.vsix` unconditionally.
- **`package.json` cleanup**: removed the Marketplace-only `__metadata` block and the `contributes.configurationDefaults["[*]"]` entry (empty and unused); added `"pricing": "Free"`; keywords retargeted to how people actually search (`dark theme`, `warm`, `amber`, `OLED`, `eye strain`, `low light`, `night`, `astigmatism`, `dark room`, `vision science`).
- **`$schema: vscode://schemas/color-theme`** added to every generated theme via `themes/_src/base.yaml`, so editors validate and autocomplete the JSON. The `themes/_snapshot/` comparison strips this key before diffing (see `themes/_snapshot/README.md`).
- **One-shot scripts archived**: `scripts/_extract-deltas.mjs` and `scripts/retune.mjs` moved to `scripts/archive/`. Neither is part of the build.
- **Plans moved** from `plans/` to `docs/plans/`; the audit-remediation plan (`docs/plans/2026-08-18-audit-remediation.md`) added.
- **README swatches fixed**: the Syntax Colors table and Bracket Pair list used `via.placeholder.com` images, which is dead — the swatch column has been removed and the tables now show plain hex values.

---

## [1.3.0] - 2026-05-22

### Changed — Internal: theme variants now generated from a base + per-variant deltas pipeline

No user-visible changes — the shipped `themes/*.json` files are **semantically identical** to v1.2.0 (verified by `diff <(jq -S ...)`). The text layout differs because the generator always expands multi-key objects across lines, where v1.2.0 hand-formatted some `{ foreground, italic }` settings as compact one-liners; values, scopes, ordering, and key sets are unchanged. This is groundwork for the upcoming family expansion: with three hand-maintained ~1650-line JSONs we were already past the breaking point (v1.2.0 needed a one-shot transform script to keep them in sync), and the next milestones add four more variants on top.

- **Build pipeline** (`scripts/build-themes.mjs`, `npm run build:themes`). Reads `themes/_src/base.yaml` (the structural skeleton with `${token.name}` placeholders at leaves that vary across variants) plus each `themes/_src/variants/<name>.yaml` (per-variant token bindings) and emits `themes/<filename>.json` per variant. Deterministic, ordered.
- **Verifier generalized** (`scripts/verify-palette.mjs`). Discovers variants from `themes/_src/variants/*.yaml` instead of being hardcoded to three. Each variant declares its `verify.wavelengthBand` (one of `warm`, `red-amber`, `red-only`); the wavelength check is run against every variant, in its declared band. The L\* ladder and README WCAG claims are still pegged to the "standard" variant (Alone), marked with `verify.isStandard: true`.
- **Combined check** (`npm run check` = `build:themes && verify`).
- **Theme Variants section in README** repositions Alone as the **mesopic** family member, setting up the family-of-variants framing for the upcoming additions.
- **Building the Themes (Contributors)** section added to README explaining how to edit `_src/`, what `base.yaml` vs `variants/<name>.yaml` do, and how to add a new variant.
- `yaml` (npm package) added as a `devDependency`. The published VSIX stays dependency-free at runtime; `yaml` is only used by the build/verify scripts.
- `scripts/_extract-deltas.mjs` — the one-shot extractor that produced the v1.3.0 `_src/` tree from the v1.2.0 snapshot. Kept in the repo for historical traceability; not part of the build.
- `themes/_snapshot/` — v1.2.0 snapshot of the three shipped JSONs, kept as a regression baseline. The build verifies `diff <(jq -S . themes/X.json) <(jq -S . themes/_snapshot/X.json)` is empty for each existing variant on every release that doesn't intentionally change the palette.

---

## [1.2.0] - 2026-05-21

### Changed — Palette retune to honor the science

A re-audit found that the published L\* ladder, WCAG claims, and semantic-token mappings had drifted from the actual hex values shipped in v1.1.0. This release re-tunes the palette so the README's stated science matches what the theme actually does.

- **Types lifted into their own L\* tier**: `#9A8048` (L\* 55) → `#BC9858` (L\* 65). Previously class/interface/enum/struct/type/typeParameter/namespace/module all shared one color _and_ sat below Strings in perceptual lightness. They now sit between Keywords and Functions, matching the README ladder.
- **Functions lifted**: `#B07850` (L\* 57) → `#C08868` (L\* 62). Restores spacing between Functions and Types/Strings.
- **Cursor dimmed**: `editorCursor.foreground` and `terminalCursor.foreground` dropped from `#E8B850` (the brightest palette hex) to `#D4A048`. A small bright point on near-black is a halation hotspot — for an astigmatism-focused theme, the cursor should not be the brightest thing on screen.
- **Find-match hue offset**: search highlights moved from gold (`#D4A048`) to burnt-sienna (`#C89068`). Selection and find-match were previously the same hue at different alphas, so overlapping highlights merged into a single warm wash; the offset gives layered transient highlights visual separation.
- **Inlay hint contrast raised**: foreground from `#5C544A` (L\* 37, below comments) to `#7A7268` (L\* 49). Inlay hints encode actively useful type info; they don't deserve worse contrast than comments.
- **Bracket pair colors re-spread for monotonic L\* descent**: `#E0B868 → #C89868 → #B08458 → #967048 → #7A5C3C → #604830` (L\* ~78 → ~34). Depth now maps to dimness, giving nesting depth a strong perceptual cue instead of cycling through colors at near-identical lightness.
- **Escape characters split off the dusty-rose**: `\n`, `\t`, unicode escapes move from `#A87878` italic (which they shared with regex and decorators _and_ sat at near-identical L\* to italic strings) to `#D4B088` bold. Now they pop out of the string they live in.
- **Semantic-token differentiation via font style**: `interface`, `interface.declaration`, `typeParameter`, `namespace`, and `module` are now italic. `function.defaultLibrary`, `method.defaultLibrary`, `variable.defaultLibrary`, and `property.defaultLibrary` are also italic so built-in / library calls visually separate from your code without needing a new color.
- **Variant parity restored**: GitLens and Error Lens color keys (added to Standard in v1.1.0) are now present in Alone Soft and Alone Focused too. All three variants share identical key sets.

### Added

- `scripts/retune.mjs` — one-shot palette transform script (record of what changed and how).
- `scripts/verify-palette.mjs` — verifier that computes CIE L\* and WCAG contrast from the live theme files and asserts the README ladder. Run `node scripts/verify-palette.mjs` after any palette edit.
- README "Italic Fringing Tradeoff" subsection with a copy-paste `editor.tokenColorCustomizations` snippet that strips italics for users for whom slanted edges cause fringing.

### Fixed (documentation)

- L\* ladder block in README now matches the computed values from the theme files (was off by 5-10 units for Keywords, Functions, and Types).
- WCAG contrast table re-measured against `#0C0A09` (was understated by ~1.0-1.5 across the board).

---

## [1.1.0] - 2025-01-09

### Added

- **Theme Variants**
  - **Alone Soft**: Dimmer variant with ~20% reduced brightness for extreme dark adaptation
  - **Alone Focused**: Minimal UI variant with muted chrome for maximum concentration

- **Extension Support**
  - GitLens: Custom colors for blame annotations, gutter, line highlights
  - Error Lens: Warm-toned error, warning, info, and hint backgrounds/foregrounds
  - Indent Rainbow: Recommended settings for warm indent guides
  - Todo Tree: Recommended settings for themed TODO/FIXME highlights

- **Terminal Themes** (in `terminal/` directory)
  - Kitty: `alone.conf`
  - iTerm2: `alone.itermcolors`
  - Alacritty: `alone.toml`
  - Windows Terminal: `alone-windows-terminal.json`

- **Sample Files** (in `samples/` directory)
  - TypeScript/React demo (`demo.tsx`)
  - Python demo (`demo.py`)
  - Rust demo (`demo.rs`)
  - Go demo (`demo.go`)

- **Documentation**
  - WCAG contrast ratio documentation
  - Astigmatism considerations section
  - Extension compatibility guide

### Changed

- Refined inlay hint colors for more subtle appearance
- Updated README with comprehensive feature documentation

---

## [1.0.1] - 2025-01-07

### Changed

- Reduced brightness of keywords, functions, and types/classes for better astigmatism support
  - Keywords: `#E8B850` → `#C8A040` (reduced ~15% brightness)
  - Functions: `#C8906A` → `#B07850` (reduced ~15% brightness)
  - Types/Classes: `#B89860` → `#9A8048` (reduced ~15% brightness)
- This reduces halation/fringing effect for users with astigmatism while maintaining readability

---

## [1.0.0] - 2025-01-05

### Added

- Initial release of **Alone** theme
- Complete VS Code workbench theming (~400+ tokens)
- Comprehensive syntax highlighting for all major languages
- Semantic highlighting support
- Six-color warm bracket pair colorization
- Terminal ANSI colors matching the Scotopic terminal theme
- Full support for:
  - JavaScript / TypeScript / JSX / TSX
  - Python (including f-strings, docstrings, magic methods)
  - Rust (lifetimes, macros, attributes)
  - Go
  - HTML / CSS / SCSS
  - JSON / YAML / TOML
  - Markdown
  - Shell / Bash
  - SQL

### Design Principles

- Eliminated all blue (450-490nm) and cyan (490-520nm) colors
- Used only wavelengths >575nm for syntax highlighting
- Implemented L\* (lightness) spacing for OLED/miniLED distinguishability
- Near-black background (#0C0A09) for halation reduction
- Font style differentiation (bold/italic) to extend palette without color proliferation

---

## Future Plans

- [ ] Additional language-specific refinements
- [ ] Companion themes for JetBrains IDEs
- [ ] VS Code settings sync profile
- [ ] Integration with system dark mode detection

---

_Code alone. Code in peace._
