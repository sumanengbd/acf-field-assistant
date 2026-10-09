/**
 * ACF Field Assistant - Extension Popup Controller
 */

const SETTINGS_STORAGE_KEY = 'acfFaSettings';
const RECENT_STORAGE_KEY = 'acfFaRecentSuggestions';

const DEFAULT_SETTINGS = {
	settingsVersion: 3,
	enableLabelSuggestions: true,
	enablePlaceholderSuggestions: true,
	enableInstructionsSuggestions: true,
	enableRecommendedSetup: true,
	enableRecentlyUsed: true,
	enableKeyboardShortcuts: true,
	maxSuggestions: 4,
	placeholderTone: 'enter_your'
};

const SETTINGS_VERSION = DEFAULT_SETTINGS.settingsVersion;

const migrateStoredSettings = (stored) => {
	const settings = Object.assign({}, DEFAULT_SETTINGS, stored || {});
	let changed = false;
	const storedVersion = stored && stored.settingsVersion ? stored.settingsVersion : 1;

	if (storedVersion < 2) {
		if (!stored || stored.maxSuggestions === undefined || stored.maxSuggestions === 6) {
			settings.maxSuggestions = DEFAULT_SETTINGS.maxSuggestions;
		}
	}

	if (storedVersion < SETTINGS_VERSION) {
		settings.settingsVersion = SETTINGS_VERSION;
		changed = true;
	}

	return { settings, changed };
};

const escapeHtml = (text) => {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
};

const formatInlineMarkdown = (text) => {
	return escapeHtml(text)
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/`(.+?)`/g, '<code>$1</code>');
};

const renderChangelogMarkdown = (markdown) => {
	const lines = markdown.split('\n');
	let html = '';
	let inList = false;

	const closeList = () => {
		if (inList) {
			html += '</ul>';
			inList = false;
		}
	};

	lines.forEach((line) => {
		const trimmed = line.trim();

		if (trimmed.startsWith('## ')) {
			closeList();
			html += `<h2>${formatInlineMarkdown(trimmed.slice(3))}</h2>`;
		} else if (trimmed.startsWith('### ')) {
			closeList();
			html += `<h3>${formatInlineMarkdown(trimmed.slice(4))}</h3>`;
		} else if (trimmed.startsWith('- ')) {
			if (!inList) {
				html += '<ul>';
				inList = true;
			}
			html += `<li>${formatInlineMarkdown(trimmed.slice(2))}</li>`;
		} else if (trimmed === '---') {
			closeList();
			html += '<hr>';
		} else if (trimmed.startsWith('# ')) {
			closeList();
			html += `<h1>${formatInlineMarkdown(trimmed.slice(2))}</h1>`;
		} else if (trimmed) {
			closeList();
			html += `<p>${formatInlineMarkdown(trimmed)}</p>`;
		}
	});

	closeList();
	return html;
};

const loadChangelog = () => {
	const container = document.getElementById('changelog-content');
	if (!container) return;

	fetch(chrome.runtime.getURL('CHANGELOG.md'))
		.then((response) => {
			if (!response.ok) throw new Error('Failed to load changelog');
			return response.text();
		})
		.then((markdown) => {
			container.innerHTML = renderChangelogMarkdown(markdown);
		})
		.catch(() => {
			container.innerHTML = '<p class="changelog-error">Could not load changelog.</p>';
		});
};

document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('settings-form');
	const saveStatus = document.getElementById('save-status');

	const fields = {
		enableLabelSuggestions: document.getElementById('enable-label'),
		enablePlaceholderSuggestions: document.getElementById('enable-placeholder'),
		enableInstructionsSuggestions: document.getElementById('enable-instructions'),
		enableRecommendedSetup: document.getElementById('enable-setup'),
		enableRecentlyUsed: document.getElementById('enable-recent'),
		enableKeyboardShortcuts: document.getElementById('enable-shortcuts'),
		maxSuggestions: document.getElementById('max-suggestions'),
		placeholderTone: document.getElementById('placeholder-tone')
	};

	const tabButtons = document.querySelectorAll('.tab-btn');
	const tabPanels = document.querySelectorAll('.tab-panel');

	const switchTab = (tabName) => {
		tabButtons.forEach((btn) => {
			const isActive = btn.dataset.tab === tabName;
			btn.classList.toggle('tab-btn--active', isActive);
			btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
		});

		tabPanels.forEach((panel) => {
			const isActive = panel.id === `panel-${tabName}`;
			panel.classList.toggle('tab-panel--active', isActive);
			panel.hidden = !isActive;
		});
	};

	tabButtons.forEach((btn) => {
		btn.addEventListener('click', () => {
			switchTab(btn.dataset.tab);
		});
	});

	const loadSettings = () => {
		chrome.storage.sync.get(SETTINGS_STORAGE_KEY, (result) => {
			const migrated = migrateStoredSettings(result[SETTINGS_STORAGE_KEY] || {});
			const settings = migrated.settings;

			if (migrated.changed) {
				const payload = {};
				payload[SETTINGS_STORAGE_KEY] = settings;
				chrome.storage.sync.set(payload);
			}

			Object.keys(fields).forEach((key) => {
				const el = fields[key];
				if (!el) return;

				if (el.type === 'checkbox') {
					el.checked = !!settings[key];
				} else {
					el.value = String(settings[key]);
				}
			});
		});
	};

	const saveSettings = () => {
		const settings = {
			settingsVersion: SETTINGS_VERSION
		};

		Object.keys(fields).forEach((key) => {
			const el = fields[key];
			if (!el) return;

			if (el.type === 'checkbox') {
				settings[key] = el.checked;
			} else if (key === 'placeholderTone') {
				settings[key] = el.value || DEFAULT_SETTINGS.placeholderTone;
			} else {
				settings[key] = parseInt(el.value, 10) || DEFAULT_SETTINGS[key];
			}
		});

		const payload = {};
		payload[SETTINGS_STORAGE_KEY] = settings;

		chrome.storage.sync.set(payload, () => {
			if (saveStatus) {
				saveStatus.textContent = 'Saved!';
				setTimeout(() => { saveStatus.textContent = ''; }, 1500);
			}

			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const tab = tabs && tabs[0];
				if (tab && tab.id) {
					chrome.tabs.sendMessage(tab.id, { action: 'settings-updated' });
				}
			});
		});
	};

	if (form) {
		form.addEventListener('change', saveSettings);
	}

	const clearDataBtn = document.getElementById('clear-data-btn');
	const applyDefaultsToForm = () => {
		Object.keys(fields).forEach((key) => {
			const el = fields[key];
			if (!el) return;

			if (el.type === 'checkbox') {
				el.checked = !!DEFAULT_SETTINGS[key];
			} else {
				el.value = String(DEFAULT_SETTINGS[key]);
			}
		});
	};

	const clearSavedData = () => {
		const confirmed = window.confirm(
			'Clear all ACF Field Assistant saved data?\n\nThis resets settings to defaults and removes recent suggestions.'
		);
		if (!confirmed) return;

		const defaults = Object.assign({}, DEFAULT_SETTINGS);
		const syncPayload = {};
		syncPayload[SETTINGS_STORAGE_KEY] = defaults;

		const finish = () => {
			applyDefaultsToForm();
			if (saveStatus) {
				saveStatus.textContent = 'Data cleared';
				setTimeout(() => { saveStatus.textContent = ''; }, 2000);
			}

			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const tab = tabs && tabs[0];
				if (tab && tab.id) {
					chrome.tabs.sendMessage(tab.id, { action: 'settings-updated' });
				}
			});
		};

		chrome.storage.sync.set(syncPayload, () => {
			chrome.storage.local.remove(RECENT_STORAGE_KEY, finish);
		});
	};

	if (clearDataBtn) {
		clearDataBtn.addEventListener('click', clearSavedData);
	}

	loadSettings();
	loadChangelog();

	document.querySelectorAll('a').forEach(link => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			if (link.href) {
				chrome.tabs.create({ url: link.href });
			}
		});
	});
});
