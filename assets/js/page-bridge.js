/**
 * Runs in the page (MAIN) world so we can talk to ACF/jQuery.
 * Receives field-type requests from the isolated content script via postMessage.
 */
(function() {
	'use strict';

	if (window.__acfFaBridgeReady) return;
	window.__acfFaBridgeReady = true;

	const getVisibleFieldObjects = () => {
		return Array.from(document.querySelectorAll('.acf-field-object')).filter((el) => {
			return !el.classList.contains('acf-clone') &&
				el.getAttribute('data-key') !== 'acfcloneindex' &&
				!el.classList.contains('acf-hidden') &&
				el.offsetParent !== null;
		});
	};

	const getTargetField = () => {
		const open = document.querySelector(
			'.acf-field-object.open:not(.acf-clone), .acf-field-object.acf-open:not(.acf-clone)'
		);
		if (open) return open;

		const active = document.activeElement;
		if (active) {
			const fromFocus = active.closest('.acf-field-object');
			if (fromFocus && !fromFocus.classList.contains('acf-clone')) {
				return fromFocus;
			}
		}

		const fields = getVisibleFieldObjects();
		return fields.length ? fields[fields.length - 1] : null;
	};

	const setFieldType = (fieldEl, type) => {
		if (!fieldEl || !type || !window.jQuery) return false;

		const $field = window.jQuery(fieldEl);
		const $select = $field.find('select[name*="[type]"]').first();
		if (!$select.length) return false;

		// Expand field so ACF type UI is ready
		if (!$field.hasClass('open') && !$field.hasClass('acf-open')) {
			const $edit = $field.find('a.edit-field').first();
			if ($edit.length) {
				$edit.trigger('click');
			}
		}

		const optionExists = $select.find('option').filter(function() {
			return String(this.value) === String(type);
		}).length > 0;

		if (!optionExists) return false;

		$select.val(type).trigger('change');
		return true;
	};

	const getCurrentType = (fieldEl) => {
		if (!fieldEl) return '';
		const select = fieldEl.querySelector('select[name*="[type]"]');
		return select ? select.value : (fieldEl.getAttribute('data-type') || '');
	};

	/**
	 * Notify isolated content script that a field type changed.
	 * ACF/jQuery live in MAIN world — content.js cannot hear acf.addAction.
	 */
	const notifyTypeChanged = (fieldEl, type) => {
		if (!fieldEl || fieldEl.classList.contains('acf-clone')) return;

		window.postMessage({
			source: 'acf-fa-bridge',
			action: 'field-type-changed',
			type: type || getCurrentType(fieldEl) || '',
			fieldKey: fieldEl.getAttribute('data-key') || fieldEl.getAttribute('data-id') || ''
		}, '*');
	};

	const bindTypeChangeWatchers = () => {
		if (window.__acfFaTypeWatchBound) return;
		window.__acfFaTypeWatchBound = true;

		if (window.jQuery) {
			window.jQuery(document).on(
				'change',
				'.acf-field-object select[name*="[type]"], .acf-field-setting-type select',
				function() {
					const fieldEl = this.closest('.acf-field-object');
					notifyTypeChanged(fieldEl, this.value);
				}
			);
		}

		document.addEventListener('change', (event) => {
			const target = event.target;
			if (!target || target.tagName !== 'SELECT') return;

			const name = target.getAttribute('name') || '';
			const isType = name.includes('[type]') ||
				!!target.closest('.acf-field[data-name="type"], .acf-field-setting-type');
			if (!isType) return;

			notifyTypeChanged(target.closest('.acf-field-object'), target.value);
		}, true);

		const tryBindAcf = () => {
			if (!window.acf || !window.acf.addAction || window.__acfFaAcfTypeBound) return;
			window.__acfFaAcfTypeBound = true;

			window.acf.addAction('change_field_type', (field) => {
				const el = field && field.$el ? field.$el[0] : field;
				const fieldEl = el && el.closest ? (el.closest('.acf-field-object') || el) : el;
				const type = field && field.get ? field.get('type') : getCurrentType(fieldEl);
				notifyTypeChanged(fieldEl, type);
			});
		};

		tryBindAcf();
		if (!window.__acfFaAcfTypeBound) {
			const acfWait = window.setInterval(() => {
				tryBindAcf();
				if (window.__acfFaAcfTypeBound) {
					window.clearInterval(acfWait);
				}
			}, 300);
			window.setTimeout(() => window.clearInterval(acfWait), 15000);
		}
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', bindTypeChangeWatchers);
	} else {
		bindTypeChangeWatchers();
	}

	window.addEventListener('message', (event) => {
		if (event.source !== window || !event.data || event.data.source !== 'acf-fa') return;

		if (event.data.action === 'cycle-field-type') {
			const types = Array.isArray(event.data.types) ? event.data.types : [];
			const fieldEl = getTargetField();

			if (!fieldEl || !types.length) {
				window.postMessage({
					source: 'acf-fa-bridge',
					ok: false,
					error: fieldEl ? 'no-types' : 'no-field',
					action: 'cycle-field-type'
				}, '*');
				return;
			}

			const current = getCurrentType(fieldEl);
			let index = types.indexOf(current);
			if (index === -1) {
				index = 0;
			} else {
				index = (index + 1) % types.length;
			}

			const nextType = types[index];
			const ok = setFieldType(fieldEl, nextType);

			window.postMessage({
				source: 'acf-fa-bridge',
				ok: ok,
				action: 'cycle-field-type',
				type: nextType,
				error: ok ? null : 'type-set-failed'
			}, '*');
		}
	});
})();
