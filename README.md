# Alone

**A theme for those who thrive coding alone in the dark.**

The ultimate expression of vision science in a coding theme. Protect your eyes as your sessions extend for hours. Your eyes won't hate you.

---

## The Philosophy

Some of us do our best work in the dark. Late nights, early mornings, blackout curtains drawn. Just you, your code, and the glow of the screen.

**Alone** is built for these moments. Not just another dark theme—a scientifically engineered environment that protects your dark adaptation, reduces eye strain, and lets you code for hours without fatigue.

---

## The Science

### Why Most Dark Themes Fail You

Standard dark themes use blue-heavy syntax highlighting (cyan strings, blue keywords, purple types). This is catastrophic for dark-room work:

- **Blue light (450-490nm)** causes maximum rhodopsin bleaching, destroying your dark adaptation
- **Cyan (490-520nm)** hits peak rod cell sensitivity—the receptors you need most in low light
- **High contrast** (white on black) causes halation, especially for astigmatic eyes

Your eyes spend 20-30 minutes building dark adaptation. One bright blue highlight resets the clock.

### The Alone Approach

**Alone** uses only wavelengths above 575nm—amber, orange, gold, olive—the spectrum where rhodopsin absorption drops to near-zero. Your rod cells remain undisturbed. Your cone cells handle the reading. Your dark adaptation survives.

| Wavelength | Color        | Rod Impact  | Our Usage          |
| ---------- | ------------ | ----------- | ------------------ |
| 450-490nm  | Blue         | **Maximum** | ❌ Eliminated      |
| 490-520nm  | Cyan         | **Severe**  | ❌ Eliminated      |
| 520-560nm  | Green        | Moderate    | ⚠️ Avoided         |
| 560-580nm  | Yellow-Green | Low         | ✅ Strings (olive) |
| 580-620nm  | Amber/Orange | Minimal     | ✅ Primary palette |
| 620-700nm  | Red          | Near-zero   | ✅ Errors only     |

### Halation Reduction

Pure black (#000000) backgrounds cause halation—a glowing halo effect around bright text, especially problematic for astigmatism. **Alone** uses #0C0A09, a near-black with warm undertones that reduces this effect while maintaining the dark aesthetic.

### Lightness Spacing (L\*)

On calibrated OLED and miniLED displays, subtle color differences disappear. **Alone** ensures each syntax element has distinct L\* (perceptual lightness) values, computed in CIE L\*a\*b\* against the editor background `#0C0A09`:

<!-- verify:ladder:start -->

```text
L* 81  ███████████████████████████   Operators
L* 75  █████████████████████████     Variables
L* 72  ████████████████████████      Numbers
L* 68  ███████████████████████       Keywords (bold)
L* 65  ██████████████████████        Types
L* 61  ████████████████████          Functions
L* 58  ███████████████████           Strings (italic)
L* 55  ██████████████████            Special
L* 49  ████████████████              Punctuation
L* 44  ███████████████               Comments (italic)
```

<!-- verify:ladder:end -->

The ladder is monotonic descending. The warm-only palette can't deliver large gaps across all ten tiers — the whole run from Operators to Comments spans under 40 L\*. The largest gaps sit at the top and bottom (Operators→Variables, Special→Punctuation, Punctuation→Comments); the middle tiers run in the 3–4 L\* range and rely on font style (italic strings/comments/interfaces/`defaultLibrary`, bold keywords/escapes) and hue (gold vs olive vs dusty-rose) to carry the differentiation that lightness alone can't. The ladder above is rendered by `scripts/verify-palette.mjs` from the live theme files (exact per-rung L\* and gaps are in its section 1 output); the verifier hard-fails on out-of-order roles and on any adjacent gap below 3 L\* or ΔE2000 below 4.

---

## Color Palette

### Syntax Colors

<!-- verify:syntax-colors:start -->

| Element              | Hex       | Style              |
| -------------------- | --------- | ------------------ |
| Operators            | `#D8C8A8` | Normal             |
| Variables            | `#C8B89A` | Normal             |
| Numbers              | `#DEA64E` | Normal             |
| Keywords             | `#C8A040` | **Bold**           |
| Types                | `#BC9858` | Normal             |
| Interface/Type-param | `#BC9858` | _Italic_           |
| Functions            | `#C08868` | Normal             |
| Built-in funcs       | `#C08868` | _Italic_           |
| Strings              | `#9A8B60` | _Italic_           |
| Escapes              | `#D4B088` | **Bold**           |
| Regex / decorators   | `#A87878` | _Italic_           |
| Comments             | `#6E665B` | _Italic_           |
| Errors               | `#D46A66` | **Bold** underline |

<!-- verify:syntax-colors:end -->

### Bracket Pair Colors

Six warm variants for bracket colorization, ordered by perceptual lightness so **depth maps to dimness** — the deeper you nest, the dimmer the bracket:

<!-- verify:bracket-colors:start -->

1. Bright Gold `#E0B868` (L\* ~77)
2. Gold `#C89868` (L\* ~66)
3. Amber-Brown `#B08458` (L\* ~58)
4. Umber `#967048` (L\* ~50)
5. Dark Umber `#7A5C3C` (L\* ~41)
6. Deep Brown `#604830` (L\* ~33)

<!-- verify:bracket-colors:end -->

### Background Hierarchy

```
#0C0A09  Editor background
#0A0908  Sidebar, panels, title bar
#151311  Widgets, dropdowns
#1E1915  Hover states
#28221C  Active/selected
#352D25  Borders, strong highlights
```

---

## Installation

### VS Code Marketplace

1. Open **Extensions** (Ctrl+Shift+X / Cmd+Shift+X)
2. Search for **"Alone"**
3. Click **Install**
4. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
5. Select **Preferences: Color Theme** and choose from:
   - **Alone** — The standard theme
   - **Alone Soft** — Dimmer variant for extreme dark adaptation
   - **Alone Focused** — Minimal UI for maximum focus
   - **Alone Roman** — Standard palette, no italics (astigmatism / italic-averse)

### From VSIX (Recommended for Manual Install)

1. Download the latest `.vsix` from [Releases](https://github.com/crypticpy/alone/releases)
2. In VS Code, open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
3. Run **Extensions: Install from VSIX...**
4. Select the downloaded `.vsix` file
5. Reload VS Code when prompted

### From Source

```bash
# Clone the repository
git clone https://github.com/crypticpy/alone.git

# Copy to VS Code extensions
cp -r alone ~/.vscode/extensions/

# Restart VS Code
```

---

## Theme Variants

**Alone** is the headline family member — a **mesopic**-light theme tuned for the intermediate range where both rod and cone receptors contribute, typical of a dim-but-not-dark room. The three siblings below are positioned around it; further along the dark-adaptation continuum, the family has room to grow (see [Future Plans](CHANGELOG.md#future-plans)).

### Alone (Standard) — _mesopic_

The full-featured theme with balanced contrast for extended coding sessions. Default starting point for most users.

### Alone Soft

For **extreme dark adaptation**. All syntax colors reduced ~20% brightness, backgrounds slightly lifted to reduce contrast. Perfect for pitch-black rooms or users with high light sensitivity.

### Alone Focused

For **maximum concentration**. UI chrome is muted—activity bar badges dimmed, sidebar de-emphasized, borders hidden. Syntax highlighting unchanged. Your code takes center stage.

### Alone Roman

The Standard palette with **no italics** — for astigmatic readers who find slanted monospace edges fringe, or anyone who simply dislikes italic code. Every rule that Standard sets in italic (comments, strings, docstrings, regex, decorators, interfaces, type parameters, namespaces, `*.defaultLibrary`, `*.async`, `this`/`self`) is upright here; the only italic left is Markdown `*emphasis*`, which is the document's own formatting. Bold keywords/escapes/errors are unchanged. Two hexes differ from Standard so the pairs that Standard tells apart with italics stay separable on colour alone under red-green colour-vision deficiency: strings `#9A8B60 → #9C8B4A` and `*.defaultLibrary` `#B08C50 → #AA884C` (both verified ΔE2000 ≥ 5 after protan/deutan simulation). What you give up is the italic-only distinctions — interfaces look like classes, library calls like local ones, async like sync.

---

## Extension Compatibility

**Alone** includes custom styling for popular extensions:

### GitLens

Git blame annotations styled with warm, subtle colors that don't distract from code.

### Error Lens

Inline errors, warnings, and hints use the warm palette:

- Errors: Warm red (`#D46A66`)
- Warnings: Amber (`#D4A048`)
- Info: Muted gold (`#B89860`)
- Hints: Olive (`#9A8B60`)

### Indent Rainbow

Add to your `settings.json` for warm-toned indent guides:

```json
"indentRainbow.colors": [
  "rgba(212, 160, 72, 0.07)",
  "rgba(200, 144, 104, 0.07)",
  "rgba(184, 149, 110, 0.07)",
  "rgba(168, 152, 96, 0.07)",
  "rgba(196, 160, 120, 0.07)",
  "rgba(212, 176, 136, 0.07)"
]
```

### Todo Tree

Add to your `settings.json` for themed TODO highlights:

```json
"todo-tree.highlights.customHighlight": {
  "TODO": { "foreground": "#D4A048", "background": "#D4A04820" },
  "FIXME": { "foreground": "#D46A66", "background": "#D46A6620" },
  "HACK": { "foreground": "#A87878", "background": "#A8787820" },
  "NOTE": { "foreground": "#9A8B60", "background": "#9A8B6020" }
}
```

---

## Recommended Settings

For the full **Alone** experience, add these to your `settings.json`:

```json
{
  // Font: JetBrains Mono Variable with lighter weight (reduces halation for astigmatism)
  "editor.fontFamily": "'JetBrains Mono Variable', 'JetBrains Mono', monospace",
  "editor.fontSize": 14,
  "editor.fontWeight": "450",
  "editor.fontLigatures": false,
  "editor.lineHeight": 1.6,
  "editor.letterSpacing": 0.3,

  // Cursor: Solid, no blinking (reduces micro-adaptations)
  "editor.cursorBlinking": "solid",
  "editor.cursorStyle": "block",
  "editor.cursorWidth": 2,

  // Brackets: Enable colorization
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active",

  // Smooth scrolling
  "editor.smoothScrolling": true,
  "workbench.list.smoothScrolling": true,
  "terminal.integrated.smoothScrolling": true,

  // Reduce visual noise
  "editor.minimap.enabled": true,
  "editor.minimap.renderCharacters": false,
  "editor.minimap.scale": 1,
  "editor.renderWhitespace": "none",
  "editor.renderLineHighlight": "line",
  "editor.occurrencesHighlight": "singleFile",

  // Semantic highlighting (recommended)
  "editor.semanticHighlighting.enabled": true,

  // Window: Reduce chrome if desired
  "window.titleBarStyle": "custom",
  "window.autoDetectColorScheme": false
}
```

---

## Display Recommendations

### OLED Displays

- **Brightness**: 20-40% in dark rooms
- Enable pixel brightness limiter if available
- **Alone** uses #0C0A09 (not pure black) to prevent harsh pixel edges

### Mini LED Displays

- **Brightness**: 30-50% in dark rooms
- **Local dimming**: Medium (not Maximum) to reduce blooming
- **Contrast**: 80-90% to prevent halation

### Both Display Types

- **Color Temperature**: 3000-4000K at night (if OS supports)
- **True Tone/Auto-Brightness**: Disable for consistency
- **Night Shift/Blue Light Filter**: Enable and set to maximum warmth

---

## Terminal Themes

Matching terminal themes are included in the `terminal/` directory:

| Terminal             | File                                   | Installation                                                      |
| -------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| **Kitty**            | `terminal/alone.conf`                  | Copy to `~/.config/kitty/themes/` and `include themes/alone.conf` |
| **iTerm2**           | `terminal/alone.itermcolors`           | Preferences → Profiles → Colors → Import                          |
| **Alacritty**        | `terminal/alone.toml`                  | Import in your `alacritty.toml` config                            |
| **Windows Terminal** | `terminal/alone-windows-terminal.json` | Add scheme to `settings.json`                                     |

All terminal themes use the same warm color palette. The blue and cyan slots carry no short-wavelength light: blue is a warm gray (`#9C948E`) and cyan is the terracotta used for functions (`#C08868`) — two hues a red-green-deficient reader can still tell apart (ΔE2000 ≥ 10 across all eight normal slots), instead of the two near-identical grays that shipped before 2.0.0. Programs that print blue-on-black (`ls`, `grep`, `man`) stay readable (blue Lc 45 against the terminal background).

The sixteen ANSI slots (as shipped in the VS Code theme and mirrored in the terminal files):

<!-- verify:ansi:start -->

| Slot    | Hex       | L\* | Bright slot   | Hex       | L\* |
| ------- | --------- | --- | ------------- | --------- | --- |
| Black   | `#0C0A09` | 3   | BrightBlack   | `#6E665B` | 44  |
| Red     | `#B85450` | 48  | BrightRed     | `#D46A66` | 57  |
| Green   | `#9A8B60` | 58  | BrightGreen   | `#C4B078` | 72  |
| Yellow  | `#D4A048` | 69  | BrightYellow  | `#E8B850` | 77  |
| Blue    | `#9C948E` | 62  | BrightBlue    | `#B2AAA3` | 70  |
| Magenta | `#A87878` | 55  | BrightMagenta | `#C89088` | 65  |
| Cyan    | `#C08868` | 61  | BrightCyan    | `#CEA284` | 70  |
| White   | `#C8B89A` | 75  | BrightWhite   | `#EDDCC4` | 89  |

<!-- verify:ansi:end -->

---

## Language Support

**Alone** includes optimized highlighting for:

- JavaScript / TypeScript / JSX / TSX
- Python
- Rust
- Go
- HTML / CSS / SCSS
- JSON / YAML / TOML
- Markdown
- Shell / Bash
- SQL
- And more via semantic highlighting

See `samples/` directory for demo files showcasing syntax highlighting.

---

## Accessibility

### Contrast Ratios (WCAG)

Key contrast ratios against the editor background (`#0C0A09`):

<!-- verify:contrast:start -->

| Element   | Color     | WCAG   | WCAG level | APCA Lc |
| --------- | --------- | ------ | ---------- | ------- |
| Operators | `#D8C8A8` | 12.0:1 | AAA        | 74      |
| Variables | `#C8B89A` | 10.1:1 | AAA        | 65      |
| Numbers   | `#DEA64E` | 9.1:1  | AAA        | 60      |
| Keywords  | `#C8A040` | 8.1:1  | AAA        | 54      |
| Types     | `#BC9858` | 7.3:1  | AAA        | 49      |
| Functions | `#C08868` | 6.6:1  | AA         | 45      |
| Strings   | `#9A8B60` | 5.9:1  | AA         | 40      |
| Comments  | `#6E665B` | 3.5:1  | AA (large) | 23      |

<!-- verify:contrast:end -->

Computed against the editor background (`#0C0A09`) using the WCAG 2.x contrast formula. Comments intentionally use lower contrast to de-emphasize them. APCA Lc is the [APCA](https://github.com/Myndex/SAPC-APCA) (0.0.98G-4) lightness-contrast value; ≥ 60 is the body-text target, ≥ 45 large text, ≥ 30 the floor for non-essential text. All primary code elements meet WCAG AA for normal text; five of eight clear AAA. This table is rendered by `node scripts/verify-palette.mjs --write-readme`.

### Astigmatism Considerations

- Near-black background (#0C0A09) reduces halation vs pure black
- Keywords use weight 450 (lighter bold) to reduce fringing
- Warm desaturated palette minimizes chromatic aberration
- Cursor uses mid-tier gold (`#D4A048`) rather than the brightest palette hex — a small bright point on near-black is a halation hotspot, so we keep it dimmer
- **Alone Soft** variant available for users needing even lower contrast

### Italic Fringing Tradeoff

Italics provide cheap differentiation (strings, comments, interfaces, type parameters, `defaultLibrary`, regex) within the warm palette. But slanted edges in a monospace font can _increase_ fringing for astigmatic readers. If italics give you trouble, pick **Alone Roman** — the same palette with the italic channel removed and two hexes adjusted so nothing that italics used to separate collapses. If you want to keep Soft or Focused and only drop a few italics, VS Code's per-theme overrides still work:

```jsonc
"editor.tokenColorCustomizations": {
  "[Alone Soft]": {
    "textMateRules": [
      { "scope": ["comment", "string"], "settings": { "fontStyle": "" } }
    ]
  }
},
"editor.semanticTokenColorCustomizations": {
  "[Alone Soft]": {
    "enabled": true,
    "rules": {
      "interface": { "italic": false },
      "typeParameter": { "italic": false },
      "*.defaultLibrary": { "italic": false }
    }
  }
}
```

---

## FAQ

### Why no blue or cyan?

Blue (450-490nm) and cyan (490-520nm) light causes maximum disruption to dark-adapted vision. These wavelengths bleach rhodopsin, the photopigment in your rod cells, requiring 20-30 minutes to regenerate. **Alone** uses only wavelengths above 575nm.

### Why italic for strings and comments?

Font style provides differentiation without requiring additional colors. Italics signal "different voice"—comments are authorial notes, strings are literal data. This lets us maintain distinguishability within our constrained warm palette.

### Why bold for keywords?

Keywords are control flow—the skeletal structure of your program. Bold weight provides immediate visual anchoring without requiring a brighter or more saturated color that could cause eye strain.

### Is this good for astigmatism?

Yes. The near-black background (#0C0A09) reduces halation compared to pure black. The warm, desaturated palette minimizes chromatic aberration. The constrained contrast ratio prevents the "blooming" effect common with bright-on-dark themes.

### Can I use this in a lit room?

**Alone** is optimized for dark environments. In lit rooms, you may want higher contrast. That said, many users find it comfortable in low ambient light conditions.

---

## Building the Themes (Contributors)

The shipped `themes/*.json` files are **generated**. Don't edit them directly — your edits will be overwritten on the next build.

The source of truth lives under `themes/_src/`:

- **`themes/_src/base.yaml`** — the structural skeleton. Every key the variants share (shape, scopes, font styles, and any hex that happens to be identical across all variants) lives here as a literal. Every leaf that varies across variants is written as `${token.name}`.
- **`themes/_src/variants/<name>.yaml`** — per-variant bindings: `display`, `filename`, a `verify` block (which wavelength band the variant should pass and whether it's the "standard" used for the L\* ladder / README WCAG checks), and a `tokens:` block supplying the hex/alpha values for that variant's `${token.name}` references — plus the two font-style tokens `style.italic` (`italic` or `""`) and `style.semanticItalic` (`true`/`false`) that Alone Roman binds to "off".

The scripts:

```bash
npm run build:themes                          # regenerate themes/*.json from _src/
npm run verify                                # L* ladder, APCA floors, CVD + ANSI ΔE2000, wavelength scan, key parity, README tables
npm run check                                 # both, in sequence
npm test                                      # unit tests (colour math, generator rules) + pipeline tests (determinism, snapshot parity)
node scripts/verify-palette.mjs --write-readme  # re-render the verifier-owned README tables after a palette change
```

Every numeric table in this README that sits between `<!-- verify:…:start/end -->` markers is rendered by the verifier from the standard variant; edit the palette, run `--write-readme`, and commit the result — the default `verify` fails on drift. CI (`.github/workflows/ci.yml`) runs build → verify → test → `vsce package` on every push and pull request.

To add a new variant: copy an existing variants file, change `display` / `filename` / `verify`, fill in the `tokens:` block with the new palette, then `npm run check`. No edits to `base.yaml` are needed unless the new variant introduces a new key or scope (in which case all variants must add it — the parity check enforces this).

To change the **shape** (add a scope, add a colors key, reorder tokenColors entries) edit `base.yaml`; the change applies uniformly to every variant.

---

## Issues

Found a bug or have feedback? Open an issue at [github.com/crypticpy/alone/issues](https://github.com/crypticpy/alone/issues)

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Vision science research from the National Park Service (dark adaptation studies)
- Rhodopsin absorption spectra from photoreceptor biology literature
- The late-night coding community who inspired this work

---

_Code alone. Code in peace. Your eyes will thank you._
