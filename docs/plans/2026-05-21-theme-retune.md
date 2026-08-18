# Plan: Theme retune (v1.2.0) — honor the L\* ladder & fix syntax collisions

## Summary

Re-tune the **Alone** theme palette and semantic-token assignments so the colors actually match the science the README claims, and fix the perceptual collisions identified in the prior audit (Keywords/Functions/Types L\* drift, eight semantic tokens sharing one hex, brightest-in-palette cursor, narrow bracket-pair hue band, find-match indistinguishable from selection, inlay hints below comment contrast, undifferentiated `defaultLibrary`, dusty-rose serving both regex and decorators, italic-fringing tradeoff undocumented). Apply uniformly across all three variants (Alone, Alone Soft, Alone Focused) via a one-shot Node transform script and keep the README in sync.

## Scope

**In:**

- New palette values for `themes/alone-color-theme.json`, `themes/alone-soft-color-theme.json`, `themes/alone-focused-color-theme.json` (Focused inherits Standard syntax; only Soft gets its own dim palette).
- Semantic-token `fontStyle` additions to differentiate `interface`, `typeParameter`, `defaultLibrary`, `enumMember`, etc.
- New bracket-pair color set with monotonic L\* descent (depth = dimness).
- Cursor color change (drop from `#E8B850` to mid-tier gold).
- Find-match hue offset (gold → burnt-sienna family) so search results visually separate from selection.
- Inlay hint tier bump (raise to L\* ~50 with subtle pill background).
- Escape-character / decorator color split.
- One-shot transform script `scripts/retune.mjs` (kept in repo as the record of what changed).
- One-shot verification script `scripts/verify-palette.mjs` that computes CIE L\* + WCAG contrast against `#0C0A09` and asserts the README ladder.
- README updates: L\* ladder block, WCAG contrast table, color palette table, bracket pair list, new "Italic Fringing Tradeoff" subsection with opt-out snippet.
- `CHANGELOG.md` entry under `[1.2.0]`.
- `package.json` version bump to `1.2.0`.

**Out:**

- Building a permanent variant-build pipeline (that was a repo-level improvement, not a theme one — the one-shot script is enough today).
- A fourth "Roman" / non-italic variant (we'll address italic fringing via documentation + a settings snippet, not a new theme file).
- A fourth "Scotopic Red" variant.
- Repackaging or publishing the VSIX (user will decide when to ship).
- Terminal config files in `terminal/` (this turn is the VS Code themes).
- JetBrains companion, Neovim port, marketplace screenshots, Open VSX (all repo-level items deferred).

## Steps

1. **Define the new palette in `scripts/retune.mjs`** — a single mapping per variant of `old_hex → new_hex` plus a small list of structural edits (semantic-token fontStyle additions, bracket-pair re-ordering, escape/decorator split). Computed targets to be confirmed after the transform runs: Functions and Types each get their own L\* tier (Functions above Strings, Types above Functions) so the eight-token color collision at L\* 55-57 is broken; bracket pairs ladder from the high-L\* end down to ~L\* 34. (As shipped: Functions L\* 62, Types L\* 65, brackets L\* 78→34. Keywords was already at L\* 68 in v1.1.0 and stays put.)
2. **Run the transform** to rewrite all three theme JSONs in place. Verify each file still parses as JSON and that the three variants keep identical key sets (Soft differs only in syntax hexes; Focused differs only in UI chrome hexes).
3. **Apply non-mechanical edits directly** with Edit calls where the transform isn't a pure hex swap: `editorCursor.foreground`, `editor.findMatch*` family, `editorInlayHint.*` family, and bracket-pair guide colors (so the guides match the new bracket spread).
4. **Write `scripts/verify-palette.mjs`** that loads each theme, computes CIE L\* for the headline syntax roles, and asserts: (a) the L\* ladder is monotonically descending (out-of-order pairs hard-fail; adjacent gaps below 3 L\* emit a soft warning, since the warm-only gamut can't deliver large gaps across all ten tiers); (b) WCAG contrast values quoted in `README.md` match the computed values against `#0C0A09` within ±0.05 (hard-fail on drift); (c) no syntax-role hex falls in the 450-520nm blue/cyan band (B > R and B > G); (d) the three variants share identical `colors.*` and `semanticTokenColors.*` key sets. The verifier reports per-role L\* values but does not enforce a per-role tolerance — the README ladder is treated as derived output, re-rendered from this script. Run it and fix any drift it surfaces.
5. **Update `README.md`**: re-render the L\* ladder block with the actual new values, refresh the WCAG contrast table, refresh the Syntax Colors and Bracket Pair tables, add an "Italic Fringing Tradeoff" subsection under Astigmatism Considerations with a copy-paste `editor.tokenColorCustomizations` snippet that strips italics for users who need it.
6. **Update `CHANGELOG.md`** with a `[1.2.0]` entry describing each of the 10 changes, and bump `package.json` `version` to `1.2.0`.
7. **Final sanity pass**: open Standard / Soft / Focused in VS Code (or at minimum `jq .` them) and eyeball the `samples/` files render. If anything looks off, iterate before declaring done.

## Parallel execution

Not applicable — steps 1-3 all touch the three theme JSONs sequentially. Step 4's verifier is downstream of step 3. Step 5 (README) is downstream of step 4's confirmation. Single-agent execution.

## Testing

- `node scripts/verify-palette.mjs` — passes (L\* claims hold, no blue/cyan in syntax, variant key parity).
- `jq . themes/*.json > /dev/null` — all three files parse.
- Visual inspection of `samples/demo.tsx`, `demo.py`, `demo.rs`, `demo.go` after applying the theme locally.

## Open questions

None — the audit already settled the direction. Will decide hex targets during implementation by computing L\* against the README ladder.
