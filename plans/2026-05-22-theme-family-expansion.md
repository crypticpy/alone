# Plan: v1.3+ theme family expansion (pipeline + four new variants)

## Summary

Convert the existing three hand-maintained ~1650-line theme JSONs to a `base.yaml + per-variant-deltas → generated JSON` build pipeline so adding variants becomes a small per-variant deltas file rather than a full JSON copy. Then ship five new family members (Mesopic relabel, Civil Twilight, Astronomical Dark, Apollo Scotopic Red, Max Dark Scotopic Red) as separate PRs on top of the pipeline. The pipeline is the critical prerequisite — three hand-maintained variants is already past the breaking point (v1.2.0 needed a one-shot transform script to keep them in sync); eight would be unworkable.

## Scope

**In:**

- New `themes/_src/base.yaml` capturing the full theme structure (semantic-token mappings, tokenColors entries by name + scope, all 668 `colors.*` keys) with named tokens (e.g. `$tokens.fg.functions`) as placeholders.
- New `themes/_src/variants/<name>.yaml` files — one per variant — providing the concrete hex/alpha bindings for the named tokens.
- New `scripts/build-themes.mjs` generator + `npm run build:themes` script.
- Regeneration of the existing three themes (Standard, Soft, Focused) from the pipeline, verified semantically identical to today's shipped files.
- Extension of `scripts/verify-palette.mjs` to iterate over all variants discovered in `themes/_src/variants/` instead of being hardcoded to three.
- PRs #2–6: five new variants, each one a small deltas yaml + verifier-config entry + per-variant README/CHANGELOG entry + `package.json contributes.themes` entry. The two scotopic-red siblings (Apollo + Max Dark) live as separate full variants — Apollo allows ~590nm amber accent for keyword/type legibility; Max Dark is mono-red ~620nm+ with no amber, optimized for strict dark-adaptation preservation (telescope-hide / submarine-bridge use).
- For each new variant, run the verifier with the appropriate wavelength constraint and an eyeball pass on `samples/` files.

**Out:**

- Marketplace rename "Alone" → "Alone Mesopic". Keep "Alone" as the headline name; document it as the mesopic family member in the README.
- Terminal config files (`terminal/alone.conf`, `alone.itermcolors`, etc.) — they stay hand-maintained; not part of the JSON pipeline.
- VSIX packaging / marketplace publishing — each batch ships at the user's discretion, separate from these PRs.
- Removing or modifying `scripts/retune.mjs` — historical artifact from v1.2.0, leaves in place.
- Pre-designing the hex palettes of new variants in this plan — each variant PR is its own design exercise. This roadmap sketches the variants but does not pre-pick their hex tables.
- Auto-publishing or version-bump automation — `package.json` version bumps stay manual.

## Steps

PR #1 (pipeline — the prerequisite):

1. **Snapshot current themes**. Copy `themes/*.json` to `themes/_snapshot/` (gitignored after the verification step lands, or kept as a regression artifact — TBD during implementation). Used as the byte-comparison baseline for steps 4–5.
2. **Design `themes/_src/base.yaml` schema + extract the three variant deltas**. The schema: a single base.yaml carrying the structural shell (top-level keys, semanticTokenColors key paths, the 73 tokenColors entries indexed by name + scope, the 668 colors keys) with named-token placeholders like `$tokens.fg.functions` everywhere a value would go. Three deltas files — `themes/_src/variants/alone.yaml`, `alone-soft.yaml`, `alone-focused.yaml` — each providing `{ display, filename, tokens: { ... } }` with the hex/alpha values lifted directly from the snapshot JSONs. Use `yaml` npm package as a `devDependency` (keeps published VSIX clean).
3. **Write `scripts/build-themes.mjs`**. Node ESM. Loads `base.yaml` + each `variants/*.yaml`, resolves `$tokens.*` references against per-variant tokens, emits `themes/<filename>.json` per variant. Add `npm run build:themes` to `package.json`. Should be ~150 lines total.
4. **Regenerate and verify semantic identity**. Run `npm run build:themes`. For each variant, diff `jq -S . themes/X.json` against `jq -S . themes/_snapshot/X.json`. Iterate the schema or the deltas until the diff is empty (or has only intentional differences with a comment in the commit message explaining each one). This is the hard step — expect schema iteration as edge cases surface (mixed scalar/object semanticToken values, fontStyle keys, etc.).
5. **Extend `scripts/verify-palette.mjs`**. Generalize the hardcoded three-variant loading to a directory scan of `themes/_src/variants/*.yaml`. Add a per-variant wavelength-constraint config (for PR #1 all three remain "no blue/cyan band"; later Scotopic Red tightens to ">590nm dominant"). Keep all existing assertions (ladder monotonic, WCAG ±0.05, variant key parity) running across the now-N variants.
6. **Update README + CHANGELOG + version**. Add a developer-facing "Building the themes" section to README pointing at `themes/_src/` and `npm run build:themes`. CHANGELOG entry for `[1.3.0]` noting "internal: theme variants now generated from a base + per-variant deltas pipeline; no user-visible changes." Bump `package.json` to `1.3.0`. Land PR; merge to main.

PRs #2–6 (variants — one PR per variant, each following the same template once the pipeline is in):

7. **For each new variant PR**: (a) add `themes/_src/variants/<name>.yaml` with hex/alpha values for that variant; (b) tune values until the L\* ladder and WCAG claims hold via verifier; (c) add a `package.json contributes.themes` entry; (d) add a CHANGELOG entry; (e) add a README subsection describing the variant's design intent (dark-adaptation preservation goal, wavelength range, expected use case); (f) eyeball `samples/demo.{tsx,py,rs,go}` under the variant before marking done. **Order** — lowest constraint → tightest, so each PR benefits from tooling lessons in the prior:
   - **Mesopic** (mostly a docs/family-positioning shift, may or may not be a separate theme entry — see Open questions)
   - **Civil Twilight** (warm + a notch brighter than current Alone, dusk-transition use; closest to existing palette, lowest-risk)
   - **Astronomical Dark** (red + dim amber, moderate constraint; lets cones do a little work for letterform readability)
   - **Apollo Scotopic Red** (red + ~590nm amber accent for keywords/types; legible variant of scotopic, modeled on Apollo LM instrument panels)
   - **Max Dark Scotopic Red** (strict mono-red ~620nm+, no amber, font-style carries all syntactic differentiation; for users who genuinely need uncompromised dark adaptation. Likely also drops `editor.background` darker than `#0C0A09` and may need a Lstar ladder compressed into the long-wave-only luminance range. Most constrained — implement last.)

## Testing

- `npm run build:themes` succeeds for all variants, no schema errors.
- After PR #1: `diff <(jq -S . themes/<name>.json) <(jq -S . themes/_snapshot/<name>.json)` is empty (or has only intentional, explained differences) for each of the three existing variants.
- After PR #1: `node scripts/verify-palette.mjs` passes with no failures and no new warnings beyond the existing tight-gap one.
- After each variant PR: verifier passes including the new variant; the wavelength constraint specific to that variant is enforced; eyeball pass on `samples/` confirms the variant reads as intended.
- For Max Dark specifically: also confirm that all syntactic differentiation that the warm palette gets from hue is recoverable via font style (bold/italic/underline) and lightness alone — read `samples/demo.{tsx,py,rs,go}` and check that types-vs-functions, strings-vs-comments, etc. remain distinguishable.

## Open questions

- **`yaml` dep.** Add `yaml` (the npm package) as a `devDependency`, or write a tiny YAML reader? The repo currently has zero runtime dependencies — it's a theme extension, not a Node project. Recommending: add `yaml` as `devDependency` only, so the published VSIX stays dep-free. Confirm before implementation.
- **Mesopic as a separate theme entry or docs-only?** "Mesopic" is essentially current Alone — the intermediate-light family member. Options: (a) docs-only, no new entry in `package.json contributes.themes`, just a README section explaining Alone is the mesopic family member; (b) duplicate the existing Standard variant as "Alone Mesopic" so the family lineup shows all four members in the variant picker. Recommending (a) to avoid a redundant entry, but the user said "all of these sound delicious," which could mean they want (b) for completeness.
- **Snapshot retention.** Keep `themes/_snapshot/` in the repo as a regression baseline (re-runnable in CI later), or delete after PR #1 verification passes? Recommending: keep, with a `themes/_snapshot/README.md` explaining what it is.
