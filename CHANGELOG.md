# Changelog

All notable changes to the **Alone** theme will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Implemented L* (lightness) spacing for OLED/miniLED distinguishability
- Near-black background (#0C0A09) for halation reduction
- Font style differentiation (bold/italic) to extend palette without color proliferation

---

## Future Plans

- [ ] Additional language-specific refinements
- [ ] Companion themes for JetBrains IDEs
- [ ] VS Code settings sync profile
- [ ] Integration with system dark mode detection

---

*Code alone. Code in peace.*
