# `themes/_snapshot/`

Frozen copy of the three `themes/*.json` files as they shipped in **v1.2.0**, before the v1.3.0 pipeline conversion.

## Purpose

A regression baseline for the build pipeline. After any change to `themes/_src/base.yaml` or `themes/_src/variants/*.yaml`, run:

```bash
npm run build:themes
for v in alone alone-soft alone-focused; do
  diff <(jq -S . "themes/$v-color-theme.json") <(jq -S . "themes/_snapshot/$v-color-theme.json")
done
```

If the diff is empty for all three, the change is palette-preserving — useful when refactoring the source layout, renaming tokens, or extracting shared values into `base.yaml`.

If you intentionally change a value (a palette retune, a new scope, a fontStyle adjustment), the diff will be non-empty for the affected variants — that's expected, and the snapshot is no longer the source of truth for those keys. At that point either:

1. **Re-snapshot**: copy the new built JSONs back over `_snapshot/*.json` and commit, locking in the new baseline. Note the change in `CHANGELOG.md`.
2. **Keep the historical snapshot**: leave `_snapshot/` pointing at v1.2.0 forever as a deep-history reference. The diff stops being a green/red gate and becomes a "what's changed since v1.2.0" diagnostic.

The repo currently uses option (1) — re-snapshot on intentional palette changes.

## Not part of the build

`scripts/build-themes.mjs` does not read this directory. It only reads `themes/_src/`. The snapshot is purely a verification artifact.
