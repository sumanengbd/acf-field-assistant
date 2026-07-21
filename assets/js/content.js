/**
 * ACF Field Assistant - Google Chrome Content Script
 *
 * Implements a lightweight, high-performance vanilla JS engine that automatically
 * generates and displays dynamic placeholder suggestions in the ACF Field Group editor.
 *
 * Scoped and designed to run seamlessly in the isolated DOM context of a browser extension.
 */

(function() {
	'use strict';

	/**
	 * Maps third-party or variant ACF field type slugs to canonical keys.
	 */
	const FIELD_TYPE_ALIASES = {
		'forms': 'gravity_forms',
		'gravity_form': 'gravity_forms',
		'gravityforms': 'gravity_forms',
		'acf_gravity_forms': 'gravity_forms',
		'post_types': 'post_type',
		'acfe_post_types': 'post_type',
		'icon_picker': 'custom_icon_picker',
		'acf_icon_picker': 'custom_icon_picker',
		'fonticonpicker': 'custom_icon_picker',
		'font_awesome': 'custom_icon_picker',
		'true/false': 'true_false',
		'true-false': 'true_false',
		'color': 'color_picker',
		'date': 'date_picker',
		'datetime': 'date_time_picker',
		'date_time': 'date_time_picker',
		'flexible': 'flexible_content'
	};

	/**
	 * Field label suggestions keyed by canonical ACF field type slug.
	 * Repeater and flexible_content lists are maintained in A–Z order.
	 */
	const FIELD_LABEL_SUGGESTIONS = {
		// Basic
		'text': ['Title', 'Sub Title', 'Name', 'Heading', 'Label', 'Caption'],
		'textarea': ['Description', 'Content', 'Bio', 'Summary', 'Notes', 'Details'],
		'number': ['Number', 'Amount', 'Quantity', 'Price', 'Count', 'Total'],
		'range': ['Range', 'Level', 'Rating', 'Score', 'Progress', 'Scale'],
		'email': ['Email', 'Email Address', 'Contact Email', 'Work Email', 'Support Email', 'Newsletter Email'],
		'url': ['Image', 'URL', 'Website', 'Site', 'Social URL', 'Social Media URL'],
		'password': ['Password', 'Passcode', 'PIN', 'Secret Key', 'Access Code', 'Credentials'],

		// Content
		'image': ['Image', 'Icon', 'Media', 'Photo', 'Banner', 'Logo'],
		'file': ['Video', 'File', 'Document', 'Attachment', 'Download', 'PDF', 'Resource'],
		'wysiwyg': ['Content', 'Text', 'Body', 'Article', 'Copy', 'Details'],
		'oembed': ['Video', 'Embed', 'Media', 'oEmbed', 'External Media', 'Stream'],
		'gallery': ['Gallery', 'Images', 'Photos', 'Slideshow', 'Media Gallery', 'Portfolio'],

		// Choice
		'select': ['Type', 'Category', 'Status', 'Option', 'Selection', 'Format'],
		'checkbox': ['Options', 'Features', 'Services', 'Interests', 'Tags', 'Items'],
		'radio': ['Type', 'Options', 'Choice', 'Selection', 'Variant', 'Plan'],
		'button_group': ['Type', 'Style', 'Layout', 'Variant', 'Alignment', 'Size'],
		'true_false': ['Enable', 'Disable', 'Active', 'Show', 'Hide', 'Toggle'],

		// Relational
		'link': ['Button', 'Link', 'URL', 'Call to Action', 'Read More', 'Learn More'],
		'post_object': ['Post', 'Article', 'Page', 'Item', 'Entry', 'Content'],
		'post_type': ['Post Type', 'Posts', 'Content Type', 'CPT', 'Entries', 'Items'],
		'page_link': ['Page', 'Page Link', 'Internal Link', 'Page URL', 'Target Page', 'Reference'],
		'relationship': ['Posts', 'Related Posts', 'Related Items', 'Connections', 'Linked Content', 'References'],
		'taxonomy': ['Category', 'Tag', 'Taxonomy', 'Term', 'Topic', 'Classification'],
		'user': ['Author', 'User', 'Member', 'Contributor', 'Editor', 'Account'],

		// Layout
		'group': ['Group', 'Section', 'Details', 'Info', 'Settings', 'Meta'],
		'repeater': ['Benefits', 'Boxes', 'Call Action', 'FAQs', 'Features', 'Gallery Items', 'Icon Boxes', 'Items', 'Menus', 'Services', 'Slides', 'Social Media', 'Steps', 'Team Members', 'Testimonials'],
		'flexible_content': ['Blocks', 'Components', 'Content Blocks', 'Layouts', 'Page Builder', 'Sections', 'Modules', 'Rows', 'Templates', 'Widgets'],
		'clone': ['Clone', 'Fields', 'Field Group', 'Shared Fields', 'Template', 'Preset'],
		'tab': ['Tab', 'Section', 'Settings', 'General', 'Advanced', 'Options'],
		'accordion': ['Accordion', 'Panel', 'Section', 'Collapsible', 'Group', 'Block'],
		'message': ['Message', 'Notice', 'Instructions', 'Help Text', 'Info', 'Description'],

		// jQuery / UI
		'google_map': ['Map', 'Location', 'Address', 'Coordinates', 'Place', 'Geo Location'],
		'date_picker': ['Date', 'Start Date', 'End Date', 'Published Date', 'Event Date', 'Due Date'],
		'date_time_picker': ['Date Time', 'Schedule', 'Event Date', 'Appointment', 'Timestamp', 'Date & Time'],
		'time_picker': ['Time', 'Start Time', 'End Time', 'Hours', 'Opening Time', 'Schedule'],
		'color_picker': ['Color', 'Background', 'Accent Color', 'Theme Color', 'Text Color', 'Border Color'],

		// Third-party / add-on field types
		'gravity_forms': ['Select Form', 'Form', 'Contact Form', 'Gravity Form', 'Submission Form', 'Signup Form'],
		'custom_icon_picker': ['Icon', 'Icon Picker', 'Symbol', 'Graphic', 'Font Icon', 'SVG Icon'],
		'table': ['Table', 'Data Table', 'Rows', 'Columns', 'Grid', 'Spreadsheet'],

		// Additional common add-on types
		'sidebar_selector': ['Sidebar', 'Widget Area', 'Sidebar Layout', 'Sidebars', 'Layout Sidebar', 'Content Sidebar'],
		'font-awesome': ['Icon', 'Font Icon', 'Icon Picker', 'Symbol', 'Graphic', 'Badge Icon'],
		'code': ['Code', 'Custom Code', 'CSS', 'JavaScript', 'HTML', 'Snippet'],
		'markdown': ['Markdown', 'Content', 'Notes', 'Documentation', 'Text', 'Write-up'],
		'smart_button': ['Button', 'Action', 'CTA', 'Link Button', 'Submit', 'Trigger'],
		'address': ['Address', 'Location', 'Street Address', 'Mailing Address', 'Full Address', 'Geo Address'],
		'phone': ['Phone', 'Phone Number', 'Mobile', 'Contact Number', 'Telephone', 'Call Number'],
		'countries': ['Country', 'Countries', 'Nation', 'Region', 'Location', 'Territory'],
		'states': ['State', 'Province', 'Region', 'Territory', 'County', 'Area'],
		'currencies': ['Currency', 'Price Currency', 'Money', 'Payment Currency', 'Unit', 'Denomination'],
		'star_rating': ['Rating', 'Stars', 'Review Score', 'Score', 'Review', 'Feedback'],
		'signature': ['Signature', 'Sign Here', 'Signed By', 'Approval', 'Sign Off', 'Consent'],
		'qrcode': ['QR Code', 'Barcode', 'Scan Code', 'Quick Link', 'Code', 'QR Link'],

		'_default': ['Title', 'Label', 'Name', 'Field', 'Value', 'Setting']
	};

	/**
	 * Field types that show Instructions suggestions.
	 * Add slugs here when enabling instructions for more types.
	 */
	const INSTRUCTIONS_ENABLED_TYPES = ['image'];

	/**
	 * Instructions text suggestions keyed by field type.
	 */
	const FIELD_INSTRUCTIONS_SUGGESTIONS = {
		'image': [
			'Image Size: 737px by 480px',
			'Image Size: 1920px by 1080px',
			'Image Size: 800px by 600px',
			'Recommended: JPG or WebP, max 500KB',
			'Use PNG for transparent backgrounds',
			'Upload a high-resolution image for retina displays'
		]
	};

	/**
	 * One-click recommended field setups by type.
	 */
	const RECOMMENDED_SETUPS = {
		'text': {
			label: 'Title',
			name: 'title',
			placeholder: 'Enter your title'
		},
		'textarea': {
			label: 'Description',
			name: 'description',
			placeholder: 'Write your description'
		},
		'email': {
			label: 'Email Address',
			name: 'email_address',
			placeholder: 'Enter your email address'
		},
		'url': {
			label: 'Website URL',
			name: 'website_url',
			placeholder: 'https://example.com'
		},
		'number': {
			label: 'Number',
			name: 'number',
			placeholder: '0'
		},
		'image': {
			label: 'Image',
			name: 'image',
			placeholder: '',
			instructions: 'Image Size: 737px by 480px'
		},
		'file': {
			label: 'File',
			name: 'file',
			placeholder: ''
		},
		'wysiwyg': {
			label: 'Content',
			name: 'content',
			placeholder: ''
		},
		'link': {
			label: 'Button',
			name: 'button',
			placeholder: ''
		},
		'true_false': {
			label: 'Enable',
			name: 'enable',
			placeholder: ''
		},
		'select': {
			label: 'Type',
			name: 'type',
			placeholder: ''
		},
		'radio': {
			label: 'Options',
			name: 'options',
			placeholder: ''
		},
		'color_picker': {
			label: 'Color',
			name: 'color',
			placeholder: ''
		},
		'date_picker': {
			label: 'Date',
			name: 'date',
			placeholder: ''
		},
		'repeater': {
			label: 'Items',
			name: 'items',
			placeholder: ''
		},
		'gallery': {
			label: 'Gallery',
			name: 'gallery',
			placeholder: ''
		},
		'google_map': {
			label: 'Location',
			name: 'location',
			placeholder: ''
		},
		'oembed': {
			label: 'Video',
			name: 'video',
			placeholder: ''
		},
		'gravity_forms': {
			label: 'Select Form',
			name: 'select_form',
			placeholder: ''
		},
		'custom_icon_picker': {
			label: 'Icon',
			name: 'icon',
			placeholder: ''
		},
		'table': {
			label: 'Table',
			name: 'table',
			placeholder: ''
		}
	};

	const DEFAULT_SETTINGS = {
		settingsVersion: 2,
		enableLabelSuggestions: true,
		enablePlaceholderSuggestions: true,
		enableInstructionsSuggestions: true,
		enableRecommendedSetup: true,
		enableRecentlyUsed: true,
		enableKeyboardShortcuts: true,
		maxSuggestions: 4
	};

	const SETTINGS_VERSION = DEFAULT_SETTINGS.settingsVersion;

	const RECENT_STORAGE_KEY = 'acfFaRecentSuggestions';
	const SETTINGS_STORAGE_KEY = 'acfFaSettings';

	/**
	 * Main Controller Instance
	 */
	const ACFFieldAssistant = {

		settings: Object.assign({}, DEFAULT_SETTINGS),
		_recentCache: { label: [], placeholder: [], instructions: [] },
		_initialized: false,
		_eventsBound: false,
		_acfBound: false,
		_scanTimer: null,

		init: function() {
			if (!window.location.href.includes('/wp-admin/')) {
				return;
			}

			if (this._initialized) {
				this.scanAndInit();
				return;
			}
			this._initialized = true;

			// Bind events immediately — do not wait for chrome.storage
			this.setupEventDelegation();
			this.setupMutationObserver();
			this.setupMessageListener();
			this.setupStorageListener();
			this.setupAcfIntegration();
			this.startAcfWatcher();

			// Scan immediately with defaults — do not wait for storage
			this.normalizeSettings();
			this.scanAndInit();

			this.loadSettings(() => {
				this.normalizeSettings();
				this.loadRecentSuggestions(() => {
					this.scanAndInit();
					[300, 800, 1500, 3000, 5000].forEach((delay) => {
						setTimeout(() => this.scanAndInit(), delay);
					});
				});
			});
		},

		normalizeSettings: function() {
			const s = this.settings;
			s.enableLabelSuggestions = s.enableLabelSuggestions !== false;
			s.enablePlaceholderSuggestions = s.enablePlaceholderSuggestions !== false;
			s.enableInstructionsSuggestions = s.enableInstructionsSuggestions !== false;
			s.enableRecommendedSetup = s.enableRecommendedSetup !== false;
			s.enableRecentlyUsed = s.enableRecentlyUsed !== false;
			s.enableKeyboardShortcuts = s.enableKeyboardShortcuts !== false;
			s.maxSuggestions = Math.max(1, parseInt(s.maxSuggestions, 10) || DEFAULT_SETTINGS.maxSuggestions);
			s.settingsVersion = SETTINGS_VERSION;
		},

		migrateStoredSettings: function(stored) {
			const settings = Object.assign({}, DEFAULT_SETTINGS, stored || {});
			let changed = false;
			const storedVersion = stored && stored.settingsVersion ? stored.settingsVersion : 1;

			if (storedVersion < SETTINGS_VERSION) {
				if (!stored || stored.maxSuggestions === undefined || stored.maxSuggestions === 6) {
					settings.maxSuggestions = DEFAULT_SETTINGS.maxSuggestions;
				}
				settings.settingsVersion = SETTINGS_VERSION;
				changed = true;
			}

			return { settings, changed };
		},

		queueScan: function(delay) {
			if (this._scanTimer) {
				clearTimeout(this._scanTimer);
			}

			this._scanTimer = setTimeout(() => {
				this._scanTimer = null;
				this.scanAndInit();
			}, delay || 100);
		},

		startAcfWatcher: function() {
			let attempts = 0;
			const timer = setInterval(() => {
				attempts += 1;

				if (typeof acf !== 'undefined' && acf.addAction) {
					clearInterval(timer);
					this.bindAcfActions();
					this.scanAndInit();
				}

				if (attempts >= 40) {
					clearInterval(timer);
				}
			}, 250);
		},

		loadSettings: function(callback) {
			const finish = () => {
				if (typeof callback === 'function') {
					callback();
				}
			};

			if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
				finish();
				return;
			}

			let finished = false;
			const done = () => {
				if (finished) return;
				finished = true;
				finish();
			};

			// Fallback if storage API is slow or unavailable after refresh
			setTimeout(done, 400);

			chrome.storage.sync.get(SETTINGS_STORAGE_KEY, (result) => {
				if (!chrome.runtime.lastError) {
					const migrated = this.migrateStoredSettings(result[SETTINGS_STORAGE_KEY] || {});
					this.settings = migrated.settings;
					this.normalizeSettings();

					if (migrated.changed) {
						const payload = {};
						payload[SETTINGS_STORAGE_KEY] = this.settings;
						chrome.storage.sync.set(payload);
					}
				}
				done();
			});
		},

		loadRecentSuggestions: function(callback) {
			if (!this.settings.enableRecentlyUsed || typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
				if (callback) callback();
				return;
			}

			chrome.storage.local.get(RECENT_STORAGE_KEY, (result) => {
				if (!chrome.runtime.lastError && result[RECENT_STORAGE_KEY]) {
					this._recentCache = Object.assign({ label: [], placeholder: [], instructions: [] }, result[RECENT_STORAGE_KEY]);
				}
				if (callback) callback();
			});
		},

		saveRecentSuggestion: function(type, value) {
			if (!this.settings.enableRecentlyUsed || !value) return;

			const trimmed = value.trim();
			if (!trimmed) return;

			if (!this._recentCache[type]) {
				this._recentCache[type] = [];
			}

			this._recentCache[type] = [trimmed].concat(
				this._recentCache[type].filter(item => item.toLowerCase() !== trimmed.toLowerCase())
			).slice(0, 5);

			if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
				const payload = {};
				payload[RECENT_STORAGE_KEY] = this._recentCache;
				chrome.storage.local.set(payload);
			}
		},

		mergeRecentSuggestions: function(suggestions, type) {
			if (!this.settings.enableRecentlyUsed || !this._recentCache[type] || !this._recentCache[type].length) {
				return suggestions;
			}

			const merged = [];
			const seen = new Set();

			this._recentCache[type].slice(0, 2).forEach(item => {
				const norm = item.trim();
				if (norm && !seen.has(norm.toLowerCase())) {
					seen.add(norm.toLowerCase());
					merged.push(norm);
				}
			});

			suggestions.forEach(item => {
				const norm = item.trim();
				if (norm && !seen.has(norm.toLowerCase())) {
					seen.add(norm.toLowerCase());
					merged.push(norm);
				}
			});

			return merged;
		},

		setupMessageListener: function() {
			if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) {
				return;
			}

			chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
				if (!message || !message.action) return;

				if (message.action === 'focus-suggestions') {
					this.focusSuggestionsField(message.target);
					sendResponse({ ok: true });
				}

				if (message.action === 'settings-updated') {
					this.loadSettings(() => {
						this.normalizeSettings();
						this.scanAndInit();
						sendResponse({ ok: true });
					});
					return true;
				}
			});
		},

		setupStorageListener: function() {
			if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.onChanged) {
				return;
			}

			chrome.storage.onChanged.addListener((changes, area) => {
				if (area === 'sync' && changes[SETTINGS_STORAGE_KEY]) {
					this.settings = Object.assign({}, DEFAULT_SETTINGS, changes[SETTINGS_STORAGE_KEY].newValue || {});
					this.normalizeSettings();
					this.scanAndInit();
				}

				if (area === 'local' && changes[RECENT_STORAGE_KEY]) {
					this._recentCache = Object.assign(
						{ label: [], placeholder: [], instructions: [] },
						changes[RECENT_STORAGE_KEY].newValue || {}
					);
				}
			});
		},

		focusSuggestionsField: function(target) {
			if (!this.settings.enableKeyboardShortcuts) return;

			const fieldObject = document.querySelector('.acf-field-object.acf-open') ||
			                    document.querySelector('.acf-field-object.open') ||
			                    document.querySelector('.acf-field-object');

			if (!fieldObject) return;

			let input = null;

			if (target === 'label' && this.settings.enableLabelSuggestions) {
				input = this.findFieldSettingInput(fieldObject, 'label');
			} else if (target === 'placeholder' && this.settings.enablePlaceholderSuggestions) {
				input = this.findFieldSettingInput(fieldObject, 'placeholder');
			} else if (target === 'instructions' && this.settings.enableInstructionsSuggestions) {
				input = this.findFieldSettingInput(fieldObject, 'instructions');
				const typeSelect = this.findFieldSettingInput(fieldObject, 'type');
				const typeValue = typeSelect ? typeSelect.value : '';
				if (input && !this.supportsInstructions(typeValue)) {
					input = null;
				}
			}

			if (!input) return;

			input.focus();
			input.scrollIntoView({ behavior: 'smooth', block: 'center' });

			if (target === 'label') this.injectLabelSuggestions(input);
			else if (target === 'placeholder') this.injectSuggestions(input);
			else if (target === 'instructions') this.injectInstructionsSuggestions(input);
		},

		slugify: function(text) {
			return (text || '')
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '_')
				.replace(/^_+|_+$/g, '');
		},

		getFieldTypeForInput: function(input) {
			if (!input) return 'text';

			const fieldKey = this.getFieldKeyFromInput(input);
			let typeSelect = fieldKey ? this.findSettingInputByFieldKey(fieldKey, 'type') : null;
			const fieldObject = this.getFieldObject(input);

			if (fieldObject) {
				typeSelect = typeSelect || this.findFieldSettingInput(fieldObject, 'type');
			}

			return typeSelect ? typeSelect.value : 'text';
		},

		getSuggestionsWrapper: function(input, create) {
			if (!input) return null;

			const host = input.closest('.acf-input') || input.parentNode;
			if (!host) return null;

			let wrapper = host.querySelector('.acf-fa-suggestions-wrapper');

			if (!wrapper && create) {
				wrapper = document.createElement('div');
				wrapper.className = 'acf-fa-suggestions-wrapper';
				host.appendChild(wrapper);
			}

			return wrapper;
		},

		isAcfFieldGroupLabelInput: function(input) {
			if (!input || input.tagName !== 'INPUT') return false;
			return !!input.closest('.acf-field-object, .acf-field[data-name="label"], .acf-field-setting-label');
		},

		setInputValue: function(input, value) {
			if (!input) return;
			input.value = value || '';
			input.dispatchEvent(new Event('input', { bubbles: true }));
			input.dispatchEvent(new Event('change', { bubbles: true }));
		},

		/**
		 * Scans the DOM for placeholder and label inputs and injects suggestions.
		 */
		scanAndInit: function() {
			if (this.settings.enablePlaceholderSuggestions) {
				document.querySelectorAll(
					'.acf-field[data-name="placeholder"] input, ' +
					'.acf-field-setting-placeholder input, ' +
					'input[name*="[placeholder]"], ' +
					'input[data-name="placeholder"], ' +
					'.acf-placeholder-input, ' +
					'[data-setting="placeholder"] input'
				).forEach(input => this.injectSuggestions(input));
			}

			if (this.settings.enableLabelSuggestions) {
				document.querySelectorAll(
					'.acf-field[data-name="label"] input, ' +
					'.acf-field-setting-label input, ' +
					'input[name*="[label]"], ' +
					'input[data-name="label"]'
				).forEach(input => {
					if (this.isAcfFieldGroupLabelInput(input)) {
						this.injectLabelSuggestions(input);
					}
				});
			}

			if (this.settings.enableInstructionsSuggestions) {
				document.querySelectorAll(
					'.acf-field[data-name="instructions"] textarea, ' +
					'.acf-field[data-name="instructions"] input, ' +
					'.acf-field-setting-instructions textarea, ' +
					'textarea[name*="[instructions]"], ' +
					'input[name*="[instructions]"]'
				).forEach(input => this.injectInstructionsSuggestions(input));
			}

			if (this.settings.enableRecommendedSetup) {
				document.querySelectorAll('.acf-field-object').forEach(fieldObject => {
					this.injectApplySetupButton(fieldObject);
				});
			} else {
				document.querySelectorAll('.acf-fa-apply-setup-btn, .acf-fa-apply-setup-wrapper').forEach(el => el.remove());
			}
		},

		/**
		 * Setup dynamic event delegation.
		 * Listens to typing (input) and selection (change) events globally, filtering for ACF elements.
		 */
		setupEventDelegation: function() {
			if (this._eventsBound) return;

			if (!document.body) {
				document.addEventListener('DOMContentLoaded', () => this.setupEventDelegation());
				return;
			}

			this._eventsBound = true;

			const self = this;
			const handleFieldInput = (e) => {
				const target = e.target;
				if (!target) return;

				if (self.isLabelInput(target) || self.isNameInput(target)) {
					self.handleLabelOrNameChange(target);
				}

				if (self.isPlaceholderInput(target)) {
					self.injectSuggestions(target);
				}

				if (self.isInstructionsInput(target)) {
					self.injectInstructionsSuggestions(target);
				}
			};

			// Capture phase catches ACF/jQuery events that may not bubble normally
			document.body.addEventListener('input', handleFieldInput, true);
			document.body.addEventListener('keyup', handleFieldInput, true);
			document.body.addEventListener('change', (e) => {
				const target = e.target;
				if (!target || target.tagName !== 'INPUT') return;

				if (self.isLabelInput(target) || self.isNameInput(target)) {
					self.handleLabelOrNameChange(target);
				}
			}, true);

			// Listen to changes in Field Type selects
			document.body.addEventListener('change', (e) => {
				const target = e.target;
				if (!target || target.tagName !== 'SELECT') return;

				const isType = target.name && (target.name.includes('[type]') || target.closest('.acf-field[data-name="type"]'));

				if (isType) {
					const fieldObject = target.closest('.acf-field-object') || 
					                    target.closest('.acf-field-setting') || 
					                    target.closest('tbody') || 
					                    target.closest('.acf-fields') || 
					                    target.parentNode.parentNode;
					if (fieldObject) {
						setTimeout(() => {
							const labelInput = self.findFieldSettingInput(fieldObject, 'label');
							if (labelInput && self.settings.enableLabelSuggestions) {
								self.injectLabelSuggestions(labelInput);
							}

							const instructionsInput = self.findFieldSettingInput(fieldObject, 'instructions');
							if (instructionsInput && self.settings.enableInstructionsSuggestions) {
								self.injectInstructionsSuggestions(instructionsInput);
							}

							self.refreshPlaceholderSuggestions(
								fieldObject,
								labelInput ? labelInput.value : undefined,
								labelInput
							);

							if (self.settings.enableRecommendedSetup) {
								self.injectApplySetupButton(fieldObject);
							}
						}, 100);
					}
				}
			});

			// Tab switches, accordion toggles, field row expand
			document.body.addEventListener('click', () => {
				setTimeout(() => self.scanAndInit(), 100);
			});

			document.body.addEventListener('focusin', (e) => {
				const target = e.target;
				if (!target) return;

				const tag = target.tagName;
				if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;

				if (self.isPlaceholderInput(target)) {
					self.injectSuggestions(target);
				}

				if (self.isLabelInput(target)) {
					self.injectLabelSuggestions(target);
				}

				if (self.isInstructionsInput(target)) {
					self.injectInstructionsSuggestions(target);
				}
			});
		},

		/**
		 * Hooks into ACF's JS API when available for reliable field updates.
		 */
		setupAcfIntegration: function() {
			if (typeof acf !== 'undefined' && acf.addAction) {
				this.bindAcfActions();
			}

			window.addEventListener('load', () => {
				setTimeout(() => this.scanAndInit(), 200);
			});
		},

		bindAcfActions: function() {
			if (this._acfBound || typeof acf === 'undefined' || !acf.addAction) {
				return;
			}
			this._acfBound = true;

			const rescan = () => setTimeout(() => this.scanAndInit(), 100);

			acf.addAction('ready', rescan);
			acf.addAction('append', rescan);
			acf.addAction('show_field', rescan);
			acf.addAction('prepare_field_object', rescan);
			acf.addAction('remove_field_object', rescan);
		},

		isLabelInput: function(el) {
			return !!el && el.tagName === 'INPUT' && (
				(el.name && el.name.includes('[label]')) ||
				!!el.closest('.acf-field[data-name="label"], .acf-field-setting-label')
			);
		},

		isNameInput: function(el) {
			return !!el && el.tagName === 'INPUT' && (
				(el.name && el.name.includes('[name]')) ||
				!!el.closest('.acf-field[data-name="name"], .acf-field-setting-name')
			);
		},

		isPlaceholderInput: function(el) {
			return !!el && el.tagName === 'INPUT' && (
				(el.name && el.name.includes('[placeholder]')) ||
				!!el.closest('.acf-field[data-name="placeholder"], .acf-field-setting-placeholder')
			);
		},

		isInstructionsInput: function(el) {
			return !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') && (
				(el.name && el.name.includes('[instructions]')) ||
				!!el.closest('.acf-field[data-name="instructions"], .acf-field-setting-instructions')
			);
		},

		/**
		 * Extracts the ACF field key from a setting input name attribute.
		 *
		 * @param {HTMLInputElement|HTMLSelectElement} input
		 * @returns {string|null}
		 */
		getFieldKeyFromInput: function(input) {
			if (!input || !input.name) return null;

			const keys = input.name.match(/field_[a-zA-Z0-9]+/g);
			return keys ? keys[keys.length - 1] : null;
		},

		/**
		 * Finds a sibling setting input for the same ACF field using its field key.
		 *
		 * @param {string} fieldKey
		 * @param {string} settingName
		 * @returns {HTMLInputElement|HTMLSelectElement|null}
		 */
		findSettingInputByFieldKey: function(fieldKey, settingName) {
			if (!fieldKey) return null;

			return document.querySelector(
				`input[name$="[${fieldKey}][${settingName}]"], ` +
				`select[name$="[${fieldKey}][${settingName}]"], ` +
				`textarea[name$="[${fieldKey}][${settingName}]"]`
			);
		},

		/**
		 * Setup MutationObserver to detect dynamically added fields (AJAX, Repeaters, Flexible Content, etc.)
		 */
		setupMutationObserver: function() {
			if (!document.body) return;

			const observer = new MutationObserver((mutations) => {
				let shouldScan = false;

				for (const mutation of mutations) {
					if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
						const node = mutation.target;
						if (node.nodeType === Node.ELEMENT_NODE && node.classList && node.classList.contains('acf-field-object')) {
							shouldScan = true;
							break;
						}
					}

					if (mutation.addedNodes.length > 0) {
						for (const node of mutation.addedNodes) {
							if (node.nodeType === Node.ELEMENT_NODE) {
								if (
									node.classList.contains('acf-field-object') ||
									node.classList.contains('acf-field') ||
									node.querySelector('.acf-field-object') ||
									node.querySelector('input[name*="[placeholder]"]') ||
									node.querySelector('.acf-field[data-name="placeholder"]') ||
									node.querySelector('input[name*="[label]"]') ||
									node.querySelector('.acf-field[data-name="label"]') ||
									node.querySelector('textarea[name*="[instructions]"]') ||
									node.querySelector('.acf-field[data-name="instructions"]')
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
					this.queueScan(120);
				}
			});

			observer.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ['class']
			});
		},

		/**
		 * Resolves the ACF field object container for a setting input.
		 *
		 * @param {HTMLElement} input - A setting input inside a field editor row.
		 * @returns {HTMLElement|null}
		 */
		getFieldObject: function(input) {
			if (!input) return null;

			return input.closest('.acf-field-object') ||
			       input.closest('.acf-field-setting') ||
			       input.closest('tbody') ||
			       input.closest('.acf-fields') ||
			       (input.parentNode && input.parentNode.parentNode) ||
			       null;
		},

		/**
		 * Refreshes placeholder suggestions for a field after label/name changes.
		 * Uses a short delay so ACF can sync the auto-generated field name first.
		 *
		 * @param {HTMLElement} fieldObject - The .acf-field-object container.
		 */
		refreshPlaceholderSuggestions: function(fieldObject, labelOverride, sourceInput) {
			if (!this.settings.enablePlaceholderSuggestions) return;
			if (!fieldObject && !sourceInput) return;

			const runRefresh = () => {
				let placeholderInput = null;
				let labelInput = null;
				let nameInput = null;
				let typeSelect = null;

				const fieldKey = sourceInput ? this.getFieldKeyFromInput(sourceInput) : null;

				if (fieldKey) {
					placeholderInput = this.findSettingInputByFieldKey(fieldKey, 'placeholder');
					labelInput = this.findSettingInputByFieldKey(fieldKey, 'label');
					nameInput = this.findSettingInputByFieldKey(fieldKey, 'name');
					typeSelect = this.findSettingInputByFieldKey(fieldKey, 'type');
				}

				if (fieldObject) {
					placeholderInput = placeholderInput || this.findFieldSettingInput(fieldObject, 'placeholder');
					labelInput = labelInput || this.findFieldSettingInput(fieldObject, 'label');
					nameInput = nameInput || this.findFieldSettingInput(fieldObject, 'name');
					typeSelect = typeSelect || this.findFieldSettingInput(fieldObject, 'type');
				}

				if (!placeholderInput) return;

				const label = labelOverride !== undefined
					? labelOverride
					: (labelInput ? labelInput.value : '');

				this.injectSuggestions(placeholderInput, {
					__acfFa: true,
					label: label,
					name: nameInput ? nameInput.value : '',
					type: typeSelect ? typeSelect.value : 'text'
				});
			};

			runRefresh();

			const timerHost = fieldObject || sourceInput;
			if (timerHost && timerHost._acfFaPlaceholderTimer) {
				clearTimeout(timerHost._acfFaPlaceholderTimer);
			}

			if (timerHost) {
				timerHost._acfFaPlaceholderTimer = setTimeout(runRefresh, 250);
			}
		},

		handleLabelOrNameChange: function(target) {
			const fieldObject = this.getFieldObject(target);
			const labelOverride = this.isLabelInput(target) ? target.value : undefined;

			if (this.isLabelInput(target)) {
				this.injectLabelSuggestions(target);
			}

			this.refreshPlaceholderSuggestions(fieldObject, labelOverride, target);
		},

		/**
		 * Helper to find a setting input inside a specific field object, scoping to prevent finding nested sub-fields.
		 *
		 * @param {HTMLElement} fieldObject - The .acf-field-object container.
		 * @param {string} settingName - The setting target (label, name, type, placeholder).
		 * @returns {HTMLInputElement|HTMLSelectElement|null} The matched input element.
		 */
		findFieldSettingInput: function(fieldObject, settingName) {
			if (!fieldObject) return null;
			
			// 1. Selector strategy using wrappers
			const rows = fieldObject.querySelectorAll(
				`.acf-field[data-name="${settingName}"], ` +
				`.acf-field-setting-${settingName}, ` +
				`[class*="acf-field-setting-${settingName}"]`
			);

			for (const row of rows) {
				// Scopes to this field object strictly if one exists, otherwise matches
				const rowObj = row.closest('.acf-field-object');
				if (!rowObj || rowObj === fieldObject) {
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
				const inputObj = input.closest('.acf-field-object');
				if (!inputObj || inputObj === fieldObject) {
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

			// Rule 1: Label-first suggestions (primary behavior)
			if (cleanLabel.length > 0) {
				suggestions.push(
					`Enter your ${lowerLabel}`,
					`Write your ${lowerLabel}`,
					`Add a ${lowerLabel}`,
					`Type your ${lowerLabel}`
				);
			}

			const hasKeyword = (keyword) => {
				if (lowerLabel.includes(keyword)) {
					return true;
				}

				if (cleanLabel.length === 0 && lowerName.includes(keyword)) {
					return true;
				}

				return false;
			};

			// Rule 2: Extra smart patterns based on label/name keywords
			if (hasKeyword('email') || hasKeyword('mail')) {
				suggestions.push('example@email.com');
			} else if (hasKeyword('phone') || hasKeyword('tel') || hasKeyword('mobile')) {
				suggestions.push('+1 234 567 890');
			} else if (hasKeyword('button') || hasKeyword('btn') || hasKeyword('link')) {
				suggestions.push('Learn More', 'Get Started', 'Contact Us');
			} else if (hasKeyword('search') || hasKeyword('query')) {
				suggestions.push('Search...', 'Type to search');
			} else if (hasKeyword('price') || hasKeyword('amount') || hasKeyword('cost')) {
				suggestions.push('0.00');
			} else if (hasKeyword('date') || hasKeyword('time')) {
				suggestions.push('YYYY-MM-DD', 'Select date');
			} else if (hasKeyword('url') || hasKeyword('website') || hasKeyword('web')) {
				suggestions.push('https://example.com');
			}

			// Rule 3: Field type fallbacks when label is empty
			if (cleanLabel.length === 0) {
				if (hasKeyword('title')) {
					suggestions.push('Enter your title', 'Add a title', 'Write your title');
				} else if (hasKeyword('description') || hasKeyword('desc') || hasKeyword('details') || hasKeyword('message')) {
					suggestions.push('Enter your description', 'Write description', 'Add details');
				} else if (hasKeyword('name') || hasKeyword('fullname') || hasKeyword('username')) {
					suggestions.push('Enter your name', 'Full name', 'Enter full name');
				} else if (hasKeyword('company') || hasKeyword('organization') || hasKeyword('org')) {
					suggestions.push('Enter company name', 'Company Name');
				} else if (hasKeyword('address') || hasKeyword('location') || hasKeyword('city')) {
					suggestions.push('Enter your address', 'City, State, Zip');
				}

				const typeSuggestions = {
					'text': ['Enter your text', 'Type here', 'Add text'],
					'email': ['Enter your email address', 'example@email.com'],
					'url': ['https://example.com', 'Enter website URL'],
					'number': ['Enter a number', '0'],
					'textarea': ['Write your description', 'Add details', 'Type your message'],
					'password': ['Enter your password']
				};

				if (typeSuggestions[cleanType]) {
					suggestions.push.apply(suggestions, typeSuggestions[cleanType]);
				}
			}

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

			return this.mergeRecentSuggestions(finalSuggestions, 'placeholder').slice(0, 4);
		},

		/**
		 * Normalizes an ACF field type slug to a canonical key.
		 *
		 * @param {string} type
		 * @returns {string}
		 */
		normalizeFieldType: function(type) {
			const cleanType = (type || 'text').trim().toLowerCase().replace(/\s+/g, '_');
			return FIELD_TYPE_ALIASES[cleanType] || cleanType;
		},

		supportsInstructions: function(type) {
			return INSTRUCTIONS_ENABLED_TYPES.includes(this.normalizeFieldType(type));
		},

		removeInstructionsSuggestions: function(instructionsInput) {
			const host = instructionsInput && (instructionsInput.closest('.acf-input') || instructionsInput.parentNode);
			if (!host) return;
			const wrapper = host.querySelector('.acf-fa-suggestions-wrapper');
			if (wrapper) wrapper.remove();
		},

		/**
		 * Generates field label suggestions based on the active field type.
		 *
		 * @param {string} type - The active field type.
		 * @returns {Array} List of string label suggestions.
		 */
		generateLabelSuggestions: function(type) {
			const cleanType = this.normalizeFieldType(type);
			const suggestions = FIELD_LABEL_SUGGESTIONS[cleanType] || FIELD_LABEL_SUGGESTIONS._default;
			const expandedTypes = ['repeater', 'flexible_content'];
			const maxCount = expandedTypes.includes(cleanType)
				? Math.min(10, this.getMaxSuggestions() + 4)
				: this.getMaxSuggestions();

			const sortedSuggestions = expandedTypes.includes(cleanType)
				? [...suggestions].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
				: suggestions;

			return this.mergeRecentSuggestions(sortedSuggestions, 'label').slice(0, maxCount);
		},

		generateInstructionSuggestions: function(type) {
			const cleanType = this.normalizeFieldType(type);

			if (!this.supportsInstructions(cleanType)) {
				return [];
			}

			const suggestions = FIELD_INSTRUCTIONS_SUGGESTIONS[cleanType] || [];
			return this.mergeRecentSuggestions(suggestions, 'instructions').slice(0, this.getMaxSuggestions());
		},

		getMaxSuggestions: function() {
			return Math.max(1, parseInt(this.settings.maxSuggestions, 10) || DEFAULT_SETTINGS.maxSuggestions);
		},

		/**
		 * Renders suggestion pills inside a wrapper element.
		 *
		 * @param {HTMLElement} wrapper - The suggestions container.
		 * @param {HTMLInputElement} targetInput - The input to populate on click.
		 * @param {Array<string>} suggestionsList - Suggestions to render.
		 * @param {Function} reInjectFn - Callback to refresh pills after selection.
		 */
		renderSuggestionPills: function(wrapper, targetInput, suggestionsList, reInjectFn, options) {
			const opts = options || {};
			const preservedSetup = wrapper.querySelector('.acf-fa-apply-setup-btn');
			wrapper.innerHTML = '';

			if (suggestionsList.length === 0) {
				if (preservedSetup) {
					wrapper.appendChild(preservedSetup);
				}
				return;
			}

			const labelSpan = document.createElement('span');
			labelSpan.className = 'acf-fa-suggestions-label';
			labelSpan.textContent = opts.recentLabel ? 'Recent & Suggestions:' : 'Suggestions:';
			wrapper.appendChild(labelSpan);

			suggestionsList.forEach(sugText => {
				const pill = document.createElement('button');
				pill.type = 'button';
				pill.className = 'acf-fa-suggestion-pill';
				pill.textContent = sugText;

				if (targetInput.value === sugText) {
					pill.classList.add('acf-fa-suggestion-pill--active');
				}

				pill.addEventListener('click', (e) => {
					e.preventDefault();
					e.stopPropagation();

					targetInput.value = sugText;
					targetInput.dispatchEvent(new Event('input', { bubbles: true }));
					targetInput.dispatchEvent(new Event('change', { bubbles: true }));

					if (opts.suggestionType) {
						this.saveRecentSuggestion(opts.suggestionType, sugText);
					}

					if (typeof opts.onSelect === 'function') {
						opts.onSelect.call(this, targetInput);
					}

					reInjectFn.call(this, targetInput);
				});

				wrapper.appendChild(pill);
			});

			if (preservedSetup) {
				wrapper.appendChild(preservedSetup);
			}
		},

		/**
		 * Injects suggestion pills under a specific placeholder input.
		 *
		 * @param {HTMLInputElement} placeholderInput - The target placeholder input element.
		 */
		injectSuggestions: function(placeholderInput, contextOverride) {
			if (!this.settings.enablePlaceholderSuggestions || !placeholderInput) return;

			const wrapper = this.getSuggestionsWrapper(placeholderInput, true);
			if (!wrapper) return;

			const fieldContext = contextOverride && contextOverride.__acfFa === true ? contextOverride : null;
			const fieldObject = this.getFieldObject(placeholderInput);
			const fieldKey = this.getFieldKeyFromInput(placeholderInput);

			let labelInput = fieldKey ? this.findSettingInputByFieldKey(fieldKey, 'label') : null;
			let nameInput = fieldKey ? this.findSettingInputByFieldKey(fieldKey, 'name') : null;
			let typeSelect = fieldKey ? this.findSettingInputByFieldKey(fieldKey, 'type') : null;

			if (fieldObject) {
				labelInput = labelInput || this.findFieldSettingInput(fieldObject, 'label');
				nameInput = nameInput || this.findFieldSettingInput(fieldObject, 'name');
				typeSelect = typeSelect || this.findFieldSettingInput(fieldObject, 'type');
			}

			const label = fieldContext && fieldContext.label !== undefined
				? fieldContext.label
				: (labelInput ? labelInput.value : '');
			const name = fieldContext && fieldContext.name !== undefined
				? fieldContext.name
				: (nameInput ? nameInput.value : '');
			const type = fieldContext && fieldContext.type !== undefined
				? fieldContext.type
				: (typeSelect ? typeSelect.value : 'text');

			const suggestionsList = this.generateSuggestions(label, name, type);
			this.renderSuggestionPills(wrapper, placeholderInput, suggestionsList, () => {
				this.injectSuggestions(placeholderInput);
			}, {
				suggestionType: 'placeholder',
				recentLabel: this.settings.enableRecentlyUsed && this._recentCache.placeholder.length > 0
			});
		},

		/**
		 * Injects suggestion pills under a specific field label input.
		 *
		 * @param {HTMLInputElement} labelInput - The target field label input element.
		 */
		injectLabelSuggestions: function(labelInput) {
			if (!this.settings.enableLabelSuggestions || !labelInput) return;

			const wrapper = this.getSuggestionsWrapper(labelInput, true);
			if (!wrapper) return;

			const type = this.getFieldTypeForInput(labelInput);
			const suggestionsList = this.generateLabelSuggestions(type);

			this.renderSuggestionPills(
				wrapper,
				labelInput,
				suggestionsList,
				() => this.injectLabelSuggestions(labelInput),
				{
					suggestionType: 'label',
					recentLabel: this.settings.enableRecentlyUsed && this._recentCache.label.length > 0,
					onSelect: function(selectedLabelInput) {
						this.refreshPlaceholderSuggestions(
							this.getFieldObject(selectedLabelInput),
							selectedLabelInput.value,
							selectedLabelInput
						);
					}
				}
			);

			const fieldObject = this.getFieldObject(labelInput);
			if (fieldObject) {
				this.injectApplySetupButton(fieldObject, labelInput);
			}
		},

		injectInstructionsSuggestions: function(instructionsInput) {
			if (!this.settings.enableInstructionsSuggestions || !instructionsInput) return;

			const type = this.getFieldTypeForInput(instructionsInput);

			if (!this.supportsInstructions(type)) {
				this.removeInstructionsSuggestions(instructionsInput);
				return;
			}

			const wrapper = this.getSuggestionsWrapper(instructionsInput, true);
			if (!wrapper) return;

			const suggestionsList = this.generateInstructionSuggestions(type);

			this.renderSuggestionPills(
				wrapper,
				instructionsInput,
				suggestionsList,
				() => this.injectInstructionsSuggestions(instructionsInput),
				{
					suggestionType: 'instructions',
					recentLabel: this.settings.enableRecentlyUsed && this._recentCache.instructions.length > 0
				}
			);
		},

		injectApplySetupButton: function(fieldObject, labelInput) {
			if (!this.settings.enableRecommendedSetup || !fieldObject) return;

			const labelInputEl = labelInput || this.findFieldSettingInput(fieldObject, 'label');
			if (!labelInputEl) return;

			const inputWrap = labelInputEl.closest('.acf-input') || labelInputEl.parentNode;
			if (!inputWrap) return;

			// Remove legacy wrapper elements
			inputWrap.querySelectorAll('.acf-fa-apply-setup-wrapper').forEach((wrapper) => {
				const btn = wrapper.querySelector('.acf-fa-apply-setup-btn');
				if (btn) {
					wrapper.parentNode.insertBefore(btn, wrapper);
				}
				wrapper.remove();
			});

			const suggestionsWrapper = this.getSuggestionsWrapper(labelInputEl, false);
			let setupBtn = inputWrap.querySelector('.acf-fa-apply-setup-btn');

			if (!setupBtn) {
				setupBtn = document.createElement('button');
				setupBtn.type = 'button';
				setupBtn.className = 'acf-fa-suggestion-pill acf-fa-apply-setup-btn';
				setupBtn.textContent = 'Apply Setup';
				setupBtn.title = 'Apply recommended label, name, placeholder & instructions';
				setupBtn.addEventListener('click', (e) => {
					e.preventDefault();
					e.stopPropagation();
					this.applyRecommendedSetup(fieldObject);
				});
			}

			const typeSelect = this.findFieldSettingInput(fieldObject, 'type');
			const cleanType = this.normalizeFieldType(typeSelect ? typeSelect.value : 'text');
			const hasSetup = !!RECOMMENDED_SETUPS[cleanType];

			if (suggestionsWrapper) {
				suggestionsWrapper.appendChild(setupBtn);
			} else {
				inputWrap.appendChild(setupBtn);
			}

			setupBtn.style.display = hasSetup ? 'inline-block' : 'none';
		},

		applyRecommendedSetup: function(fieldObject) {
			const typeSelect = this.findFieldSettingInput(fieldObject, 'type');
			const cleanType = this.normalizeFieldType(typeSelect ? typeSelect.value : 'text');
			const setup = RECOMMENDED_SETUPS[cleanType];

			if (!setup) return;

			const labelInput = this.findFieldSettingInput(fieldObject, 'label');
			const nameInput = this.findFieldSettingInput(fieldObject, 'name');
			const placeholderInput = this.findFieldSettingInput(fieldObject, 'placeholder');
			const instructionsInput = this.findFieldSettingInput(fieldObject, 'instructions');

			this.setInputValue(labelInput, setup.label);
			this.setInputValue(nameInput, setup.name || this.slugify(setup.label));

			if (placeholderInput && setup.placeholder) {
				this.setInputValue(placeholderInput, setup.placeholder);
			}

			if (instructionsInput && setup.instructions && this.supportsInstructions(cleanType)) {
				this.setInputValue(instructionsInput, setup.instructions);
			}

			setTimeout(() => {
				if (labelInput && this.settings.enableLabelSuggestions) {
					this.injectLabelSuggestions(labelInput);
				}
				if (placeholderInput && this.settings.enablePlaceholderSuggestions) {
					this.injectSuggestions(placeholderInput);
				}
				if (instructionsInput && this.settings.enableInstructionsSuggestions) {
					this.injectInstructionsSuggestions(instructionsInput);
				}
			}, 150);
		}
	};

	// Initialize when the DOM is fully ready, rescan after full page load (ACF late render)
	function bootstrap() {
		ACFFieldAssistant.init();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', bootstrap);
	} else {
		bootstrap();
	}

	window.addEventListener('load', () => {
		setTimeout(() => ACFFieldAssistant.scanAndInit(), 300);
		setTimeout(() => ACFFieldAssistant.scanAndInit(), 1200);
	});


})();
