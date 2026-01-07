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

| Wavelength | Color | Rod Impact | Our Usage |
|------------|-------|------------|-----------|
| 450-490nm | Blue | **Maximum** | ❌ Eliminated |
| 490-520nm | Cyan | **Severe** | ❌ Eliminated |
| 520-560nm | Green | Moderate | ⚠️ Avoided |
| 560-580nm | Yellow-Green | Low | ✅ Strings (olive) |
| 580-620nm | Amber/Orange | Minimal | ✅ Primary palette |
| 620-700nm | Red | Near-zero | ✅ Errors only |

### Halation Reduction

Pure black (#000000) backgrounds cause halation—a glowing halo effect around bright text, especially problematic for astigmatism. **Alone** uses #0C0A09, a near-black with warm undertones that reduces this effect while maintaining the dark aesthetic.

### Lightness Spacing (L*)

On calibrated OLED and miniLED displays, subtle color differences disappear. **Alone** ensures each syntax element has distinct L* (perceptual lightness) values:

```
L* 82  ████████████████████████████  Operators
L* 78  █████████████████████████     Keywords (bold)
L* 75  ████████████████████████      Variables
L* 72  ███████████████████████       Numbers
L* 65  ████████████████████          Types
L* 64  ███████████████████           Functions
L* 58  █████████████████             Strings (italic)
L* 55  ████████████████              Special
L* 50  ██████████████                Punctuation
L* 38  ██████████                    Comments (italic)
```

Minimum 6 L* units between adjacent syntax roles ensures distinguishability.

---

## Color Palette

### Syntax Colors

| Element | Color | Hex | Style |
|---------|-------|-----|-------|
| Comments | ![#5C544A](https://via.placeholder.com/15/5C544A/5C544A) | `#5C544A` | *Italic* |
| Strings | ![#9A8B60](https://via.placeholder.com/15/9A8B60/9A8B60) | `#9A8B60` | *Italic* |
| Numbers | ![#E0A850](https://via.placeholder.com/15/E0A850/E0A850) | `#E0A850` | Normal |
| Keywords | ![#C8A040](https://via.placeholder.com/15/C8A040/C8A040) | `#C8A040` | **Bold** |
| Functions | ![#B07850](https://via.placeholder.com/15/B07850/B07850) | `#B07850` | Normal |
| Types | ![#9A8048](https://via.placeholder.com/15/9A8048/9A8048) | `#9A8048` | Normal |
| Variables | ![#C4B8A4](https://via.placeholder.com/15/C4B8A4/C4B8A4) | `#C4B8A4` | Normal |
| Operators | ![#D4C8B8](https://via.placeholder.com/15/D4C8B8/D4C8B8) | `#D4C8B8` | Normal |
| Errors | ![#D46A66](https://via.placeholder.com/15/D46A66/D46A66) | `#D46A66` | **Bold** |

### Bracket Pair Colors

Six warm variants for bracket colorization:

1. ![#D4A048](https://via.placeholder.com/15/D4A048/D4A048) Gold `#D4A048`
2. ![#C89068](https://via.placeholder.com/15/C89068/C89068) Burnt Sienna `#C89068`
3. ![#B8956E](https://via.placeholder.com/15/B8956E/B8956E) Tan `#B8956E`
4. ![#A89860](https://via.placeholder.com/15/A89860/A89860) Olive `#A89860`
5. ![#C4A078](https://via.placeholder.com/15/C4A078/C4A078) Wheat `#C4A078`
6. ![#D4B088](https://via.placeholder.com/15/D4B088/D4B088) Pale Amber `#D4B088`

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
5. Select **Preferences: Color Theme → Alone**

### From VSIX (Recommended for Manual Install)

1. Download the latest `.vsix` from [Releases](https://github.com/crypticpy/alone/releases) or the repo root
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

## Recommended Settings

For the full **Alone** experience, add these to your `settings.json`:

```json
{
  // Font: Choose one with good weight distribution
  "editor.fontFamily": "'JetBrains Mono', 'Fira Code', 'Hack Nerd Font', monospace",
  "editor.fontSize": 14,
  "editor.fontWeight": "400",
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

## Companion Terminal Theme

**Alone** pairs with the **Scotopic** terminal theme for Kitty, iTerm2, and other terminals. Available at:

- [Scotopic for Kitty](https://github.com/crypticpy/scotopic)

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

*Code alone. Code in peace. Your eyes will thank you.*
