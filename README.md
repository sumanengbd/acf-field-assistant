# ACF Field Assistant (Google Chrome Extension)

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://chrome.google.com/webstore)
[![ACF Addon](https://img.shields.io/badge/ACF-Addon-green.svg)](https://www.advancedcustomfields.com/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**ACF Field Assistant** is a premium, lightweight Google Chrome Extension designed for WordPress developers using [Advanced Custom Fields (ACF)](https://www.advancedcustomfields.com/). 

By installing this extension once in your browser, it automatically improves the field creation experience across **all WordPress development sites** you build, without needing to install an additional WordPress plugin on every single client website!

---

## ✨ Key Features

*   **Smart Suggestions Engine**: Generates highly relevant, contextual placeholder suggestions under the **Placeholder Text** field in the ACF field group editor.
*   **Live Typing Sync**: Monitors your **Field Label** and updates suggestions in real-time as you type (e.g. typing *"Contact Phone"* instantly suggests `[ Enter contact phone ]`, `[ Write contact phone ]`).
*   **Field Type Awareness**: Automatically provides custom placeholders matching the active field type (Text, Email, URL, Number, Textarea, Password).
*   **Curated Keyword Matching**: Detects essential keywords in your labels/names to provide custom-tailored placeholder patterns:
    *   *Description* -> `Enter your description`, `Write description`, `Add details`
    *   *Email* -> `Enter your email address`, `example@email.com`
    *   *Button* -> `Learn More`, `Get Started`, `Contact Us`
*   **Deep Repeater & AJAX Support**: Uses precise DOM traversal scoped within individual field blocks (`.acf-field-object`). This guarantees nested Repeaters, Flexible Content blocks, and AJAX-added fields function flawlessly without settings leaking.
*   **Zero Performance Footprint**: Employs dynamic event delegation and a `MutationObserver` on the body, running silently and consuming **zero CPU/memory** on non-ACF pages.
*   **Premium Glassmorphic Dashboard**: Features a gorgeous extension popup dashboard withOutfit typography, active connection indicator lights, and links.
*   **Vanilla JS (Zero Dependencies)**: Written entirely in lightweight, isolated Manifest V3 vanilla JS, maintaining peak browser performance.

---

## 📁 Extension File Map

All extension assets are placed in organized directories under `assets/` in the `acf-field-assistant` folder:

```text
acf-field-assistant/
├── assets/
│   ├── css/
│   │   ├── content.css      # Injected suggestions stylesheet + layout fixes
│   │   └── popup.css        # Extension dashboard popup styling
│   ├── js/
│   │   ├── content.js       # Injected suggestions engine (vanilla JS)
│   │   └── popup.js         # Safe tab redirection controller
│   ├── icons/
│   │   ├── icon-16.png      # 16x16 crisp 3D extension icon
│   │   ├── icon-48.png      # 48x48 crisp 3D settings page icon
│   │   ├── icon-128.png     # 128x128 crisp 3D Web Store icon
│   │   └── icon-512.png     # 512x512 original 3D high-fidelity logo
│   └── popup.html           # Glassmorphic dashboard popup UI
├── manifest.json            # Manifest V3 extension configuration
└── README.md                # Extension documentation (this file)
```

---

## 🚀 How to Install in Google Chrome

Because this is a developer extension, you can load it directly into your Chrome browser as an "Unpacked Extension":

1. Open **Google Chrome** and navigate to: `chrome://extensions/`
2. Turn on the **Developer mode** toggle in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the **`acf-field-assistant`** folder inside your local directory (`D:\chrome-extensions\acf-field-assistant`).
5. The extension is now active! You will see the **⚡ ACF Field Assistant** icon in your Chrome toolbar.

---

## 📖 How to Use

1. Log in to the admin panel of **any WordPress site** that has ACF installed.
2. Go to **ACF** -> **Field Groups** and create or edit a field group.
3. Add a text-based field (e.g. Text, Textarea, Email, Number, URL) and expand its settings.
4. Under the **Placeholder Text** setting, you will see the dynamically generated suggestion pill badges.
5. Edit the **Field Label** and watch the suggestions update live as you type!
6. Click any suggestion badge to automatically populate the field. It dispatches native input events so that ACF saves it perfectly.

---

## 👤 Author

*   **Author**: [Suman Ali](https://github.com/sumanengbd/)
*   **Extension Home**: [https://github.com/sumanengbd/acf-field-assistant/](https://github.com/sumanengbd/acf-field-assistant/)
*   **Author URI**: [https://github.com/sumanengbd/](https://github.com/sumanengbd/)

---

## 📄 License

This project is licensed under the MIT License.
