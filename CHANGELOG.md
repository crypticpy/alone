# Changelog

All notable changes to the **Alone** theme will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-08-18

### Changed — Palette retune (visible look change)

The first palette change since 1.0. Everything below was made in `themes/_src/variants/*.yaml` and mirrored into the four `terminal/` files; the verifier's perceptual checks (APCA floors, CVD confusability, ANSI ΔE2000, tight-gap ΔE2000, whole-theme wavelength scan) are now **hard failures** and the shipped palette passes all of them. Numbers below are for Alone / Alone Focused against `#0C0A09`; Alone Soft received the same transforms scaled to its dimmer range.

- **Neutrals lose blue-subpixel drive.** The foreground/operator/punctuation grays kept a residual blue channel that lit the display's short-wavelength subpixel for every character on screen. Each neutral was shifted at (near-)constant L\* by pulling the B channel down 10–20 hex and warming the hue: foreground / variables / ANSI white `#C4B8A4→#C8B89A`, operators `#D4C8B8→#D8C8A8`, brightest text / ANSI bright-white `#E8DCD0→#EDDCC4`, mid grays `#9A9080→#9D9078`, `#8A8278→#8D8271`, `#7A7268→#7C7262`, dim UI gray `#5C544A→#5E5446`.
- **Comments up to the readable floor.** `#5C544A→#6E665B` (APCA Lc 16 → 23, WCAG 2.7:1 → 3.5:1) for comments, CodeLens and ANSI bright-black; doc comments `#6B635A→#787062`; line numbers `#4A4540→#56504A`. Still clearly de-emphasised, no longer below the "non-essential text" floor. Soft comments `#4A433B→#625A50` (Lc 18).
- **Ghost text (inline suggestions) no longer identical to comments.** Foreground `#5C544A→#6B635A` plus a faint translucent backing (`editorGhostText.background: #1E191580`, Soft `#18151280`) so a suggestion reads as "proposed", not "commented out". (The italic slant on ghost text is VS Code's own CSS and cannot be changed by a theme.)
- **Accent solid fills dimmed.** `badge.background`, `activityBarBadge.background`, `statusBarItem.remoteBackground` and `extensionBadge.remoteBackground` `#D4A048→#A87C34` — the bright gold rectangles were the largest lit areas in the UI; the dimmer fill still carries Lc 39 for its dark label. Buttons, focus border and cursor keep `#D4A048`.
- **`*.defaultLibrary` becomes a real step.** `variable.defaultLibrary`, `property.defaultLibrary` and `this`/`self`/`super` `#B89860→#B08C50` — one L\* step below Types instead of a near-duplicate.
- **Numbers `#E0A850→#DEA64E`** (L\* 72.5 → 71.8) so Variables→Numbers clears the 3 L\* tight-gap floor without touching the foreground.
- **Parameters `#BCA890→#B8AA9C`.** Separated from Variables on the yellow–blue axis (which red-green-deficient readers retain) instead of the red-green axis; protan/deutan ΔE2000 vs Variables 4.7 → 6.6.
- **Soft Functions `#9A6D53→#976D56`** (ΔE 1.2 from before) so Soft's Types/Functions pair clears the CVD floor; Standard Functions unchanged.
- **ANSI blue and cyan.** Blue is now a warm gray `#9C948E` (was `#8B8178`, Lc 36 → 45 — `ls`, `grep`, `man` output on black is readable again) and cyan is the terracotta already used for functions, `#C08868` (was `#9A8B7A`). The two former slots were near-identical warm grays (ΔE2000 5.2, indistinguishable under CVD); every pair among the eight normal slots is now ≥ ΔE2000 10 (min 13.6). Bright slots follow: `#A89A8C→#B2AAA3`, `#B8A898→#CEA284`. Black/red/green/yellow/magenta unchanged. Kitty, iTerm2, Alacritty (normal + dim) and Windows Terminal files updated to match.
- **`themes/_snapshot/`** stays as the immutable v1.2.0 reference; the pipeline test now checks structural coverage — every snapshot colour key, tokenColors rule (name/scope/fontStyle) and semantic selector is still present and styled the same, additions allowed — rather than hex equality.

### Added — Alone Roman variant

- **`Alone Roman`** (`themes/alone-roman-color-theme.json`): the Standard palette with the italic channel removed. `base.yaml` now routes every syntax italic through two tokens — `style.italic` (tokenColors `fontStyle`) and `style.semanticItalic` (semantic `italic:`) — which Alone / Soft / Focused bind to `italic` / `true` and Roman to `""` / `false`. Markdown `*emphasis*` stays italic in every variant (document formatting, not syntax styling). Two hexes differ from Standard so the pairs Standard separates by italics stay separable on colour alone under red-green CVD: strings `#9A8B60 → #9C8B4A` (vs functions, protan/deutan ΔE2000 5.5) and `*.defaultLibrary` `#B08C50 → #AA884C` (vs types, 5.4). The verifier runs every check on Roman like any other variant; the L\* ladder reference stays Standard.

### Added — Scope coverage (all variants, no new hexes)

New `tokenColors` rules and `semanticTokenColors` selectors in `themes/_src/base.yaml`, each bound to an existing role token so every variant inherits it and key parity holds:

- **Diffs / patches**: `markup.inserted` / `markup.deleted` / `markup.changed` take the git-decoration added/deleted/modified colours; `meta.diff.header` (`---`/`+++`/`index`) in doc-comment gray; `meta.diff.range` (`@@ … @@`) in keyword gold, non-bold. `samples/demo.diff` added.
- **Log files**: `token.info-token` / `token.warn-token` / `token.error-token` / `token.debug-token` take the debug-console info/warning/error/source colours (error bold). `samples/demo.log` added.
- **Preprocessor**: `keyword.control.directive` + `punctuation.definition.directive` (so `#` is coloured with `include`/`define`) in keyword gold bold; `entity.name.function.preprocessor` / `entity.name.function.macro` in the macro colour, bold (matches Rust macros).
- **ALL_CAPS constants**: `variable.other.constant`, `constant.other.caps`, `variable.other.enummember` in the constants colour (previously fell through to plain variables).
- **Labels**: `entity.name.label`, `entity.name.goto-label` in the semantic `label` colour.
- **Markdown strikethrough**: `markup.strikethrough` gets `strikethrough` + the deprecated gray.
- **Support variables** (`document`, `window`, `process`, `console`…): `support.variable*` in the `defaultLibrary` colour, italic — same treatment as semantic `*.defaultLibrary`.
- **Semantic selectors**: `selfParameter` / `clsParameter` (= `this`/`self`/`super`), `magicFunction` (= Python magic methods), `builtinConstant` and `boolean` (= number/boolean colour), `builtinType` (= `type.defaultLibrary`, italic), `lifetime`, `attribute`, `derive` (= Rust lifetime/attribute colours, italic), `formatSpecifier` (= f-string braces), `escapeSequence` (= escapes, bold), `event` (= property).
- The pipeline test now checks that everything the v1.2.0 snapshot styled is still styled the same way (additions allowed, drops/restyles fail).

### Changed — Docs (honest science, contributor guide)

- **README "The Science" rewritten** to match the physics: dominant wavelength (576–611 nm, true of every hex) is distinguished from spectral content (the neutrals still light the blue subpixel — ~23–27 % of their light vs 33 % for white); the rod-impact table is replaced with the CIE 1951 scotopic V′(λ) curve (peak 507 nm); the benefits are stated as what they are — low text luminance (halation), no blue defocus, lower melanopic stimulus, comfort — and "protects dark adaptation" is retracted (reading is cone vision; the neutrals stimulate rods at ~85 % of white per unit luminance; red-only variants remain on the roadmap). Halation is attributed to dim text, not to `#0C0A09` vs `#000000`.
- **Marketplace-first ordering**: pitch → variants table → science → install → settings → display → palette → terminal → extensions → accessibility → FAQ; hero-image slot reserved for the release PR.
- **Accessibility**: WCAG and APCA presented side by side with the verifier's floors; new colour-vision-deficiency section describing the protan/deutan checks (all four variants incl. Roman); "Keywords use weight 450 (lighter bold)" corrected — theme bold is 700, 450 is the recommended `editor.fontWeight` for body text.
- **Recommended settings** add `"editor.fontVariations": true` so a variable font actually renders weight 450; **Display** section gains melanopic / OS warm-shift advice (Night Shift stacks with the palette).
- **FAQ** rewritten ("Why no blue or cyan?", new "Does it protect my night vision?" and "Is it colour-blind safe?").
- **`CONTRIBUTING.md`** added; the "Building the Themes (Contributors)" section moves there and grows into layout, verifier contract, palette-change and new-variant procedures. `package.json` description no longer claims dark-adaptation protection.

### Changed — Internal: verifier v2, tests, CI

- **Verifier v2** (`scripts/verify-palette.mjs`). New checks alongside the L\* ladder, wavelength band, and key parity: an **APCA Lc** column and per-role floors (body 60 / syntax 40 / special 37 / punctuation 28 / comments 22, overridable per variant via `verify.apcaFloors` — Alone Soft declares a scaled set); **ΔE2000** on every tight ladder gap; a **colour-vision-deficiency** table (Viénot protan/deutan/tritan simulation) over the ten most confusable role pairs, passing on ΔE2000 ≥ 5 or a font-style difference; **ANSI** pairwise ΔE2000 among the eight normal terminal slots (≥ 10); and a **whole-theme wavelength scan** — every chromatic hex in every variant, not just the ten headline roles, must have a dominant wavelength ≥ 575 nm. The perceptual checks were introduced as warnings against the 1.3.1 palette (which missed several — comments Lc 16, ANSI blue/cyan ΔE 5.2, Variables/Parameter under CVD) and are hard failures from 2.0.0. Each check's severity is a one-line `POLICY` entry.
- **README tables are now rendered by the verifier.** The L\* ladder, Syntax Colors table, bracket list, contrast table (now WCAG **and** APCA) and a new ANSI table live between `<!-- verify:<name>:start/end -->` markers; `node scripts/verify-palette.mjs --write-readme` re-renders them, and the default run fails on drift.
- **Colour math extracted** to `scripts/lib/color.mjs` (sRGB/XYZ/Lab, WCAG, APCA 0.0.98G-4, CIEDE2000, CVD matrices, dominant wavelength) and the generator's substitution/validation rules to `scripts/lib/build.mjs`, so both are unit-testable. `build-themes.mjs` output is byte-identical.
- **Tests** (`npm test`, `node:test`): colour-math sanity (21:1, L\* 100, APCA ±106/108, ΔE2000 red/green ≈ 86.6, sRGB primaries' λd), generator edge cases (bare vs interpolated tokens, unknown/unused tokens, non-object variant roots, path-escaping filenames), build determinism, committed-JSON freshness, `$schema` presence, v1.2.0 snapshot structural coverage, and a verifier smoke run.
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
