# Publishing Alone

Everything below the "Once" line is done once by the repository owner. After that a release is `git tag vX.Y.Z && git push origin vX.Y.Z` and the [release workflow](../.github/workflows/release.yml) does the rest.

## How a release works

1. Bump `version` in `package.json` (and `package-lock.json`, `npm version --no-git-tag-version X.Y.Z` does both), move the `[Unreleased]` CHANGELOG entries under `## [X.Y.Z] - YYYY-MM-DD`, commit on `main` through a PR.
2. `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. The workflow: checks the tag matches `package.json`, runs `npm run check && npm test`, packages `alone-X.Y.Z.vsix`, creates a GitHub Release with the VSIX attached, then publishes the same VSIX to the VS Code Marketplace (`VSCE_PAT`) and Open VSX (`OVSX_PAT`). Either publish step is skipped if its secret is missing, so the workflow is safe to run before the accounts exist.
4. Verify on the Marketplace page (a few minutes) and Open VSX (usually seconds).

A dry run without publishing: **Actions → Release → Run workflow** with *publish* unchecked — produces the VSIX artifact and exercises everything except the two publish steps.

---

## Once: accounts, tokens, secrets

### 1. VS Code Marketplace publisher `crypticpy`

`package.json` already declares `"publisher": "crypticpy"`; the publisher ID on the Marketplace must match exactly.

1. Sign in at <https://marketplace.visualstudio.com/manage> with a Microsoft account (create one if needed — it can be tied to any email).
2. **Create publisher** → ID `crypticpy`, display name of your choice. If `crypticpy` is taken, pick another ID and change `"publisher"` in `package.json` before the first publish.

### 2. Azure DevOps Personal Access Token (for `vsce`)

The Marketplace authenticates `vsce` with an Azure DevOps PAT, not a Marketplace-side key.

1. Go to <https://dev.azure.com> with the same Microsoft account. If you have no organisation, create one (any name; it's only a container for the token).
2. User settings (top-right) → **Personal access tokens** → **New Token**:
   - Name: `vsce-alone`
   - Organization: **All accessible organizations** (required — a single-org token cannot publish)
   - Expiration: custom, up to 1 year (put the expiry in your calendar)
   - Scopes: **Custom defined** → *Show all scopes* → **Marketplace: Manage** (nothing else)
3. Copy the token now; it is shown once.
4. Sanity check locally (also verifies the publisher exists and the token has the right scope):
   ```bash
   npx vsce login crypticpy      # paste the PAT
   npx vsce ls-publishers
   ```

### 3. Open VSX namespace + token (for `ovsx`)

Open VSX is what VSCodium, Gitpod, Theia and Cursor-style forks read.

1. Sign in at <https://open-vsx.org> with GitHub.
2. Profile → **Access Tokens** → *Generate New Token* (name `ovsx-alone`). Copy it.
3. Claim the namespace once (it must equal the `publisher` field):
   ```bash
   npx --yes ovsx@1 create-namespace crypticpy --pat <OVSX_PAT>
   ```
   Optionally file the [publisher-agreement / namespace ownership](https://github.com/EclipseFdn/open-vsx.org/wiki/Namespace-Access) issue so the namespace shows as verified.

### 4. Repository secrets

GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret     | Value                              |
| ---------- | ---------------------------------- |
| `VSCE_PAT` | the Azure DevOps PAT from step 2   |
| `OVSX_PAT` | the Open VSX access token from step 3 |

The workflow only reads them on `v*` tags (or a manual run with *publish* checked).

### 5. First publish (smoke test)

Do the very first publish by hand so any Marketplace-side rejection (icon size, README links, publisher mismatch) is visible immediately:

```bash
npm ci && npm run check && npm test
npx vsce package                        # alone-2.0.0.vsix
npx vsce publish --packagePath alone-2.0.0.vsix   # uses the PAT from `vsce login`
npx --yes ovsx@1 publish alone-2.0.0.vsix --pat <OVSX_PAT>
```

Then check:

- <https://marketplace.visualstudio.com/items?itemName=crypticpy.alone> renders README, icon, palette PNGs; the four themes are listed under *Contributions*.
- <https://open-vsx.org/extension/crypticpy/alone> exists.
- `code --install-extension crypticpy.alone` installs it and **Preferences: Color Theme** offers all four variants.

From the next version on, just tag.

---

## Screenshots

`images/palette-<variant>.png` are generated (`npm run render:palette`, checked in CI). Real editor screenshots are captured on macOS with:

```bash
scripts/capture-screenshots.sh              # → images/screenshot-{alone,alone-soft,alone-focused,alone-roman}.png
```

The terminal you run it from needs **Screen Recording** and **Accessibility** permission (System Settings → Privacy & Security); without them the output is the desktop wallpaper. Install JetBrains Mono first so the shot matches the README's recommended settings. Then reference the images from README:

```markdown
<!-- hero: images/hero.png … -->      ← replace this comment with:
![Alone — samples/demo.tsx](images/screenshot-alone.png)
```

and add the Soft / Focused / Roman shots under **Theme Variants**. Keep each PNG under ~500 KB. README images are not packed into the VSIX (`.vscodeignore` excludes `images/palette-*.png` and `images/screenshot-*.png`); `vsce` rewrites relative README URLs to the GitHub repository, so the Marketplace page fetches them from `main`. That means images must be committed *before* the tag that publishes the README referencing them.

Capture checklist if you prefer to do it by hand: window ~1440×900, `samples/demo.tsx` open, minimap on, no sidebar/panel, cursor on a bracket so the active-guide shows, one hover tooltip visible if you like; save as PNG, no window shadow (`screencapture -o`).

---

## Badges (once live)

Paste under the README title:

```markdown
[![Marketplace](https://img.shields.io/visual-studio-marketplace/v/crypticpy.alone?label=Marketplace&color=D4A048)](https://marketplace.visualstudio.com/items?itemName=crypticpy.alone)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/crypticpy.alone?color=C08868)](https://marketplace.visualstudio.com/items?itemName=crypticpy.alone)
[![Open VSX](https://img.shields.io/open-vsx/v/crypticpy/alone?label=Open%20VSX&color=9A8B60)](https://open-vsx.org/extension/crypticpy/alone)
[![CI](https://github.com/crypticpy/alone/actions/workflows/ci.yml/badge.svg)](https://github.com/crypticpy/alone/actions/workflows/ci.yml)
```

## Troubleshooting

- `vsce publish` → *401 / The Personal Access Token used has expired or is invalid*: token scope must be **Marketplace: Manage** with **All accessible organizations**.
- *Publisher 'crypticpy' not found*: create it at the manage URL above (the ID must match `package.json`).
- *Extension version already exists*: bump `version`; the Marketplace never accepts re-publishing a version.
- Release workflow fails at *Tag must match*: `package.json` version and the tag differ — bump and re-tag (`git tag -d vX.Y.Z && git push --delete origin vX.Y.Z` first).
- Open VSX *namespace not found*: run `create-namespace` (step 3) once.
