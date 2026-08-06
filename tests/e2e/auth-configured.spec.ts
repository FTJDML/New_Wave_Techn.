import { test, expect } from '@playwright/test';

/**
 * Runs against the second webServer (playwright.config.ts), built with a fake, never-really-
 * contacted VITE_SUPABASE_URL/ANON_KEY so isConfigured is true. Every Supabase HTTP call is
 * intercepted and fulfilled with fixture data matching Supabase's public REST/Auth contract —
 * no real Supabase project is involved. See auth-unconfigured.spec.ts for the (accurate, no
 * mocking needed) tests against today's actual unconfigured deployment.
 */
const BASE_URL = 'http://localhost:4174';

const FAKE_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'researcher@example.com',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  identities: [],
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const FAKE_TOKEN_RESPONSE = {
  access_token: 'fake-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'fake-refresh-token',
  user: FAKE_USER,
};

const FAKE_STAKEHOLDER_ROW = {
  id: 'STK-TEST-1',
  full_name: 'Mocked Stakeholder',
  job_title: 'Test Director',
  function_area: 'QA',
  linkedin_url: null,
  classification: 'private',
  confidence_score: 80,
  notes: null,
};

const FAKE_OWNERSHIP_ROW = {
  id: 'OWN-TEST-1',
  stakeholder_id: 'STK-TEST-1',
  subject_type: 'DOMAIN',
  subject_id: 'DOM-COMMERCE',
  ownership_role: 'EXECUTIVE_SPONSOR',
  status: 'confirmed',
  confidence_score: 70,
  notes: null,
};

test.describe('Auth gate — Supabase configured (network-mocked)', () => {
  test('visiting /stakeholders while signed out redirects to /sign-in', async ({ page }) => {
    await page.goto(`${BASE_URL}/stakeholders`);
    await expect(page).toHaveURL(`${BASE_URL}/sign-in`);
  });

  test('visiting /admin while signed out redirects to /sign-in', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await expect(page).toHaveURL(`${BASE_URL}/sign-in`);
  });

  test('signing in redirects to /stakeholders and renders a mocked signed-in view', async ({ page }) => {
    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FAKE_TOKEN_RESPONSE) });
    });
    await page.route('**/rest/v1/stakeholders*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([FAKE_STAKEHOLDER_ROW]) });
    });
    await page.route('**/rest/v1/ownership_links*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([FAKE_OWNERSHIP_ROW]) });
    });

    await page.goto(`${BASE_URL}/sign-in`);
    await page.getByLabel('Email').fill('researcher@example.com');
    await page.getByLabel('Password').fill('correct-password');
    await page.locator('form').getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(`${BASE_URL}/stakeholders`);
    await expect(page.getByText('Mocked Stakeholder')).toBeVisible();
    await expect(page.getByText(/Executive Sponsor.*Commerce & Customer/)).toBeVisible();
    await expect(page.getByText('researcher@example.com')).toBeVisible();
  });

  test('a failed sign-in shows the error message from the mocked Auth response', async ({ page }) => {
    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
      });
    });

    await page.goto(`${BASE_URL}/sign-in`);
    await page.getByLabel('Email').fill('researcher@example.com');
    await page.getByLabel('Password').fill('wrong-password');
    await page.locator('form').getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid login credentials')).toBeVisible();
    await expect(page).toHaveURL(`${BASE_URL}/sign-in`);
  });
});
