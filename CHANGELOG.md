# Changelog

All notable changes to **ACF Field Assistant** are documented in this file.

## [1.1.0] - 2026-07-21

### Added
- **Instructions suggestions** — Contextual helper text pills by field type (e.g. Image → `Image Size: 737px by 480px`)
- **One-click Apply Recommended Setup** — Sets label, field name, placeholder, and instructions together for common field types
- **Popup settings page** — Toggle each feature on/off, configure max suggestion count, and browse release notes
- **Recently used suggestions** — Last 5 clicked suggestions per category shown first (label, placeholder, instructions)
- **Keyboard shortcuts**
  - `Alt+Shift+L` — Focus label suggestions
  - `Alt+Shift+P` — Focus placeholder suggestions
  - `Alt+Shift+I` — Focus instructions suggestions
- **Expanded field label library** — 40+ ACF field types including Gravity Forms, Icon Picker, Table, Repeater, and more
- **Label-first placeholder sync** — Placeholder suggestions update live when the field label changes

### Changed
- Content script now scoped to `wp-admin` only for better performance
- Popup redesigned with tabbed settings, shortcuts, highlights, and **Changelog** panel
- Popup switched to a **light mode** theme (WordPress-style clean UI)
- Default max label/instruction pills reduced to **4** (configurable in settings)
- **Apply Setup** action button styled as an inline pill (dashed blue border, distinct from suggestions)
- Version bumped to 1.1.0

### Fixed
- Placeholder suggestions not updating after field label changes
- Label detection failing when input `name` attribute was missing

---

## [1.0.0] - Initial Release

### Added
- Smart placeholder suggestion engine
- Live typing sync from field label
- Field type aware fallbacks
- Keyword matching (email, phone, button, etc.)
- Repeater, Flexible Content, and AJAX field support
- Glassmorphic extension popup dashboard
