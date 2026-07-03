import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

// Load portal/.env (gitignored) so DEMO_ACCESS_PASSWORD reaches the tests.
try {
  process.loadEnvFile(fileURLToPath(new URL('./.env', import.meta.url)));
} catch { /* no .env present (e.g. CI); tests use their fallback path */ }

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
