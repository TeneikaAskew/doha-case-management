import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { webcrypto } from 'node:crypto';

// Hermetic tests: never let a developer's real key from .env leak into the
// suite (tests that exercise Gemini pass an explicit apiKey + mock fetch).
// Exception: the CI live gate sets REQUIRE_GEMINI and runs only the
// integration file, which needs the real key.
if (!process.env.REQUIRE_GEMINI) {
  vi.stubEnv('VITE_GEMINI_API_KEY', '');
}

// jsdom lacks crypto.subtle; the sign-in gate hashes the access password with it
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

// jsdom does not implement scrolling; keep test output free of
// "Not implemented: window.scrollTo" noise from the Gate's scroll reset.
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

// Stub ResizeObserver for recharts ResponsiveContainer in jsdom
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom lacks matchMedia; the shell uses it to make the mobile nav drawer inert.
// Default to desktop (no match) so the sidebar stays interactive in tests.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false, media: query, onchange: null,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}, dispatchEvent() { return false; },
  });
}
