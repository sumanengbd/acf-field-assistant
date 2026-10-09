/**
 * ACF Field Assistant - Background Service Worker
 * Handles keyboard shortcut commands and relays them to the active tab.
 */

const COMMAND_TARGETS = {
	'focus-label': 'label',
	'focus-placeholder': 'placeholder',
	'focus-instructions': 'instructions'
};

chrome.commands.onCommand.addListener((command) => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const tab = tabs && tabs[0];
		if (!tab || !tab.id) return;

		if (command === 'quick-add-field') {
			chrome.tabs.sendMessage(tab.id, { action: 'quick-add-field' });
			return;
		}

		const target = COMMAND_TARGETS[command];
		if (!target) return;

		chrome.tabs.sendMessage(tab.id, {
			action: 'focus-suggestions',
			target: target
		});
	});
});
