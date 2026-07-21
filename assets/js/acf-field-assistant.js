/**
 * ACF Field Assistant - JavaScript Controller
 *
 * Implements a lightweight, high-performance vanilla JS engine that automatically
 * generates and displays dynamic placeholder suggestions in the ACF Field Group editor.
 *
 * Designed to work seamlessly with:
 * - ACF Free and ACF Pro
 * - Repeaters, Flexible Content, and Nested Sub-fields
 * - Dynamically added fields via AJAX
 */

(function() {
	'use strict';

	/**
	 * Main Controller Instance
	 */
	const ACFFieldAssistant = {

		/**
		 * Initialize the field assistant.
		 */
		init: function() {
			// Scan and initialize all existing placeholder inputs
			this.scanAndInit();

			// Setup event delegation on document.body for high performance
			this.setupEventDelegation();

			// Setup MutationObserver to watch for AJAX-rendered fields
			this.setupMutationObserver();

			// Integrate with ACF JS API if available for double-insurance
			this.setupACFHooks();
		},

		/**
		 * Scans the DOM for any placeholder inputs and injects suggestions.
		 */
		scanAndInit: function() {
			const placeholderInputs = document.querySelectorAll(
				'.acf-field[data-name="placeholder"] input[type="text"], ' +
				'.acf-field-setting-placeholder input[type="text"], ' +
				'input[name*="[placeholder]"]'
			);

			placeholderInputs.forEach(input => {
				// Only initialize inputs that are text-based and inside a field settings block
				if (input.closest('.acf-field-object')) {
					this.injectSuggestions(input);
				}
			});
		},

		/**
		 * Setup dynamic event delegation.
		 * Listens to typing (input) and selection (change) events globally, filtering for ACF elements.
		 */
		setupEventDelegation: function() {
			// Listen to typing in Label or Name inputs for live updates
			document.body.addEventListener('input', (e) => {
				const target = e.target;
				if (!target || target.tagName !== 'INPUT') return;

				const isLabel = target.name.includes('[label]') || target.closest('.acf-field[data-name="label"]');
				const isName = target.name.includes('[name]') || target.closest('.acf-field[data-name="name"]');

				if (isLabel || isName) {
					const fieldObject = target.closest('.acf-field-object');
					if (fieldObject) {
						const placeholderInput = this.findFieldSettingInput(fieldObject, 'placeholder');
						if (placeholderInput) {
							this.injectSuggestions(placeholderInput);
						}
					}
				}
			});

			// Listen to changes in Field Type selects
			document.body.addEventListener('change', (e) => {
				const target = e.target;
				if (!target || target.tagName !== 'SELECT') return;

				const isType = target.name.includes('[type]') || target.closest('.acf-field[data-name="type"]');

				if (isType) {
					const fieldObject = target.closest('.acf-field-object');
					if (fieldObject) {
						// Wait a tiny bit to let ACF update setting DOM fields, then regenerate
						setTimeout(() => {
							const placeholderInput = this.findFieldSettingInput(fieldObject, 'placeholder');
							if (placeholderInput) {
								this.injectSuggestions(placeholderInput);
							}
						}, 100);
					}
				}
			});
		},

		/**
		 * Setup MutationObserver to detect dynamically added fields (AJAX, Repeaters, Flexible Content, etc.)
		 */
		setupMutationObserver: function() {
			const observer = new MutationObserver((mutations) => {
				let shouldScan = false;

				for (const mutation of mutations) {
					if (mutation.addedNodes.length > 0) {
						for (const node of mutation.addedNodes) {
							if (node.nodeType === Node.ELEMENT_NODE) {
								// Check if the added element is or contains an ACF field editor object
								if (
									node.classList.contains('acf-field-object') ||
									node.querySelector('.acf-field-object') ||
									node.querySelector('input[name*="[placeholder]"]') ||
									node.querySelector('.acf-field[data-name="placeholder"]')
								) {
									shouldScan = true;
									break;
								}
							}
						}
					}
					if (shouldScan) break;
				}

				if (shouldScan) {
					this.scanAndInit();
				}
			});

			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
		},

		/**
		 * Enlist ACF Native JS Hooks to capture ACF custom lifecycle events.
		 */
		setupACFHooks: function() {
			if (window.acf) {
				// Re-initialize when ACF finishes rendering or appends new DOM sections
				window.acf.addAction('ready', () => this.scanAndInit());
				window.acf.addAction('append', () => this.scanAndInit());
			}
		},

		/**
		 * Helper to find a setting input inside a specific field object, scoping to prevent finding nested sub-fields.
		 *
		 * @param {HTMLElement} fieldObject - The .acf-field-object container.
		 * @param {string} settingName - The setting target (label, name, type, placeholder).
		 * @returns {HTMLInputElement|HTMLSelectElement|null} The matched input element.
		 */
		findFieldSettingInput: function(fieldObject, settingName) {
			// 1. Selector strategy using wrappers
			const rows = fieldObject.querySelectorAll(
				`.acf-field[data-name="${settingName}"], ` +
				`.acf-field-setting-${settingName}, ` +
				`[class*="acf-field-setting-${settingName}"]`
			);

			for (const row of rows) {
				// Scopes to this field object strictly, preventing grabbing a nested repeater's setting
				if (row.closest('.acf-field-object') === fieldObject) {
					const input = row.querySelector('input, textarea, select');
					if (input) return input;
				}
			}

			// 2. Name attribute matching strategy
			const inputsByName = fieldObject.querySelectorAll(
				`input[name*="[${settingName}]"], ` +
				`select[name*="[${settingName}]"], ` +
				`textarea[name*="[${settingName}]"]`
			);

			for (const input of inputsByName) {
				if (input.closest('.acf-field-object') === fieldObject) {
					return input;
				}
			}

			return null;
		},

		/**
		 * Generates smart, contextual suggestions list.
		 *
		 * @param {string} label - The raw field label.
		 * @param {string} name - The raw field database name.
		 * @param {string} type - The active field type.
		 * @returns {Array} List of string suggestions.
		 */
		generateSuggestions: function(label, name, type) {
			const suggestions = [];
			const cleanLabel = (label || '').trim();
			const cleanName = (name || '').trim();
			const cleanType = (type || 'text').trim().toLowerCase();

			const lowerLabel = cleanLabel.toLowerCase();
			const lowerName = cleanName.toLowerCase();

			// Helper to check if a keyword is present in label or name
			const hasKeyword = (keyword) => {
				return lowerLabel.includes(keyword) || lowerName.includes(keyword);
			};

			// Rule 1: Priority Smart Keywords Detection
			if (hasKeyword('title')) {
				suggestions.push('Enter your title', 'Add a title', 'Write your title', 'Type your title');
			} else if (hasKeyword('description') || hasKeyword('desc') || hasKeyword('details') || hasKeyword('message')) {
				suggestions.push('Enter your description', 'Write description', 'Add details', 'Enter details');
			} else if (hasKeyword('email') || hasKeyword('mail')) {
				suggestions.push('Enter your email address', 'example@email.com', 'Enter email');
			} else if (hasKeyword('phone') || hasKeyword('tel') || hasKeyword('mobile') || hasKeyword('contact')) {
				suggestions.push('Enter phone number', '+1 234 567 890', 'Enter mobile number');
			} else if (hasKeyword('name') || hasKeyword('fullname') || hasKeyword('username')) {
				suggestions.push('Enter your name', 'Full name', 'Enter full name', 'Write name');
			} else if (hasKeyword('button') || hasKeyword('btn') || hasKeyword('link')) {
				suggestions.push('Learn More', 'Get Started', 'Contact Us', 'Click here');
			} else if (hasKeyword('search') || hasKeyword('query')) {
				suggestions.push('Search...', 'Type to search', 'Enter search query');
			} else if (hasKeyword('price') || hasKeyword('amount') || hasKeyword('cost')) {
				suggestions.push('0.00', 'Enter price', 'Enter amount');
			} else if (hasKeyword('company') || hasKeyword('organization') || hasKeyword('org')) {
				suggestions.push('Enter company name', 'Company Name');
			} else if (hasKeyword('address') || hasKeyword('location') || hasKeyword('city')) {
				suggestions.push('Enter your address', 'City, State, Zip', 'Enter location');
			} else if (hasKeyword('date') || hasKeyword('time')) {
				suggestions.push('YYYY-MM-DD', 'Select date', 'Enter time');
			} else if (hasKeyword('url') || hasKeyword('website') || hasKeyword('web')) {
				suggestions.push('https://example.com', 'Enter website URL');
			}

			// Rule 2: Dynamic Label-based custom suggestions (adds tremendous premium feel!)
			if (cleanLabel.length > 0) {
				const lowerLabelText = cleanLabel.toLowerCase();

				// Filter out boilerplate endings to keep suggestions clean
				const dynamicSugs = [
					`Enter your ${lowerLabelText}`,
					`Write your ${lowerLabelText}`,
					`Add a ${lowerLabelText}`,
					`Type your ${lowerLabelText}`
				];

				dynamicSugs.forEach(sug => {
					// Avoid duplicates
					if (!suggestions.map(s => s.toLowerCase()).includes(sug.toLowerCase())) {
						suggestions.push(sug);
					}
				});
			}

			// Rule 3: Field Type Aware fallbacks
			const typeSuggestions = {
				'text': ['Enter your text', 'Type here', 'Add text'],
				'email': ['Enter your email address', 'example@email.com'],
				'url': ['https://example.com', 'Enter website URL'],
				'number': ['Enter a number', '0'],
				'textarea': ['Write your description', 'Add details', 'Type your message'],
				'password': ['Enter your password']
			};

			if (typeSuggestions[cleanType]) {
				typeSuggestions[cleanType].forEach(sug => {
					if (!suggestions.map(s => s.toLowerCase()).includes(sug.toLowerCase())) {
						suggestions.push(sug);
					}
				});
			}

			// Ultimate fallback
			if (suggestions.length === 0) {
				suggestions.push('Enter value', 'Type here');
			}

			// Clean, deduplicate and restrict suggestions count (max 4)
			const finalSuggestions = [];
			const seen = new Set();

			for (const sug of suggestions) {
				const norm = sug.trim();
				if (norm && !seen.has(norm.toLowerCase())) {
					seen.add(norm.toLowerCase());
					finalSuggestions.push(norm);
				}
			}

			return finalSuggestions.slice(0, 4);
		},

		/**
		 * Injects suggestion pills under a specific placeholder input.
		 *
		 * @param {HTMLInputElement} placeholderInput - The target placeholder input element.
		 */
		injectSuggestions: function(placeholderInput) {
			// Find or create suggestions wrapper
			let wrapper = placeholderInput.parentNode.querySelector('.acf-fa-suggestions-wrapper');
			if (!wrapper) {
				wrapper = document.createElement('div');
				wrapper.className = 'acf-fa-suggestions-wrapper';
				// Append directly after the input field
				placeholderInput.parentNode.appendChild(wrapper);
			}

			// Find associated fields in the closest .acf-field-object
			const fieldObject = placeholderInput.closest('.acf-field-object');
			if (!fieldObject) return;

			const labelInput = this.findFieldSettingInput(fieldObject, 'label');
			const nameInput = this.findFieldSettingInput(fieldObject, 'name');
			const typeSelect = this.findFieldSettingInput(fieldObject, 'type');

			const label = labelInput ? labelInput.value : '';
			const name = nameInput ? nameInput.value : '';
			const type = typeSelect ? typeSelect.value : 'text';

			// Generate suggestions list
			const suggestionsList = this.generateSuggestions(label, name, type);

			// Render
			wrapper.innerHTML = '';

			if (suggestionsList.length > 0) {
				const labelSpan = document.createElement('span');
				labelSpan.className = 'acf-fa-suggestions-label';
				labelSpan.textContent = 'Suggestions:';
				wrapper.appendChild(labelSpan);

				suggestionsList.forEach(sugText => {
					const pill = document.createElement('button');
					pill.type = 'button';
					pill.className = 'acf-fa-suggestion-pill';
					pill.textContent = sugText;

					// Highlight pill if it currently matches the placeholder value
					if (placeholderInput.value === sugText) {
						pill.style.borderColor = '#2271b1';
						pill.style.color = '#2271b1';
						pill.style.backgroundColor = '#f0f6fc';
					}

					pill.addEventListener('click', (e) => {
						e.preventDefault();
						e.stopPropagation();

						// Insert text into Placeholder input
						placeholderInput.value = sugText;

						// Dispatch both 'input' and 'change' events so ACF notices the change
						placeholderInput.dispatchEvent(new Event('input', { bubbles: true }));
						placeholderInput.dispatchEvent(new Event('change', { bubbles: true }));

						// Trigger a re-render to update highlit states of pills
						this.injectSuggestions(placeholderInput);
					});

					wrapper.appendChild(pill);
				});
			}
		}
	};

	// Initialize when the DOM is fully ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => ACFFieldAssistant.init());
	} else {
		ACFFieldAssistant.init();
	}

})();
