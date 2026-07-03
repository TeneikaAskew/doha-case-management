import '@testing-library/jest-dom';
import { webcrypto } from 'node:crypto';

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
