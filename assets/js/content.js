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
		'gravity_forms_field': 'gravity_forms',
		'acf_gravity_forms': 'gravity_forms',
		'post_types': 'post_type',
		'post_type_field': 'post_type',
		'acfe_post_types': 'post_type',
		'icon_picker': 'custom_icon_picker',
		'icon_picker_advanced': 'custom_icon_picker',
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
		'textarea': ['Description', 'Content', 'Bio', 'Summary', 'Notes', 'Details', 'Embed Code'],
		'number': ['Number', 'Amount', 'Quantity', 'Price', 'Count', 'Total'],
		'range': ['Range', 'Level', 'Rating', 'Score', 'Progress', 'Scale'],
		'email': ['Email', 'Email Address', 'Contact Email', 'Work Email', 'Support Email', 'Newsletter Email'],
		'url': ['Website', 'URL', 'Profile URL', 'Video URL', 'Button Link', 'Social URL'],
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
		'link': ['Link', 'Button', 'Website'],
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
		'nav_menu': ['Menu', 'Nav Menu', 'Navigation', 'Primary Menu', 'Footer Menu', 'Menu Location'],

		'_default': ['Title', 'Label', 'Name', 'Field', 'Value', 'Setting']
	};

	/**
	 * Child-field labels when nested inside a repeater / flexible / group
	 * whose parent label or name matches a keyword.
	 */
	const REPEATER_CHILD_LABELS = [
		{ match: ['team', 'member', 'staff', 'people'], labels: ['Name', 'Role', 'Photo', 'Bio'] },
		{ match: ['testimonial', 'review', 'quote'], labels: ['Quote', 'Name', 'Photo', 'Company'] },
		{ match: ['faq', 'question', 'accordion'], labels: ['Question', 'Answer'] },
		{ match: ['slide', 'slider', 'carousel', 'hero'], labels: ['Title', 'Image', 'Caption', 'Button'] },
		{ match: ['social', 'network'], labels: ['Platform', 'URL', 'Icon'] },
		{ match: ['feature', 'benefit'], labels: ['Title', 'Icon', 'Description'] },
		{ match: ['service'], labels: ['Title', 'Icon', 'Description', 'Link'] },
		{ match: ['step', 'process', 'how it'], labels: ['Title', 'Description', 'Number'] },
		{ match: ['menu', 'nav', 'link item'], labels: ['Label', 'URL', 'Icon'] },
		{ match: ['gallery', 'photo', 'image item'], labels: ['Image', 'Caption', 'Alt Text'] },
		{ match: ['job', 'career', 'vacancy'], labels: ['Title', 'Location', 'Description'] },
		{ match: ['event'], labels: ['Title', 'Date', 'Location', 'Description'] },
		{ match: ['product', 'item shop'], labels: ['Title', 'Price', 'Image', 'Description'] },
		{ match: ['client', 'partner', 'logo'], labels: ['Name', 'Logo', 'URL'] },
		{ match: ['box', 'card', 'item'], labels: ['Title', 'Description', 'Icon'] }
	];

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
			placeholder: 'Enter your description'
		},
		'email': {
			label: 'Email Address',
			name: 'email_address',
			placeholder: 'Enter your email address'
		},
		'url': {
			label: 'Website',
			name: 'website',
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

	/**
	 * All cycleable ACF field type slugs.
	 * Default shortcuts group by the **first letter** of each slug
	 * (e.g. T → tab, taxonomy, text, textarea, time_picker, true_false).
	 */
	const CYCLEABLE_FIELD_TYPES = [
		'accordion', 'address',
		'button_group',
		'checkbox', 'clone', 'color_picker',
		'date_picker', 'date_time_picker',
		'email',
		'file', 'flexible_content',
		'gallery', 'google_map', 'gravity_forms_field', 'group',
		'icon_picker_advanced', 'image',
		'link',
		'message',
		'nav_menu', 'number',
		'oembed',
		'page_link', 'password', 'post_object', 'post_type_field',
		'radio', 'range', 'relationship', 'repeater',
		'select',
		'tab', 'table', 'taxonomy', 'text', 'textarea', 'time_picker', 'true_false',
		'url', 'user',
		'wysiwyg'
	];

	const buildTypeCyclesByFirstLetter = (types) => {
		const cycles = {};

		types.forEach((type) => {
			const letter = String(type || '').charAt(0).toLowerCase();
			if (!letter || !/[a-z]/.test(letter)) return;
			if (!cycles[letter]) cycles[letter] = [];
			if (!cycles[letter].includes(type)) {
				cycles[letter].push(type);
			}
		});

		Object.keys(cycles).forEach((letter) => {
			cycles[letter].sort((a, b) => a.localeCompare(b));
		});

		return cycles;
	};

	/**
	 * Preferred shortcut letter when it differs from the slug's first letter.
	 * e.g. nav_menu → M (not N)
	 */
	const TYPE_CYCLE_LETTER_OVERRIDES = {
		nav_menu: 'm'
	};

	const applyTypeCycleLetterOverrides = (cycles) => {
		const next = Object.assign({}, cycles);

		Object.keys(TYPE_CYCLE_LETTER_OVERRIDES).forEach((type) => {
			const preferred = TYPE_CYCLE_LETTER_OVERRIDES[type];
			const natural = String(type).charAt(0).toLowerCase();

			Object.keys(next).forEach((letter) => {
				next[letter] = (next[letter] || []).filter((slug) => slug !== type);
				if (!next[letter].length) {
					delete next[letter];
				}
			});

			if (!next[preferred]) next[preferred] = [];
			if (!next[preferred].includes(type)) {
				next[preferred].push(type);
			}
			next[preferred].sort((a, b) => a.localeCompare(b));

			// Keep natural letter list intact for other types; override only moves this slug
			if (natural !== preferred && next[natural] && !next[natural].length) {
				delete next[natural];
			}
		});

		return next;
	};

	const DEFAULT_TYPE_CYCLES = applyTypeCycleLetterOverrides(
		buildTypeCyclesByFirstLetter(CYCLEABLE_FIELD_TYPES)
	);

	const DEFAULT_SETTINGS = {
		settingsVersion: 6,
		enableLabelSuggestions: true,
		enablePlaceholderSuggestions: true,
		enableInstructionsSuggestions: true,
		enableRecommendedSetup: true,
		enableRecentlyUsed: true,
		enableKeyboardShortcuts: true,
		maxSuggestions: 4,
		placeholderTone: 'enter_your',
		typeCycleModifier: 'alt',
		typeCycles: Object.assign({}, DEFAULT_TYPE_CYCLES)
	};

	const SETTINGS_VERSION = DEFAULT_SETTINGS.settingsVersion;

	const RECENT_STORAGE_KEY = 'acfFaRecentSuggestions';
	const SETTINGS_STORAGE_KEY = 'acfFaSettings';

	const TYPE_LABELS = {
		text: 'Text',
		textarea: 'Textarea',
		true_false: 'True / False',
		tab: 'Tab',
		table: 'Table',
		taxonomy: 'Taxonomy',
		time_picker: 'Time',
		range: 'Range',
		radio: 'Radio',
		relationship: 'Relationship',
		repeater: 'Repeater',
		image: 'Image',
		number: 'Number',
		email: 'Email',
		url: 'URL',
		user: 'User',
		file: 'File',
		flexible_content: 'Flexible Content',
		wysiwyg: 'WYSIWYG',
		oembed: 'oEmbed',
		gallery: 'Gallery',
		group: 'Group',
		google_map: 'Google Map',
		select: 'Select',
		checkbox: 'Checkbox',
		color_picker: 'Color',
		clone: 'Clone',
		button_group: 'Button Group',
		link: 'Link',
		post_object: 'Post Object',
		page_link: 'Page Link',
		password: 'Password',
		date_picker: 'Date',
		date_time_picker: 'Date Time',
		accordion: 'Accordion',
		address: 'Address',
		message: 'Message',
		gravity_forms_field: 'Gravity Forms',
		post_type_field: 'Post Type',
		nav_menu: 'Nav Menu',
		icon_picker_advanced: 'Icon Picker'
	};

	/**
	 * Main Controller Instance
	 */
	const ACFFieldAssistant = {

		settings: Object.assign({}, DEFAULT_SETTINGS),
		_recentStore: {},
		_initialized: false,
		_eventsBound: false,
		_acfBound: false,
		_scanTimer: null,
		_cyclePanelOpen: false,

		isFieldGroupEditorPage: function() {
			if (!window.location.href.includes('/wp-admin/')) {
				return false;
			}

			try {
				const params = new URLSearchParams(window.location.search);
				if (params.get('post_type') === 'acf-field-group') {
					return true;
				}
			} catch (e) {
				// Ignore invalid query strings
			}

			if (document.body && document.body.classList.contains('post-type-acf-field-group')) {
				return true;
			}

			if (document.getElementById('acf-field-group-fields')) {
				return true;
			}

			return false;
		},

		removeInjectedUi: function() {
			this.closeTypeCyclePanel();
			document.querySelectorAll(
				'.acf-fa-suggestions-wrapper, .acf-fa-apply-setup-btn, .acf-fa-undo-setup-btn, .acf-fa-copy-name, .acf-fa-cycle-panel, .acf-fa-cycle-toast'
			).forEach((el) => el.remove());
		},

		init: function() {
			if (!this.isFieldGroupEditorPage()) {
				this.removeInjectedUi();
				return;
			}

			if (this._initialized) {
				this.scanAndInit();
				return;
			}
			this._initialized = true;

			// Bind events immediately — do not wait for chrome.storage
			this.setupEventDelegation();
			this.setupTypeCycleShortcuts();
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
			if (!['enter_your', 'ellipsis', 'short'].includes(s.placeholderTone)) {
				s.placeholderTone = DEFAULT_SETTINGS.placeholderTone;
			}
			if (!['alt', 'ctrlShift', 'shift'].includes(s.typeCycleModifier)) {
				s.typeCycleModifier = DEFAULT_SETTINGS.typeCycleModifier;
			}
			if (!s.typeCycles || typeof s.typeCycles !== 'object') {
				s.typeCycles = Object.assign({}, DEFAULT_TYPE_CYCLES);
			} else {
				s.typeCycles = Object.assign({}, DEFAULT_TYPE_CYCLES, s.typeCycles);
			}
			s.settingsVersion = SETTINGS_VERSION;
		},

		migrateStoredSettings: function(stored) {
			const settings = Object.assign({}, DEFAULT_SETTINGS, stored || {});
			let changed = false;
			const storedVersion = stored && stored.settingsVersion ? stored.settingsVersion : 1;

			if (storedVersion < 2) {
				if (!stored || stored.maxSuggestions === undefined || stored.maxSuggestions === 6) {
					settings.maxSuggestions = DEFAULT_SETTINGS.maxSuggestions;
				}
			}

			// v5+: rebuild type cycles from field-type first letters / overrides
			if (storedVersion < 6) {
				settings.typeCycles = Object.assign({}, DEFAULT_TYPE_CYCLES);
				if (!settings.typeCycleModifier) {
					settings.typeCycleModifier = DEFAULT_SETTINGS.typeCycleModifier;
				}
				changed = true;
			}

			if (storedVersion < SETTINGS_VERSION) {
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

		emptyRecentBucket: function() {
			return { label: [], placeholder: [], instructions: [] };
		},

		getSiteKey: function() {
			return (window.location.hostname || 'default').toLowerCase();
		},

		normalizeRecentStore: function(stored) {
			if (!stored || typeof stored !== 'object') {
				return {};
			}

			if (Array.isArray(stored.label) || Array.isArray(stored.placeholder) || Array.isArray(stored.instructions)) {
				const migrated = {};
				migrated[this.getSiteKey()] = Object.assign(this.emptyRecentBucket(), stored);
				return migrated;
			}

			return stored;
		},

		getSiteRecents: function() {
			const site = this.getSiteKey();
			if (!this._recentStore[site]) {
				this._recentStore[site] = this.emptyRecentBucket();
			}
			return this._recentStore[site];
		},

		loadRecentSuggestions: function(callback) {
			if (!this.settings.enableRecentlyUsed || typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
				if (callback) callback();
				return;
			}

			chrome.storage.local.get(RECENT_STORAGE_KEY, (result) => {
				if (!chrome.runtime.lastError && result[RECENT_STORAGE_KEY]) {
					this._recentStore = this.normalizeRecentStore(result[RECENT_STORAGE_KEY]);
				}
				if (callback) callback();
			});
		},

		saveRecentSuggestion: function(type, value) {
			if (!this.settings.enableRecentlyUsed || !value) return;

			const trimmed = value.trim();
			if (!trimmed) return;

			const recents = this.getSiteRecents();
			if (!recents[type]) {
				recents[type] = [];
			}

			recents[type] = [trimmed].concat(
				recents[type].filter(item => item.toLowerCase() !== trimmed.toLowerCase())
			).slice(0, 5);

			if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
				const payload = {};
				payload[RECENT_STORAGE_KEY] = this._recentStore;
				chrome.storage.local.set(payload);
			}
		},

		/**
		 * Order: type defaults → optional smart/context tail → recent tail.
		 * Tails are reserved so defaults stay primary when the max is tight.
		 *
		 * @param {Array<string>} suggestions
		 * @param {string} type - Recent bucket key (label|placeholder|instructions)
		 * @param {number} maxCount
		 * @param {{ extraTail?: Array<string>, extraTailMax?: number }} [options]
		 * @returns {Array<string>}
		 */
		mergeRecentSuggestions: function(suggestions, type, maxCount, options) {
			const opts = options || {};
			const defaults = [];
			const seen = new Set();

			(suggestions || []).forEach((item) => {
				const norm = (item || '').trim();
				if (norm && !seen.has(norm.toLowerCase())) {
					seen.add(norm.toLowerCase());
					defaults.push(norm);
				}
			});

			const smartTail = [];
			const smartMax = Math.max(0, parseInt(opts.extraTailMax, 10) || 2);
			(opts.extraTail || []).forEach((item) => {
				if (smartTail.length >= smartMax) return;
				const norm = (item || '').trim();
				if (norm && !seen.has(norm.toLowerCase())) {
					seen.add(norm.toLowerCase());
					smartTail.push(norm);
				}
			});

			const recentTail = [];
			const recents = this.getSiteRecents();

			if (this.settings.enableRecentlyUsed && recents[type] && recents[type].length) {
				recents[type].slice(0, 2).forEach((item) => {
					const norm = (item || '').trim();
					if (norm && !seen.has(norm.toLowerCase())) {
						seen.add(norm.toLowerCase());
						recentTail.push(norm);
					}
				});
			}

			const tail = smartTail.concat(recentTail);

			if (!maxCount) {
				return defaults.concat(tail);
			}

			const defaultTake = Math.max(0, maxCount - tail.length);
			return defaults.slice(0, defaultTake).concat(tail);
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

				if (message.action === 'quick-add-field') {
					this.openTypeCyclePanel();
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

		setupTypeCycleShortcuts: function() {
			if (this._typeCycleKeysBound) return;
			this._typeCycleKeysBound = true;

			window.addEventListener('message', (event) => {
				if (event.source !== window || !event.data || event.data.source !== 'acf-fa-bridge') return;
				if (event.data.action !== 'cycle-field-type') return;

				if (event.data.ok && event.data.type) {
					this.showTypeCycleToast(event.data.type);
					setTimeout(() => this.scanAndInit(), 250);
				} else if (event.data.error === 'no-field') {
					this.showTypeCycleToast('Open a field first (Add Field)', true);
				}
			});

			document.addEventListener('keydown', (e) => {
				if (!this.isFieldGroupEditorPage()) return;
				if (!this.settings.enableKeyboardShortcuts) return;

				const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
				const typing = tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable);

				if (this._cyclePanelOpen) {
					if (e.key === 'Escape') {
						e.preventDefault();
						this.closeTypeCyclePanel();
					}
					return;
				}

				// Alt+Shift+A → shortcut settings panel
				if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && (e.key === 'a' || e.key === 'A')) {
					e.preventDefault();
					this.openTypeCyclePanel();
					return;
				}

				if (typing && tag !== 'select') return;

				const letter = (e.key || '').toLowerCase();
				if (letter.length !== 1 || !/[a-z]/.test(letter)) return;

				const modifier = this.settings.typeCycleModifier || 'alt';
				const usingAlt = modifier === 'alt' && e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey;
				const usingCtrlShift = modifier === 'ctrlShift' && e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey;
				const usingShift = modifier === 'shift' && e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey;

				if (!usingAlt && !usingCtrlShift && !usingShift) return;

				const types = this.getTypeCycleForLetter(letter);
				if (!types.length) return;

				e.preventDefault();
				e.stopPropagation();
				this.cycleFieldType(types);
			}, true);
		},

		getTypeCycleForLetter: function(letter) {
			const maps = this.settings.typeCycles || DEFAULT_TYPE_CYCLES;
			const list = maps[letter];
			return Array.isArray(list) ? list.filter(Boolean) : [];
		},

		cycleFieldType: function(types) {
			window.postMessage({
				source: 'acf-fa',
				action: 'cycle-field-type',
				types: types
			}, '*');
		},

		showTypeCycleToast: function(typeOrMessage, isError) {
			let toast = document.querySelector('.acf-fa-cycle-toast');
			if (!toast) {
				toast = document.createElement('div');
				toast.className = 'acf-fa-cycle-toast';
				document.body.appendChild(toast);
			}

			const label = TYPE_LABELS[typeOrMessage] || typeOrMessage;
			toast.textContent = isError ? typeOrMessage : ('Field Type: ' + label);
			toast.classList.toggle('acf-fa-cycle-toast--error', !!isError);
			toast.classList.add('acf-fa-cycle-toast--show');

			clearTimeout(this._cycleToastTimer);
			this._cycleToastTimer = setTimeout(() => {
				toast.classList.remove('acf-fa-cycle-toast--show');
			}, 1400);
		},

		openTypeCyclePanel: function() {
			if (!this.isFieldGroupEditorPage()) return;

			let root = document.querySelector('.acf-fa-cycle-panel');
			if (!root) {
				root = document.createElement('div');
				root.className = 'acf-fa-cycle-panel';
				root.innerHTML = `
					<div class="acf-fa-cycle-panel__backdrop" data-acf-fa-close="1"></div>
					<div class="acf-fa-cycle-panel__card" role="dialog" aria-modal="true" aria-label="Field type cycle shortcuts">
						<div class="acf-fa-cycle-panel__header">
							<strong>Type Cycle Shortcuts</strong>
							<span>Default key = first letter of field type. Add Field → Alt+Letter → cycle.</span>
						</div>
						<div class="acf-fa-cycle-panel__note">
							Chrome blocks <kbd>Ctrl+T</kbd> / <kbd>Ctrl+R</kbd> (browser tabs). Use <kbd>Alt+Letter</kbd>, <kbd>Shift+Letter</kbd>, or <kbd>Ctrl+Shift+Letter</kbd>. Shortcuts are ignored while typing in inputs.
						</div>
						<label class="acf-fa-cycle-panel__modifier">
							<span>Modifier key</span>
							<select id="acf-fa-cycle-modifier">
								<option value="alt">Alt + Letter (recommended)</option>
								<option value="shift">Shift + Letter</option>
								<option value="ctrlShift">Ctrl + Shift + Letter</option>
							</select>
						</label>
						<div class="acf-fa-cycle-panel__list" id="acf-fa-cycle-list"></div>
						<div class="acf-fa-cycle-panel__actions">
							<button type="button" class="acf-fa-cycle-panel__btn acf-fa-cycle-panel__btn--primary" id="acf-fa-cycle-save">Save shortcuts</button>
							<button type="button" class="acf-fa-cycle-panel__btn" id="acf-fa-cycle-reset">Reset defaults</button>
							<button type="button" class="acf-fa-cycle-panel__btn" data-acf-fa-close="1">Close</button>
						</div>
					</div>
				`;
				document.body.appendChild(root);

				root.addEventListener('click', (e) => {
					if (e.target && e.target.getAttribute('data-acf-fa-close') === '1') {
						this.closeTypeCyclePanel();
					}
				});

				root.querySelector('#acf-fa-cycle-save').addEventListener('click', () => {
					this.saveTypeCyclePanel();
				});

				root.querySelector('#acf-fa-cycle-reset').addEventListener('click', () => {
					this.settings.typeCycles = Object.assign({}, DEFAULT_TYPE_CYCLES);
					this.settings.typeCycleModifier = 'alt';
					this.renderTypeCyclePanelRows();
					const mod = document.getElementById('acf-fa-cycle-modifier');
					if (mod) mod.value = 'alt';
				});
			}

			this._cyclePanelOpen = true;
			root.classList.add('acf-fa-cycle-panel--open');

			const mod = document.getElementById('acf-fa-cycle-modifier');
			if (mod) mod.value = this.settings.typeCycleModifier || 'alt';

			this.renderTypeCyclePanelRows();
		},

		closeTypeCyclePanel: function() {
			this._cyclePanelOpen = false;
			const root = document.querySelector('.acf-fa-cycle-panel');
			if (root) root.classList.remove('acf-fa-cycle-panel--open');
		},

		renderTypeCyclePanelRows: function() {
			const list = document.getElementById('acf-fa-cycle-list');
			if (!list) return;

			const cycles = this.settings.typeCycles || DEFAULT_TYPE_CYCLES;
			const letters = Object.keys(cycles).sort();

			list.innerHTML = letters.map((letter) => {
				const value = (cycles[letter] || []).join(', ');
				return `
					<label class="acf-fa-cycle-panel__row">
						<span class="acf-fa-cycle-panel__letter">${letter.toUpperCase()}</span>
						<input type="text" data-letter="${letter}" value="${value.replace(/"/g, '&quot;')}" placeholder="text, textarea, true_false" />
					</label>
				`;
			}).join('');
		},

		saveTypeCyclePanel: function() {
			const mod = document.getElementById('acf-fa-cycle-modifier');
			const nextCycles = {};

			document.querySelectorAll('#acf-fa-cycle-list input[data-letter]').forEach((input) => {
				const letter = input.getAttribute('data-letter');
				const types = String(input.value || '')
					.split(',')
					.map((part) => part.trim().toLowerCase().replace(/\s+/g, '_'))
					.filter(Boolean);
				if (letter && types.length) {
					nextCycles[letter] = types;
				}
			});

			this.settings.typeCycleModifier = mod ? mod.value : 'alt';
			this.settings.typeCycles = Object.assign({}, DEFAULT_TYPE_CYCLES, nextCycles);
			this.settings.settingsVersion = SETTINGS_VERSION;

			if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
				const payload = {};
				payload[SETTINGS_STORAGE_KEY] = this.settings;
				chrome.storage.sync.set(payload);
			}

			this.showTypeCycleToast('Shortcuts saved');
			this.closeTypeCyclePanel();
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
					this._recentStore = this.normalizeRecentStore(changes[RECENT_STORAGE_KEY].newValue);
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
			return !!input.closest('.acf-field-object, .acf-field-setting-label, #acf-field-group-fields');
		},

		setInputValue: function(input, value) {
			if (!input) return;

			const nextValue = value || '';
			const proto = input.tagName === 'TEXTAREA'
				? Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
				: Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');

			if (proto && proto.set) {
				proto.set.call(input, nextValue);
			} else {
				input.value = nextValue;
			}

			this.dispatchAcfInputEvents(input);
			this.syncAcfFieldHeader(input);
		},

		dispatchAcfInputEvents: function(input) {
			if (!input) return;

			const keyOpts = {
				bubbles: true,
				cancelable: true,
				key: 'Unidentified',
				code: '',
				keyCode: 0,
				which: 0
			};

			input.dispatchEvent(new Event('input', { bubbles: true }));
			input.dispatchEvent(new KeyboardEvent('keydown', keyOpts));
			input.dispatchEvent(new KeyboardEvent('keyup', keyOpts));
			input.dispatchEvent(new Event('change', { bubbles: true }));
			input.dispatchEvent(new Event('blur', { bubbles: true }));
		},

		getFieldObjectHandle: function(fieldObject) {
			if (!fieldObject) return null;
			return fieldObject.querySelector(':scope > .handle') ||
				fieldObject.querySelector(':scope > .acf-field-object-handle') ||
				fieldObject.querySelector('.handle');
		},

		syncAcfFieldHeader: function(input) {
			const fieldObject = input && input.closest('.acf-field-object');
			if (!fieldObject) return;

			const handle = this.getFieldObjectHandle(fieldObject);
			if (!handle) return;

			if (this.isLabelInput(input)) {
				const labelTarget = handle.querySelector('.li-field-label strong a.edit-field') ||
					handle.querySelector('.li-field-label strong a') ||
					handle.querySelector('.li-field-label strong') ||
					handle.querySelector('.li-field-label');

				if (labelTarget) {
					const rowOptions = labelTarget.querySelector && labelTarget.querySelector('.row-options');
					if (rowOptions) {
						const textNode = Array.from(labelTarget.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
						if (textNode) {
							textNode.textContent = input.value;
						}
					} else {
						labelTarget.textContent = input.value;
					}
				}

				fieldObject.setAttribute('data-label', input.value);
			}

			if (this.isNameInput(input)) {
				const nameLi = handle.querySelector('.li-field-name');
				if (nameLi) {
					const nameTarget = nameLi.querySelector('.copyable, .copy-field-name, span');
					if (nameTarget) {
						nameTarget.textContent = input.value;
					} else {
						nameLi.textContent = input.value;
					}
				}

				fieldObject.setAttribute('data-name', input.value);
			}
		},

		/**
		 * Scans the DOM for placeholder and label inputs and injects suggestions.
		 */
		scanAndInit: function() {
			if (!this.isFieldGroupEditorPage()) {
				this.removeInjectedUi();
				return;
			}

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
					self.updateActivePills(self.getSuggestionsWrapper(target, false), target.value);
				}

				if (self.isInstructionsInput(target)) {
					self.updateActivePills(self.getSuggestionsWrapper(target, false), target.value);
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

			// Rebuild type-based pills when Field Type changes (capture — Select2/jQuery safe)
			document.body.addEventListener('change', (e) => {
				const target = e.target;
				if (!target || target.tagName !== 'SELECT') return;

				const isType = (target.name && target.name.includes('[type]')) ||
					!!target.closest('.acf-field[data-name="type"], .acf-field-setting-type');

				if (isType) {
					const fieldObject = target.closest('.acf-field-object');
					if (fieldObject) {
						self.scheduleFieldTypeSuggestionRefresh(fieldObject);
					}
				}
			}, true);

			// Bridge (MAIN world) notifies when ACF/jQuery changes field type
			window.addEventListener('message', (event) => {
				if (event.source !== window || !event.data || event.data.source !== 'acf-fa-bridge') return;
				if (event.data.action !== 'field-type-changed') return;

				const fieldObject = self.findFieldObjectByKey(event.data.fieldKey) ||
					document.querySelector('.acf-field-object.open, .acf-field-object.acf-open');
				if (fieldObject) {
					self.scheduleFieldTypeSuggestionRefresh(fieldObject);
				}
			});

			// Fallback: ACF updates data-type on the field object
			if (!this._typeAttrObserver) {
				this._typeAttrObserver = new MutationObserver((mutations) => {
					mutations.forEach((mutation) => {
						if (mutation.type !== 'attributes' || mutation.attributeName !== 'data-type') return;
						const fieldObject = mutation.target;
						if (!fieldObject || !fieldObject.classList || !fieldObject.classList.contains('acf-field-object')) {
							return;
						}
						self.scheduleFieldTypeSuggestionRefresh(fieldObject);
					});
				});

				this._typeAttrObserver.observe(document.body, {
					attributes: true,
					attributeFilter: ['data-type'],
					subtree: true
				});
			}

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
			acf.addAction('prepare_field_object', rescan);
			acf.addAction('change_field_type', (field) => {
				const el = field && field.$el ? field.$el[0] : field;
				const fieldObject = el && el.closest ? el.closest('.acf-field-object') : el;
				setTimeout(() => this.refreshSuggestionsForFieldType(fieldObject), 100);
			});
		},

		isLabelInput: function(el) {
			return !!el && el.tagName === 'INPUT' && !!el.closest('.acf-field-object, .acf-field-setting-label, #acf-field-group-fields') && (
				(el.name && el.name.includes('[label]')) ||
				!!el.closest('.acf-field[data-name="label"], .acf-field-setting-label')
			);
		},

		isNameInput: function(el) {
			return !!el && el.tagName === 'INPUT' && !!el.closest('.acf-field-object, .acf-field-setting-name, #acf-field-group-fields') && (
				(el.name && el.name.includes('[name]')) ||
				!!el.closest('.acf-field[data-name="name"], .acf-field-setting-name')
			);
		},

		isPlaceholderInput: function(el) {
			return !!el && el.tagName === 'INPUT' && !!el.closest('.acf-field-object, .acf-field-setting-placeholder, #acf-field-group-fields') && (
				(el.name && el.name.includes('[placeholder]')) ||
				!!el.closest('.acf-field[data-name="placeholder"], .acf-field-setting-placeholder')
			);
		},

		isInstructionsInput: function(el) {
			return !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') && !!el.closest('.acf-field-object, .acf-field-setting-instructions, #acf-field-group-fields') && (
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
					if (mutation.addedNodes.length === 0) continue;

					for (const node of mutation.addedNodes) {
						if (node.nodeType !== Node.ELEMENT_NODE) continue;
						if (node.closest && node.closest('.acf-fa-suggestions-wrapper')) continue;
						if (node.classList && node.classList.contains('acf-fa-suggestions-wrapper')) continue;

						if (
							(node.classList && node.classList.contains('acf-field-object')) ||
							(node.querySelector && node.querySelector('.acf-field-object')) ||
							(node.querySelector && (
								node.querySelector('input[name*="[placeholder]"]') ||
								node.querySelector('.acf-field[data-name="placeholder"]') ||
								node.querySelector('input[name*="[label]"]') ||
								node.querySelector('.acf-field[data-name="label"]') ||
								node.querySelector('textarea[name*="[instructions]"]') ||
								node.querySelector('.acf-field[data-name="instructions"]')
							))
						) {
							shouldScan = true;
							break;
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
				subtree: true
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
			if (this._syncingNameFromLabel && this.isNameInput(target)) {
				return;
			}

			const fieldObject = this.getFieldObject(target);
			const labelOverride = this.isLabelInput(target) ? target.value : undefined;

			if (this.isLabelInput(target)) {
				const wrapper = this.getSuggestionsWrapper(target, false);
				this.updateActivePills(wrapper, target.value);
				this.queueNestedLabelRefresh(fieldObject);
			}

			this.refreshPlaceholderSuggestions(fieldObject, labelOverride, target);
		},

		queueNestedLabelRefresh: function(fieldObject) {
			if (!fieldObject) return;

			if (fieldObject._acfFaChildTimer) {
				clearTimeout(fieldObject._acfFaChildTimer);
			}

			fieldObject._acfFaChildTimer = setTimeout(() => {
				fieldObject.querySelectorAll('.acf-field-object').forEach((child) => {
					const childLabel = this.findFieldSettingInput(child, 'label');
					if (childLabel && this.settings.enableLabelSuggestions) {
						this.injectLabelSuggestions(childLabel, true);
					}
				});
			}, 350);
		},

		findFieldObjectByKey: function(fieldKey) {
			if (!fieldKey || fieldKey === 'acfcloneindex') return null;
			return document.querySelector(
				`.acf-field-object[data-key="${fieldKey}"], .acf-field-object[data-id="${fieldKey}"]`
			);
		},

		scheduleFieldTypeSuggestionRefresh: function(fieldObject) {
			if (!fieldObject) return;

			const key = fieldObject.getAttribute('data-key') ||
				fieldObject.getAttribute('data-id') ||
				'anon';

			if (!this._typeRefreshTimers) {
				this._typeRefreshTimers = {};
			}

			if (this._typeRefreshTimers[key]) {
				clearTimeout(this._typeRefreshTimers[key]);
			}

			// ACF rewrites settings DOM after type change — refresh twice
			this._typeRefreshTimers[key] = setTimeout(() => {
				this.refreshSuggestionsForFieldType(fieldObject);
				setTimeout(() => this.refreshSuggestionsForFieldType(fieldObject), 200);
			}, 80);
		},

		refreshSuggestionsForFieldType: function(fieldObject) {
			if (!fieldObject || !fieldObject.isConnected) return;

			const labelInput = this.findFieldSettingInput(fieldObject, 'label');
			if (labelInput && this.settings.enableLabelSuggestions) {
				const wrapper = this.getSuggestionsWrapper(labelInput, false);
				if (wrapper) {
					delete wrapper.dataset.acfFaType;
					delete wrapper.dataset.acfFaSig;
				}
				this.injectLabelSuggestions(labelInput, true);
			}

			const instructionsInput = this.findFieldSettingInput(fieldObject, 'instructions');
			if (instructionsInput && this.settings.enableInstructionsSuggestions) {
				this.injectInstructionsSuggestions(instructionsInput, true);
			}

			this.refreshPlaceholderSuggestions(
				fieldObject,
				labelInput ? labelInput.value : undefined,
				labelInput
			);

			if (this.settings.enableRecommendedSetup) {
				this.injectApplySetupButton(fieldObject, labelInput);
			}
		},

		syncFieldNameFromLabel: function(labelInput, labelValue) {
			const slug = this.slugify(labelValue);
			if (!slug || !labelInput) return;

			const applyName = () => {
				const fieldKey = this.getFieldKeyFromInput(labelInput);
				const fieldObject = this.getFieldObject(labelInput);
				let nameInput = fieldKey ? this.findSettingInputByFieldKey(fieldKey, 'name') : null;

				if (fieldObject) {
					nameInput = nameInput || this.findFieldSettingInput(fieldObject, 'name');
				}

				if (nameInput) {
					this.setInputValue(nameInput, slug);
				}
			};

			this._syncingNameFromLabel = true;
			applyName();
			setTimeout(() => {
				applyName();
				this._syncingNameFromLabel = false;
			}, 150);
		},

		updateActivePills: function(wrapper, currentValue) {
			if (!wrapper) return;

			wrapper.querySelectorAll('.acf-fa-suggestion-pill:not(.acf-fa-apply-setup-btn)').forEach((pill) => {
				pill.classList.toggle('acf-fa-suggestion-pill--active', pill.textContent === currentValue);
			});
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

			// Rule 1: Label-first suggestions (tone from settings)
			if (cleanLabel.length > 0) {
				suggestions.push.apply(suggestions, this.buildLabelPlaceholders(cleanLabel));
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

			return this.mergeRecentSuggestions(finalSuggestions, 'placeholder', 4);
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

		buildLabelPlaceholders: function(label) {
			const raw = (label || '').trim();
			if (!raw) return [];

			const lower = raw.toLowerCase();
			const titled = raw.charAt(0).toUpperCase() + raw.slice(1);
			const tone = this.settings.placeholderTone || DEFAULT_SETTINGS.placeholderTone;

			if (tone === 'ellipsis') {
				return [`${titled}...`, `Your ${lower}...`, `Add ${lower}...`];
			}

			if (tone === 'short') {
				return [titled, `Your ${lower}`, `${titled} here`];
			}

			return [
				`Enter your ${lower}`,
				`Write your ${lower}`,
				`Add a ${lower}`,
				`Type your ${lower}`
			];
		},

		getParentFieldContext: function(input) {
			const fieldObject = this.getFieldObject(input);
			if (!fieldObject || !fieldObject.parentElement) return null;

			const parent = fieldObject.parentElement.closest('.acf-field-object');
			if (!parent || parent === fieldObject) return null;

			const parentLabel = this.findFieldSettingInput(parent, 'label');
			const parentName = this.findFieldSettingInput(parent, 'name');
			const parentType = this.findFieldSettingInput(parent, 'type');

			return {
				label: parentLabel ? parentLabel.value : '',
				name: parentName ? parentName.value : '',
				type: parentType ? this.normalizeFieldType(parentType.value) : ''
			};
		},

		getParentContextKey: function(input) {
			const parent = this.getParentFieldContext(input);
			if (!parent) return '';
			return this.slugify((parent.label || '') + ' ' + (parent.name || '') + ' ' + (parent.type || ''));
		},

		getContextChildLabels: function(parentText) {
			const haystack = (parentText || '').toLowerCase();
			if (!haystack) return [];

			for (const group of REPEATER_CHILD_LABELS) {
				if (group.match.some((keyword) => haystack.includes(keyword))) {
					return group.labels.slice();
				}
			}

			return [];
		},

		/**
		 * Matches casing of a replacement word to a sample word.
		 *
		 * @param {string} sample
		 * @param {string} next
		 * @returns {string}
		 */
		matchWordCase: function(sample, next) {
			if (!sample || !next) return next || '';
			if (sample === sample.toUpperCase()) return next.toUpperCase();
			if (sample[0] === sample[0].toUpperCase()) {
				return next.charAt(0).toUpperCase() + next.slice(1);
			}
			return next.toLowerCase();
		},

		/**
		 * Singularizes a single English word (best-effort for field labels).
		 *
		 * @param {string} word
		 * @returns {string}
		 */
		singularizeWord: function(word) {
			const raw = (word || '').trim();
			if (!raw) return '';

			const lower = raw.toLowerCase();
			const irregular = {
				people: 'person',
				men: 'man',
				women: 'woman',
				children: 'child',
				faqs: 'faq',
				feet: 'foot',
				teeth: 'tooth',
				media: 'media',
				data: 'data',
				series: 'series',
				news: 'news'
			};

			if (irregular[lower]) {
				return this.matchWordCase(raw, irregular[lower]);
			}

			if (lower.endsWith('ies') && lower.length > 4) {
				return this.matchWordCase(raw, lower.slice(0, -3) + 'y');
			}

			if (/(ses|xes|zes|ches|shes)$/.test(lower) && lower.length > 4) {
				return this.matchWordCase(raw, lower.slice(0, -2));
			}

			if (lower.endsWith('ves') && lower.length > 4) {
				return this.matchWordCase(raw, lower.slice(0, -3) + 'f');
			}

			if (
				lower.endsWith('s') &&
				!lower.endsWith('ss') &&
				!lower.endsWith('us') &&
				!lower.endsWith('is') &&
				lower.length > 2
			) {
				return this.matchWordCase(raw, lower.slice(0, -1));
			}

			return raw;
		},

		/**
		 * Singularizes a multi-word field label. Already-singular labels stay the same.
		 * e.g. "Team Members" → "Team Member", "Feature" → "Feature"
		 *
		 * @param {string} label
		 * @returns {string}
		 */
		singularizeLabel: function(label) {
			const trimmed = (label || '').trim().replace(/\s+/g, ' ');
			if (!trimmed) return '';

			const words = trimmed.split(' ');
			words[words.length - 1] = this.singularizeWord(words[words.length - 1]);
			return words.join(' ');
		},

		/**
		 * Accordion labels from parent repeater / group (singular parent text).
		 *
		 * @param {{ label?: string, name?: string, type?: string }|null} parent
		 * @returns {Array<string>}
		 */
		getAccordionParentLabels: function(parent) {
			if (!parent || !['repeater', 'group', 'flexible_content'].includes(parent.type)) {
				return [];
			}

			let source = (parent.label || '').trim();
			if (!source && parent.name) {
				source = parent.name
					.replace(/[-_]+/g, ' ')
					.replace(/\s+/g, ' ')
					.trim()
					.replace(/\b\w/g, (ch) => ch.toUpperCase());
			}

			if (!source) return [];

			const singular = this.singularizeLabel(source);
			if (!singular) return [];

			return [singular];
		},

		/**
		 * Generates field label suggestions based on the active field type
		 * and parent repeater / flexible / group context.
		 *
		 * @param {string} type - The active field type.
		 * @param {HTMLInputElement} [labelInput]
		 * @returns {Array} List of string label suggestions.
		 */
		generateLabelSuggestions: function(type, labelInput) {
			const cleanType = this.normalizeFieldType(type);
			const expandedTypes = ['repeater', 'flexible_content'];
			let suggestions = FIELD_LABEL_SUGGESTIONS[cleanType] || FIELD_LABEL_SUGGESTIONS._default;
			const maxCount = expandedTypes.includes(cleanType)
				? Math.min(10, this.getMaxSuggestions() + 4)
				: this.getMaxSuggestions();

			if (expandedTypes.includes(cleanType)) {
				suggestions = [...suggestions].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
			}

			const parent = this.getParentFieldContext(labelInput);
			let smartTail = [];

			// Accordion inside repeater/group → singular parent label first
			if (cleanType === 'accordion' && parent) {
				const accordionFromParent = this.getAccordionParentLabels(parent);
				if (accordionFromParent.length) {
					const seen = new Set(accordionFromParent.map((item) => item.toLowerCase()));
					const defaults = (suggestions || []).filter((item) => {
						const norm = (item || '').trim();
						return norm && !seen.has(norm.toLowerCase());
					});
					suggestions = accordionFromParent.concat(defaults);
				}
			} else if (!expandedTypes.includes(cleanType)) {
				// Smart repeater/group child labels go at the end — defaults stay first
				const parentText = parent ? `${parent.label} ${parent.name}` : '';
				smartTail = this.getContextChildLabels(parentText);
			}

			return this.mergeRecentSuggestions(suggestions, 'label', maxCount, {
				extraTail: smartTail,
				extraTailMax: 2
			});
		},

		generateInstructionSuggestions: function(type) {
			const cleanType = this.normalizeFieldType(type);

			if (!this.supportsInstructions(cleanType)) {
				return [];
			}

			const suggestions = FIELD_INSTRUCTIONS_SUGGESTIONS[cleanType] || [];
			return this.mergeRecentSuggestions(suggestions, 'instructions', this.getMaxSuggestions());
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
			const signature = suggestionsList.join('\u0001');

			if (wrapper.dataset.acfFaSig === signature && wrapper.querySelector('.acf-fa-suggestion-pill')) {
				this.updateActivePills(wrapper, targetInput.value);
				return;
			}

			const preservedSetup = wrapper.querySelector('.acf-fa-apply-setup-btn');
			const preservedUndo = wrapper.querySelector('.acf-fa-undo-setup-btn');
			wrapper.innerHTML = '';
			wrapper.dataset.acfFaSig = signature;

			if (suggestionsList.length === 0) {
				if (preservedSetup) {
					wrapper.appendChild(preservedSetup);
				}
				if (preservedUndo) {
					wrapper.appendChild(preservedUndo);
				}
				return;
			}

			const labelSpan = document.createElement('span');
			labelSpan.className = 'acf-fa-suggestions-label';
			labelSpan.textContent = 'Suggestions:';
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

					this.setInputValue(targetInput, sugText);

					if (opts.suggestionType) {
						this.saveRecentSuggestion(opts.suggestionType, sugText);
					}

					if (typeof opts.onSelect === 'function') {
						opts.onSelect.call(this, targetInput, sugText);
					}

					this.updateActivePills(wrapper, sugText);
				});

				wrapper.appendChild(pill);
			});

			if (preservedSetup) {
				wrapper.appendChild(preservedSetup);
			}

			if (preservedUndo) {
				wrapper.appendChild(preservedUndo);
			}
		},

		/**
		 * Injects suggestion pills under a specific placeholder input.
		 *
		 * @param {HTMLInputElement} placeholderInput - The target placeholder input element.
		 */
		injectSuggestions: function(placeholderInput, contextOverride) {
			if (!this.isFieldGroupEditorPage() || !this.settings.enablePlaceholderSuggestions || !placeholderInput) return;

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
			this.renderSuggestionPills(wrapper, placeholderInput, suggestionsList, null, {
				suggestionType: 'placeholder',
				recentLabel: this.settings.enableRecentlyUsed && this.getSiteRecents().placeholder.length > 0
			});
		},

		/**
		 * Injects suggestion pills under a specific field label input.
		 *
		 * @param {HTMLInputElement} labelInput - The target field label input element.
		 */
		injectLabelSuggestions: function(labelInput, force) {
			if (!this.isFieldGroupEditorPage() || !this.settings.enableLabelSuggestions || !labelInput) return;

			const wrapper = this.getSuggestionsWrapper(labelInput, true);
			if (!wrapper) return;

			const type = this.getFieldTypeForInput(labelInput);
			const typeKey = this.normalizeFieldType(type) + '|' + this.getParentContextKey(labelInput);

			if (!force && wrapper.dataset.acfFaType === typeKey && wrapper.querySelector('.acf-fa-suggestion-pill')) {
				this.updateActivePills(wrapper, labelInput.value);
				return;
			}

			if (force) {
				delete wrapper.dataset.acfFaSig;
			}

			wrapper.dataset.acfFaType = typeKey;
			const suggestionsList = this.generateLabelSuggestions(type, labelInput);

			this.renderSuggestionPills(
				wrapper,
				labelInput,
				suggestionsList,
				null,
				{
					suggestionType: 'label',
					recentLabel: this.settings.enableRecentlyUsed && this.getSiteRecents().label.length > 0,
					onSelect: function(selectedLabelInput, sugText) {
						this.syncFieldNameFromLabel(selectedLabelInput, sugText);
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

		injectInstructionsSuggestions: function(instructionsInput, force) {
			if (!this.isFieldGroupEditorPage() || !this.settings.enableInstructionsSuggestions || !instructionsInput) return;

			const type = this.getFieldTypeForInput(instructionsInput);

			if (!this.supportsInstructions(type)) {
				this.removeInstructionsSuggestions(instructionsInput);
				return;
			}

			const wrapper = this.getSuggestionsWrapper(instructionsInput, true);
			if (!wrapper) return;

			const typeKey = this.normalizeFieldType(type);
			if (!force && wrapper.dataset.acfFaType === typeKey && wrapper.querySelector('.acf-fa-suggestion-pill')) {
				this.updateActivePills(wrapper, instructionsInput.value);
				return;
			}

			if (force) {
				delete wrapper.dataset.acfFaSig;
			}

			wrapper.dataset.acfFaType = typeKey;
			const suggestionsList = this.generateInstructionSuggestions(type);

			this.renderSuggestionPills(
				wrapper,
				instructionsInput,
				suggestionsList,
				null,
				{
					suggestionType: 'instructions',
					recentLabel: this.settings.enableRecentlyUsed && this.getSiteRecents().instructions.length > 0
				}
			);
		},

		injectApplySetupButton: function(fieldObject, labelInput) {
			if (!this.settings.enableRecommendedSetup || !fieldObject) return;

			const labelInputEl = labelInput || this.findFieldSettingInput(fieldObject, 'label');
			if (!labelInputEl) return;

			const inputWrap = labelInputEl.closest('.acf-input') || labelInputEl.parentNode;
			if (!inputWrap) return;

			inputWrap.querySelectorAll('.acf-fa-apply-setup-wrapper').forEach((wrapper) => {
				const btn = wrapper.querySelector('.acf-fa-apply-setup-btn');
				if (btn) {
					wrapper.parentNode.insertBefore(btn, wrapper);
				}
				wrapper.remove();
			});

			const suggestionsWrapper = this.getSuggestionsWrapper(labelInputEl, false);
			const host = suggestionsWrapper || inputWrap;
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

			host.appendChild(setupBtn);
			setupBtn.style.display = hasSetup ? 'inline-block' : 'none';

			let undoBtn = inputWrap.querySelector('.acf-fa-undo-setup-btn');
			if (!undoBtn) {
				undoBtn = document.createElement('button');
				undoBtn.type = 'button';
				undoBtn.className = 'acf-fa-suggestion-pill acf-fa-undo-setup-btn';
				undoBtn.textContent = 'Undo';
				undoBtn.title = 'Restore previous field values';
				undoBtn.style.display = 'none';
				undoBtn.addEventListener('click', (e) => {
					e.preventDefault();
					e.stopPropagation();
					this.undoRecommendedSetup(fieldObject);
				});
			}

			host.appendChild(undoBtn);
		},

		snapshotFieldValues: function(fieldObject) {
			const read = (settingName) => {
				const input = this.findFieldSettingInput(fieldObject, settingName);
				return input ? input.value : '';
			};

			return {
				label: read('label'),
				name: read('name'),
				placeholder: read('placeholder'),
				instructions: read('instructions')
			};
		},

		restoreFieldSnapshot: function(fieldObject, snapshot) {
			if (!snapshot) return;

			this.setInputValue(this.findFieldSettingInput(fieldObject, 'label'), snapshot.label);
			this.setInputValue(this.findFieldSettingInput(fieldObject, 'name'), snapshot.name);
			this.setInputValue(this.findFieldSettingInput(fieldObject, 'placeholder'), snapshot.placeholder);
			this.setInputValue(this.findFieldSettingInput(fieldObject, 'instructions'), snapshot.instructions);
		},

		showUndoSetupButton: function(fieldObject) {
			const labelInput = this.findFieldSettingInput(fieldObject, 'label');
			if (!labelInput) return;

			const host = this.getSuggestionsWrapper(labelInput, false) ||
				labelInput.closest('.acf-input') ||
				labelInput.parentNode;
			const undoBtn = host && host.querySelector('.acf-fa-undo-setup-btn');
			if (!undoBtn) return;

			undoBtn.style.display = 'inline-block';

			if (fieldObject._acfFaUndoTimer) {
				clearTimeout(fieldObject._acfFaUndoTimer);
			}

			fieldObject._acfFaUndoTimer = setTimeout(() => {
				undoBtn.style.display = 'none';
				fieldObject._acfFaUndo = null;
			}, 12000);
		},

		hideUndoSetupButton: function(fieldObject) {
			const labelInput = this.findFieldSettingInput(fieldObject, 'label');
			if (!labelInput) return;

			const host = this.getSuggestionsWrapper(labelInput, false) ||
				labelInput.closest('.acf-input') ||
				labelInput.parentNode;
			const undoBtn = host && host.querySelector('.acf-fa-undo-setup-btn');
			if (undoBtn) {
				undoBtn.style.display = 'none';
			}

			if (fieldObject._acfFaUndoTimer) {
				clearTimeout(fieldObject._acfFaUndoTimer);
				fieldObject._acfFaUndoTimer = null;
			}

			fieldObject._acfFaUndo = null;
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

			fieldObject._acfFaUndo = this.snapshotFieldValues(fieldObject);

			this.setInputValue(labelInput, setup.label);
			this.setInputValue(nameInput, setup.name || this.slugify(setup.label));

			let placeholder = setup.placeholder;
			if (placeholder && setup.label && /^(enter|write|add|type)\b/i.test(placeholder)) {
				placeholder = this.buildLabelPlaceholders(setup.label)[0] || placeholder;
			}

			if (placeholderInput && placeholder) {
				this.setInputValue(placeholderInput, placeholder);
			}

			if (instructionsInput && setup.instructions && this.supportsInstructions(cleanType)) {
				this.setInputValue(instructionsInput, setup.instructions);
			}

			this.showUndoSetupButton(fieldObject);

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
		},

		undoRecommendedSetup: function(fieldObject) {
			const snapshot = fieldObject && fieldObject._acfFaUndo;
			if (!snapshot) return;

			this.restoreFieldSnapshot(fieldObject, snapshot);
			this.hideUndoSetupButton(fieldObject);

			const labelInput = this.findFieldSettingInput(fieldObject, 'label');
			const placeholderInput = this.findFieldSettingInput(fieldObject, 'placeholder');
			const instructionsInput = this.findFieldSettingInput(fieldObject, 'instructions');

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
