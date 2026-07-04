import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { webcrypto } from 'node:crypto';

// Hermetic tests: never let a developer's real key from .env leak into the
// suite (tests that exercise Gemini pass an explicit apiKey + mock fetch).
vi.stubEnv('VITE_GEMINI_API_KEY', '');

// jsdom lacks crypto.subtle; the sign-in gate hashes the access password with it
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

// Stub ResizeObserver for recharts ResponsiveContainer in jsdom
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
};
