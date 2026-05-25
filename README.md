# ACF Field Assistant

[![WordPress Plugin](https://img.shields.io/badge/WordPress-Plugin-blue.svg)](https://wordpress.org/)
[![ACF Addon](https://img.shields.io/badge/ACF-Addon-green.svg)](https://www.advancedcustomfields.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**ACF Field Assistant** is a lightweight, zero-dependency WordPress addon plugin for [Advanced Custom Fields (ACF)](https://www.advancedcustomfields.com/) that elevates the field creation experience inside the WordPress admin panel. 

The plugin automatically generates smart, contextual placeholder suggestions directly below the **Placeholder Text** setting in the field group editor. Clicking any suggestion immediately populates the field and updates ACF's save models.

---

## ✨ Key Features

*   **Smart Placeholder Suggestions**: Automatically generates clean, engaging, and professional placeholder options based on your field's parameters.
*   **Field Label Live Parsing**: Watches your **Field Label** and updates suggestions in real-time as you type (e.g., typing *"Contact Phone"* instantly suggests `[ Enter contact phone ]`, `[ Write contact phone ]`).
*   **Field Type Awareness**: Customizes default suggestions based on the chosen ACF Field Type (Text, Email, URL, Number, Textarea, Password).
*   **Curated Keyword Rules**: Detects key terms in your labels or names (such as `title`, `description`, `email`, `phone`, `name`, `button`, `price`, `search`, etc.) to provide highly curated recommendations:
    *   *Description* -> `Enter your description`, `Write description`, `Add details`
    *   *Email* -> `Enter your email address`, `example@email.com`
    *   *Button* -> `Learn More`, `Get Started`, `Contact Us`
*   **Deep Repeater & Nested Support**: Employs rigorous sibling DOM traversal scoped strictly within individual field wrappers (`.acf-field-object`). This guarantees that settings inside Repeaters, Flexible Content blocks, or deeply nested sub-fields never leak or interfere with each other.
*   **Dynamic & AJAX-Ready**: Leverages a highly performant parent-level **event delegation system** combined with a **MutationObserver** to capture newly added fields or AJAX settings reloads instantly, with zero page reloads.
*   **Premium WordPress-Native UI**: Styled to blend perfectly with the WordPress dashboard. Features modern rounded pill badges, subtle fade-in entry transitions, and satisfying micro-scale transformations on click.
*   **Lightweight & Performant**: Written in 100% pure vanilla JavaScript with **no jQuery dependency** or external libraries, keeping your WordPress admin swift and responsive.

---

## 🛠️ Folder Structure

```text
acf-field-assistant/
├── assets/
│   ├── css/
│   │   └── acf-field-assistant.css  # Premium WordPress-native styling
│   └── js/
│       └── acf-field-assistant.js   # Main JS logic and suggestions engine
├── acf-field-assistant.php          # Main plugin loader & ACF enqueuer
└── README.md                        # Project documentation (this file)
```

---

## 🚀 Installation

1. Download or clone the plugin directory `acf-field-assistant`.
2. Upload the `acf-field-assistant` folder to your WordPress site's `/wp-content/plugins/` directory.
3. Navigate to **Plugins** in the WordPress admin panel.
4. Click **Activate** under **ACF Field Assistant**.

---

## 📖 How to Use

1. Go to **ACF** -> **Field Groups** (or **Custom Fields**) in your admin dashboard.
2. Edit an existing field group or create a new one.
3. Add or expand any text-based field (e.g. Text, Textarea, Email, Number, Password, URL) and check its settings (often under the **Presentation** tab in ACF 6).
4. You will see a list of curated badge suggestions directly below the **Placeholder Text** input.
5. Watch them update live as you type a new **Field Label**!
6. Click any pill to automatically populate the input. The plugin dispatches native input events so that ACF recognizes the change and saves it correctly when you update the Field Group.

---

## 🔒 Requirements

*   **WordPress**: 5.8 or higher
*   **PHP**: 7.4 or higher
*   **ACF**: Advanced Custom Fields (Free or Pro) v5.x / v6.x

---

## 👤 Author

*   **Author**: [Suman Ali](https://github.com/sumanengbd/)
*   **Plugin URI**: [https://github.com/sumanengbd/acf-field-assistant/](https://github.com/sumanengbd/acf-field-assistant/)
*   **Author URI**: [https://github.com/sumanengbd/](https://github.com/sumanengbd/)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
