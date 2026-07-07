import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

// Load portal/.env (gitignored) so DEMO_ACCESS_PASSWORD reaches the tests.
try {
  process.loadEnvFile(fileURLToPath(new URL('./.env', import.meta.url)));
} catch { /* no .env present (e.g. CI); tests use their fallback path */ }

// E2E_PORT escapes collisions when another Vite app already holds 4173
// (reuseExistingServer would silently attach to it).
const PORT = Number(process.env.E2E_PORT || 4173);

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
});
