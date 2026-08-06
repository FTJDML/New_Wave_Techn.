import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions: {
      executablePath: '/opt/pw-browsers/chromium',
    },
  },
  webServer: [
    {
      command: 'npm run build && npm run preview -- --port 4173',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // A second build with a (fake, never-contacted-for-real) Supabase project configured, so
      // tests/e2e/auth-configured.spec.ts can exercise the signed-out redirect and a
      // network-mocked signed-in /stakeholders view. VITE_SUPABASE_URL/ANON_KEY are baked in at
      // build time, so this needs its own build+preview rather than a runtime toggle.
      command: 'npx vite build --outDir dist-auth && npx vite preview --outDir dist-auth --port 4174',
      url: 'http://localhost:4174',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        VITE_SUPABASE_URL: 'https://fake-project.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'fake-anon-key',
      },
    },
  ],
  projects: [
    {
      name: 'desktop-1440',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'desktop-1920',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
  ],
});
