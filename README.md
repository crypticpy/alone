# Alone

**A theme for those who thrive coding alone in the dark.**

<!-- hero: images/hero.png — added with the release pipeline (see docs/PUBLISHING.md) -->

Alone is a warm, low-luminance dark theme for people who code in dark rooms for hours. Every colour in it — syntax, UI chrome, terminal — has a dominant wavelength between 576 and 611 nm: gold, amber, olive, terracotta, dusty rose. There is no blue, no cyan, no purple, and no white text. Foregrounds sit well below the brightness of a typical dark theme, contrast is tuned with APCA rather than maxed out, and a verifier script fails the build if any of that drifts.

It is not a night-vision instrument (see [What it does not do](#what-it-does-not-do)); it is a comfortable place to spend a long night.

---

## Variants

| Theme | For | What changes |
| ----- | --- | ------------ |
| **Alone** | The default. A dim-but-not-dark room. | Full palette, italic + bold cues, standard chrome. |
| **Alone Soft** | Pitch-black rooms, light-sensitive eyes. | Every syntax colour ~20 % dimmer, backgrounds lifted a notch, gentler contrast (own APCA floors). |
| **Alone Focused** | Concentration. | Same code colours; UI chrome muted — badges dimmed, sidebar de-emphasised, borders hidden. |
| **Alone Roman** | Astigmatism, or anyone who dislikes italic code. | Standard palette with the italic channel removed; two hexes nudged so the pairs italics used to separate stay separable on colour alone. |

Details on each are in [Theme Variants](#theme-variants).

---

## The Science

The old pitch for this theme was "only wavelengths above 575 nm, so your rods stay dark-adapted." That is a claim about *dominant wavelength*, and it is true — but it is not the same as a claim about the *light*, and it is not where the comfort actually comes from. Here is what the palette really does and why it helps.

### What "warm-only" means on a screen

A monitor mixes three primaries. Any colour that is not fully saturated lights all three subpixels, including the blue one, no matter what hue it reads as. Alone's saturated golds emit almost nothing short of 540 nm; its neutrals — the body text, operators, punctuation, comments — necessarily do, because a neutral *is* a mix.

| Group (Standard) | Example | Dominant λ | Blue subpixel's share of the light | Rod stimulation per unit luminance, vs white |
| ---------------- | ------- | ---------- | ---------------------------------- | -------------------------------------------- |
| Neutrals (foreground, operators, punctuation, comments) | `#C8B89A` | 577 nm | ~23–27 % (white is 33 %) | ~85 % |
| Ambers (types, functions) | `#C08868` | 579–588 nm | ~11–15 % | ~60 % |
| Saturated golds (numbers, keywords, cursor) | `#C8A040` | 578–581 nm | ~5–6 % | ~55 % |
| Pure red (not in Alone — reserved for future variants) | `#B00000` | 612 nm | ~0 % | a few % |

Rod figures use the CIE 1951 scotopic curve through a tristimulus approximation and are indicative, not exact. The 2.0.0 retune pulled the bright neutrals' blue-subpixel drive from 37–48 % of full output down to 32–39 % without changing their lightness; it cannot go to zero while they stay readable as neutral text.

### The rod curve, for reference

Rod (scotopic) sensitivity V′(λ) peaks at 507 nm, not in the blue:

| λ (nm) | Colour | V′(λ) | Where it sits in Alone |
| ------ | ------ | ----- | ---------------------- |
| 450 | blue | 0.46 | no dominant hue here; only the neutrals' blue-subpixel component |
| 480 | blue-cyan | 0.79 | — |
| 507 | blue-green | **1.00** (peak) | — |
| 540 | green | 0.65 | — |
| 560 | yellow-green | 0.33 | — |
| 575–580 | yellow / gold | 0.16–0.12 | Operators, variables, numbers, keywords, types, strings, comments |
| 590 | amber | 0.07 | Functions (588 nm) |
| 610 | orange-red | 0.016 | Special (611 nm), errors (608 nm) |
| 620–650 | red | 0.007–0.0007 | future red-only variants |

### Where the benefit actually comes from

1. **Low luminance, unsaturated text.** The Standard foreground is L\* 75 — roughly half the luminance of white — and nothing in the syntax ladder is brighter than L\* 81. Glare, halation and contrast-driven fatigue scale with the luminance and edge contrast of the *text*, so this is the single biggest lever. (The background being `#0C0A09` rather than `#000000` — L\* 2.8 vs 0 — is cosmetic; it does not reduce halation. Dim text does.)
2. **No blue defocus.** The eye focuses 450 nm and 620 nm about 1.5–2 dioptres apart; that is why blue text on black shimmers and blooms for astigmatic and uncorrected eyes. Alone's saturated colours span roughly 540–610 nm (≈ 0.5 D of longitudinal chromatic aberration), and the neutrals carry far less blue than white text. This is the most real optical benefit of a warm palette.
3. **Less melanopic stimulation.** The melanopsin (ipRGC) curve peaks near 490 nm, close to the rod curve, so the ratios track the rod column above: the golds deliver about half the melanopic stimulus of white per unit luminance, the neutrals about 85 %. Combined with a lower absolute luminance and an OS warm shift (see [Display recommendations](#display-recommendations)) that adds up.
4. **Comfort.** Warm, low-chroma light at low luminance is simply easier to sit in for hours. That is subjective, and it is fine for it to be — the numbers above are what makes it defensible.

### What it does not do

- It does not preserve rod dark adaptation. Reading is foveal, cone-mediated vision; any screen bright enough to read from will reset full dark adaptation, and the neutrals stimulate rods at ~85 % of white per unit luminance. Recovery takes 30–40 minutes regardless of hue. If you need to keep night vision — telescope, cockpit, bridge — you need a *red-only* palette, which is where the roadmap's Apollo / Max Dark variants sit (see [Future Plans](CHANGELOG.md#future-plans)).
- It does not make the background matter. `#0C0A09` is warm so that the UI chrome does not look cold against the palette; that is all.

### Lightness spacing (L\*)

On calibrated OLED and mini-LED displays subtle colour differences disappear, so each syntax tier gets its own perceptual lightness, computed in CIE L\*a\*b\* against the editor background `#0C0A09`:

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

## Installation

### VS Code Marketplace

1. Open **Extensions** (Ctrl+Shift+X / Cmd+Shift+X)
2. Search for **"Alone"**
3. Click **Install**
4. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
5. Select **Preferences: Color Theme** and choose from:
   - **Alone** — The standard theme
   - **Alone Soft** — Dimmer variant for pitch-black rooms
   - **Alone Focused** — Minimal UI for maximum focus
   - **Alone Roman** — Standard palette, no italics (astigmatism / italic-averse)

### From VSIX

1. Download the latest `.vsix` from [Releases](https://github.com/crypticpy/alone/releases)
2. In VS Code, open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
3. Run **Extensions: Install from VSIX...**
4. Select the downloaded `.vsix` file
5. Reload VS Code when prompted

### From Source

```bash
git clone https://github.com/crypticpy/alone.git
cd alone && npm ci && npx @vscode/vsce package   # produces alone-<version>.vsix
code --install-extension alone-*.vsix
```

---

## Recommended Settings

For the full **Alone** experience, add these to your `settings.json`:

```json
{
  // Font: a variable monospace at a slightly-lighter-than-regular body weight.
  // fontVariations:true maps fontWeight onto the font's wght axis, so 450 really
  // renders as 450 instead of snapping to the nearest static instance.
  "editor.fontFamily": "'JetBrains Mono Variable', 'JetBrains Mono', monospace",
  "editor.fontSize": 14,
  "editor.fontWeight": "450",
  "editor.fontVariations": true,
  "editor.fontLigatures": false,
  "editor.lineHeight": 1.6,
  "editor.letterSpacing": 0.3,

  // Cursor: solid, no blinking (fewer micro-adaptations)
  "editor.cursorBlinking": "solid",
  "editor.cursorStyle": "block",
  "editor.cursorWidth": 2,

  // Brackets: enable colorization (depth maps to dimness)
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active",

  // Smooth scrolling
  "editor.smoothScrolling": true,
  "workbench.list.smoothScrolling": true,
  "terminal.integrated.smoothScrolling": true,

  // Reduce visual noise (minimap kept as a dim shape — no rendered characters)
  "editor.minimap.enabled": true,
  "editor.minimap.renderCharacters": false,
  "editor.minimap.scale": 1,
  "editor.renderWhitespace": "none",
  "editor.renderLineHighlight": "line",
  "editor.occurrencesHighlight": "singleFile",

  // Semantic highlighting (recommended — the theme styles Pylance / rust-analyzer / TS server tokens)
  "editor.semanticHighlighting.enabled": true,

  // Window: reduce chrome if desired
  "window.titleBarStyle": "custom",
  "window.autoDetectColorScheme": false
}
```

Bold in the theme (keywords, escapes, errors) is CSS `bold` — weight 700. VS Code themes cannot set intermediate weights; `editor.fontWeight` only controls the body text, so with the settings above you get 450 body against 700 keywords.

---

## Display Recommendations

### OLED

- **Brightness**: 20–40 % in dark rooms
- Enable the pixel brightness limiter / ABL if the panel offers one
- The palette's L\* 75 foreground stays clear at these brightnesses; you should not need to push it higher

### Mini LED

- **Brightness**: 30–50 % in dark rooms
- **Local dimming**: Medium (not Maximum) to reduce blooming
- **Contrast**: 80–90 % to prevent halation

### Both

- **Night Shift / Night Light / f.lux**: enable, and set it warm (3000–4000 K). Alone stacks well with an OS warm shift: it removes still more of the neutrals' blue-subpixel light, and because nothing in the palette depends on a cool hue, the theme keeps its contrast where a blue-heavy theme collapses toward gray.
- **True Tone / auto-brightness**: disable for consistency.
- The screen is still the brightest thing in a dark room. If your goal is less melanopic light in the evening, the biggest levers are the display's absolute brightness and the OS warm shift; the theme helps on top of those, not instead of them.

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

## Theme Variants

**Alone** is the headline family member — tuned for the mesopic range, where both rods and cones contribute, typical of a dim-but-not-dark room. The three siblings are positioned around it; further along the dark-adaptation continuum the family has room to grow (see [Future Plans](CHANGELOG.md#future-plans)).

### Alone (Standard)

The full-featured theme with balanced contrast for extended coding sessions. Default starting point for most users.

### Alone Soft

For pitch-black rooms and light-sensitive eyes. All syntax colours reduced ~20 % in brightness, backgrounds slightly lifted to reduce contrast. Verified against its own, lower APCA floors.

### Alone Focused

For concentration. UI chrome is muted — activity-bar badges dimmed, sidebar de-emphasised, borders hidden. Syntax highlighting unchanged. Your code takes centre stage.

### Alone Roman

The Standard palette with **no italics** — for astigmatic readers who find slanted monospace edges fringe, or anyone who simply dislikes italic code. Every rule that Standard sets in italic (comments, strings, docstrings, regex, decorators, interfaces, type parameters, namespaces, `*.defaultLibrary`, `*.async`, `this`/`self`) is upright here; the only italic left is Markdown `*emphasis*`, which is the document's own formatting. Bold keywords/escapes/errors are unchanged. Two hexes differ from Standard so the pairs that Standard tells apart with italics stay separable on colour alone under red-green colour-vision deficiency: strings `#9A8B60 → #9C8B4A` and `*.defaultLibrary` `#B08C50 → #AA884C` (both verified ΔE2000 ≥ 5 after protan/deutan simulation). What you give up is the italic-only distinctions — interfaces look like classes, library calls like local ones, async like sync.

---

## Terminal Themes

Matching terminal themes are included in the `terminal/` directory:

| Terminal             | File                                   | Installation                                                      |
| -------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| **Kitty**            | `terminal/alone.conf`                  | Copy to `~/.config/kitty/themes/` and `include themes/alone.conf` |
| **iTerm2**           | `terminal/alone.itermcolors`           | Preferences → Profiles → Colors → Import                          |
| **Alacritty**        | `terminal/alone.toml`                  | Import in your `alacritty.toml` config                            |
| **Windows Terminal** | `terminal/alone-windows-terminal.json` | Add scheme to `settings.json`                                     |

All terminal themes use the same warm colour palette. The blue and cyan slots carry no short-wavelength dominant hue: blue is a warm gray (`#9C948E`) and cyan is the terracotta used for functions (`#C08868`) — two hues a red-green-deficient reader can still tell apart (ΔE2000 ≥ 10 across all eight normal slots), instead of the two near-identical grays that shipped before 2.0.0. Programs that print blue-on-black (`ls`, `grep`, `man`) stay readable (blue Lc 45 against the terminal background).

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

## Language Support

**Alone** includes optimized highlighting for:

- JavaScript / TypeScript / JSX / TSX
- Python (incl. Pylance semantic tokens: `self`/`cls`, magic methods, builtins)
- Rust (incl. rust-analyzer: lifetimes, attributes, derives, macros)
- Go
- HTML / CSS / SCSS
- JSON / YAML / TOML
- Markdown
- Shell / Bash
- SQL
- Diffs and log files
- And more via semantic highlighting

See the `samples/` directory for demo files showcasing syntax highlighting.

---

## Accessibility

### Contrast (WCAG and APCA)

Key contrast values against the editor background (`#0C0A09`), WCAG 2.x ratio and [APCA](https://github.com/Myndex/SAPC-APCA) (0.0.98G-4) Lc side by side:

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

APCA Lc ≥ 60 is the body-text target, ≥ 45 large text, ≥ 30 the floor for non-essential text; comments intentionally sit lower to de-emphasise them. All primary code elements meet WCAG AA for normal text; five of eight clear AAA. The verifier enforces per-role APCA floors (identifiers ≥ 60, syntax ≥ 40, Special/Strings ≥ 37, punctuation ≥ 28, comments ≥ 22; Alone Soft has its own lower floors) as hard failures, and this table is rendered by `node scripts/verify-palette.mjs --write-readme`.

### Colour-vision deficiency

A warm-only palette lives mostly on the red-green axis, which is exactly what protanopes and deuteranopes lose. So the verifier simulates protan and deutan vision for every variant and requires that ten role pairs that carry meaning (types vs functions, functions vs strings, keywords vs types, numbers vs keywords, strings vs special, errors vs functions/special, escapes vs variables, `defaultLibrary` vs types, variables vs parameters) stay at least ΔE2000 5 apart after simulation — or differ in font style. Alone Roman has no italic cue, so it passes on colour alone (that is why two of its hexes differ from Standard). ANSI slots must stay ≥ ΔE2000 10 apart pairwise. All four variants pass; the exact numbers are in the verifier's sections 4 and 5.

### Astigmatism

- Body text at L\* 75 rather than white, and nothing brighter than L\* 81 in the syntax ladder — halation scales with text luminance
- No blue, so no blue defocus / chromatic fringing on dark backgrounds
- Body weight 450 via `editor.fontWeight` + `editor.fontVariations` (see settings); bold stays a plain 700
- Cursor uses mid-tier gold (`#D4A048`) rather than the brightest palette hex — a small bright point on near-black is a halation hotspot, so we keep it dimmer
- **Alone Roman** removes the italic channel; **Alone Soft** lowers contrast further

### Italics

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

Two real reasons and one that used to be claimed. Real: blue text on a dark background defocuses relative to the rest of the line (chromatic aberration) and blooms for astigmatic eyes, and short-wavelength light drives melanopsin harder per unit brightness. Claimed: "blue bleaches rhodopsin and destroys dark adaptation" — true of the light, but reading is cone vision on a screen that already resets dark adaptation; see [What it does not do](#what-it-does-not-do).

### Does it protect my night vision?

No. It stimulates rods less than a white-on-black theme at the same brightness (the golds about half as much, the neutrals about 85 % as much), and it is dimmer overall, but that is a comfort gain, not preserved dark adaptation. Red-only variants for that use case are on the roadmap.

### Why italic for strings and comments?

Font style provides differentiation without requiring additional colours. Italics signal "different voice" — comments are authorial notes, strings are literal data. This lets us maintain distinguishability within a constrained warm palette. If italics don't work for you, use Alone Roman.

### Why bold for keywords?

Keywords are control flow — the skeletal structure of your program. Bold weight provides immediate visual anchoring without requiring a brighter or more saturated colour.

### Is this good for astigmatism?

Usually. Low text luminance and no blue are the two things that matter most for halation and fringing; the Roman variant removes italics as well. If you still see fringing, try Alone Soft, and drop the display brightness before pushing the theme brighter.

### Can I use this in a lit room?

**Alone** is tuned for dark environments. In a bright room you may want higher contrast; the Standard variant is usually still comfortable in low ambient light.

### Is it colour-blind safe?

Every meaning-carrying colour pair is checked under simulated protanopia and deuteranopia in all four variants (ΔE2000 ≥ 5 or a font-style difference), and the terminal's sixteen ANSI slots stay ≥ ΔE2000 10 apart. Tritanopia is not a concern for a palette with no blue axis.

---

## Contributing

The shipped `themes/*.json` files are **generated** from `themes/_src/`; don't edit them directly. Build, verify, test and variant-authoring instructions are in [CONTRIBUTING.md](CONTRIBUTING.md). Every numeric table in this README that sits between `<!-- verify:…:start/end -->` markers is rendered by the verifier — change the palette, run `node scripts/verify-palette.mjs --write-readme`, and commit the result.

---

## Issues

Found a bug or have feedback? Open an issue at [github.com/crypticpy/alone/issues](https://github.com/crypticpy/alone/issues)

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

- CIE 1951 scotopic luminosity function and the CIE S 026 melanopic action spectrum
- APCA (Myndex) for the lightness-contrast model; Viénot, Brettel & Mollon (1999) for the CVD simulation matrices
- The late-night coding community who inspired this work

---

_Code alone. Code in peace. Your eyes will thank you._
