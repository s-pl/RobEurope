import '@testing-library/jest-dom';

// Ensure a minimal localStorage mock is available in the test environment
if (typeof window !== 'undefined') {
	if (!window.localStorage || typeof window.localStorage.getItem !== 'function') {
		const _store = new Map();
		window.localStorage = {
			getItem: (k) => {
				const v = _store.get(String(k));
				return v === undefined ? null : v;
			},
			setItem: (k, v) => _store.set(String(k), String(v)),
			removeItem: (k) => _store.delete(String(k)),
			clear: () => _store.clear(),
		};
	}
}
