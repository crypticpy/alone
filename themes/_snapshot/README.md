# `themes/_snapshot/`

Frozen copy of the three `themes/*.json` files as they shipped in **v1.2.0**, before the v1.3.0 pipeline conversion. **This directory is immutable** — its job is to anchor history, not to track the moving palette.

## Purpose

A regression baseline for the v1.3.0 pipeline conversion. The contract was: the new generator must produce JSON semantically identical (`diff <(jq -S ...)` empty) to v1.2.0 for the three existing variants. After PR #2 merged, that contract has been verified once. The snapshot remains in-tree so anyone can rerun the check at any commit:

```bash
npm run build:themes
for v in alone alone-soft alone-focused; do
  diff <(jq -S . "themes/$v-color-theme.json") <(jq -S . "themes/_snapshot/$v-color-theme.json")
done
```

On **palette-preserving** changes (refactors of `_src/`, token renames, shared-value extraction) the diff stays empty — useful as a sanity gate. On **intentional** palette changes (retunes, added scopes, fontStyle adjustments) the diff becomes non-empty for the affected keys; at that point the snapshot stops being a green/red gate for those keys and becomes a "what's changed since v1.2.0" diagnostic. That's the intended behavior — the snapshot is a fixed historical reference point, not a moving baseline.

If you later want a moving baseline for some other release, create a new sibling directory (`themes/_v1.5.0-snapshot/`, etc.) rather than overwriting this one.

## Not part of the build

`scripts/build-themes.mjs` does not read this directory. It only reads `themes/_src/`. The snapshot is purely a verification artifact.
