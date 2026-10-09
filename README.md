# ACF Field Assistant

**Version 1.3.0** · Chrome Manifest V3 · MIT License

Smart suggestions and keyboard-powered workflows for the [Advanced Custom Fields](https://www.advancedcustomfields.com/) field group editor.

Install the extension once in Chrome. It works on every WordPress admin you open — no ACF plugin install on each client site.

**Repository:** [github.com/sumanengbd/acf-field-assistant](https://github.com/sumanengbd/acf-field-assistant)

---

## Why this exists

Building ACF field groups means repeating the same labels, names, placeholders, and instructions hundreds of times. ACF Field Assistant sits inside the field editor and offers one-click suggestions, recommended setups, and type-cycle shortcuts so you stay in flow.

---

## Features

### Suggestions

| Area | What you get |
|------|----------------|
| **Field Label** | Curated pills by field type (Text, Link, Repeater, Gravity Forms, Icon Picker, and 40+ types) |
| **Placeholder** | Label-aware text with tone options: `Enter your…`, ellipsis, or short |
| **Instructions** | Helper copy for supported types (e.g. Image size tips) |

- Defaults stay first; smart / recent pills appear at the end
- Nested fields inside repeaters and groups get context labels (Team → Name, Role, Photo…)
- Accordion inside a repeater or group suggests the **singular** parent label (Team Members → Team Member)
- Clicking a label pill also updates the field name and accordion header when applicable
- Suggestions run on **Edit Field Group** only (not Options pages)

### One-click setup

- **Apply Recommended Setup** fills label, name, placeholder, and instructions for common types
- **Undo** restores the previous values for a short window after apply

### Recently used

- Last picks are stored **per website** in `chrome.storage.local`
- Shown at the end of the suggestion list so defaults stay primary

### Type Cycle shortcuts

After you click **Add Field**, cycle through field types by letter:

1. Open a field (or add one)
2. Press your modifier + letter (e.g. `Alt+T` for types starting with T)
3. Repeat to move through the cycle for that letter

| Letter examples | Types (defaults) |
|-----------------|------------------|
| **G** | gallery, google_map, gravity_forms_field, group |
| **P** | page_link, password, post_object, post_type_field |
| **M** | nav_menu |
| **I** | icon_picker_advanced, image |

Open the settings panel with **`Alt+Shift+A`** to:

- Choose modifier: **Alt + Letter**, **Shift + Letter**, or **Ctrl + Shift + Letter**
- Edit which type slugs each letter cycles
- Reset to defaults

Chrome blocks some keys (e.g. `Ctrl+T`, `Ctrl+R`) for the browser itself — those cannot be used for cycling. Shortcuts are ignored while typing in inputs.

### Focus shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Shift+L` | Focus label suggestions |
| `Alt+Shift+P` | Focus placeholder suggestions |
| `Alt+Shift+I` | Focus instructions suggestions |
| `Alt+Shift+A` | Open type-cycle shortcut settings |

### Extension popup

- Toggle each feature on or off
- Set **Max pills** count
- **Clear saved data** — reset settings and clear recent suggestions
- Tabs for Shortcuts, Highlights, and Changelog

---

## Requirements

- Google Chrome (or Chromium) with Manifest V3 support
- WordPress admin with ACF (free or PRO)
- Field group editor screen (`post.php` / ACF field group UI)

---

## Install (unpacked)

1. Clone or download this repository
2. Open Chrome → `chrome://extensions/`
3. Turn on **Developer mode**
4. Click **Load unpacked**
5. Select the project folder (`acf-field-assistant`)
6. Pin the toolbar icon if you want quick access to settings

After pulling updates, click **Reload** on the extension card so content scripts refresh.

---

## Quick start

1. In wp-admin, go to **ACF → Field Groups** and edit a group
2. Expand a field — suggestion pills appear under Label / Placeholder / Instructions
3. Click a pill to fill the value (native events fire so ACF saves correctly)
4. Use **Apply Setup** when you want a full recommended configuration
5. Add a field, then use `Alt` + letter (or your chosen modifier) to cycle types
6. Press `Alt+Shift+A` anytime to tune type-cycle letters

---

## Project structure

```text
acf-field-assistant/
├── assets/
│   ├── css/
│   │   ├── content.css       # Pills, cycle panel, toasts
│   │   └── popup.css         # Popup UI
│   ├── js/
│   │   ├── background.js     # Command router (service worker)
│   │   ├── content.js        # Suggestions + shortcuts (isolated world)
│   │   ├── page-bridge.js    # ACF / jQuery bridge (MAIN world)
│   │   └── popup.js          # Popup settings + changelog
│   ├── icons/                # 16 / 48 / 128 / 512
│   └── popup.html
├── CHANGELOG.md
├── manifest.json
└── README.md
```

The content script cannot call ACF’s JS API directly. `page-bridge.js` runs in the page world, listens for type changes, and messages the content script so suggestion pills stay in sync.

---

## Settings & data

| Storage | Key | Purpose |
|---------|-----|---------|
| `chrome.storage.sync` | `acfFaSettings` | Feature toggles, max pills, type cycles, modifier |
| `chrome.storage.local` | `acfFaRecentSuggestions` | Per-site recent suggestion lists |

No cookies. Clear everything from the popup with **Clear saved data**.

Permissions used: `storage`, `tabs` (focus shortcuts / messaging).

---

## Privacy

The extension only injects scripts into pages you browse so it can detect the ACF field group editor. Suggestion data stays in your browser storage. Nothing is sent to an external server by this project.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history (also available inside the popup **Changelog** tab).

---

## Development notes

- Primary product is the **Chrome extension** (`manifest.json` + `assets/`)
- Prefer small, focused changes in `content.js` for suggestion logic and `page-bridge.js` for ACF DOM/API access
- After editing content scripts, reload the extension and hard-refresh the wp-admin tab

---

## Author

**Suman Ali**  
GitHub: [sumanengbd](https://github.com/sumanengbd/) · Project: [acf-field-assistant](https://github.com/sumanengbd/acf-field-assistant/)

---

## License

[MIT](https://opensource.org/licenses/MIT) — free to use, modify, and distribute.
