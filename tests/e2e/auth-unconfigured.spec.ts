import { test, expect } from '@playwright/test';

/**
 * Covers the state every reviewer of this repo actually sees today: no Supabase project has
 * been provisioned, so VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY are unset and isConfigured is
 * false. Runs against the primary webServer (port 4173, no Supabase env vars) — see
 * auth-configured.spec.ts for the signed-in-view tests, which need their own build.
 */
import rawData from '../../src/data/action-architecture-data.json' with { type: 'json' };

const frc = (rawData as unknown as {
  fullResearchCatalogue: {
    stakeholders: readonly { full_name: string }[];
    cgi_relationships: readonly { cgi_contact_name?: string }[];
  };
}).fullResearchCatalogue;

const FORBIDDEN_NAMES = [
  ...frc.stakeholders.map((s) => s.full_name),
  ...frc.cgi_relationships.map((c) => c.cgi_contact_name).filter((n): n is string => Boolean(n) && n !== 'User' && n !== 'Floris'),
].filter(Boolean);

const GATED_ROUTES = ['/stakeholders', '/admin', '/sign-in'];

test.describe('Auth gate — Supabase not configured', () => {
  for (const route of GATED_ROUTES) {
    test(`${route} shows the "not configured" panel instead of a crash or real data`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByText('Persistence is not configured')).toBeVisible();
    });
  }

  test('the nav bar shows no sign-in/sign-out control', async ({ page }) => {
    await page.goto('/architecture');
    await expect(page.getByRole('button', { name: 'Sign in' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0);
  });

  test('no real stakeholder or CGI name ever renders on the gated routes while unconfigured', async ({ page }) => {
    for (const route of GATED_ROUTES) {
      await page.goto(route);
      const bodyText = await page.locator('body').innerText();
      for (const name of FORBIDDEN_NAMES) {
        expect(bodyText).not.toContain(name);
      }
    }
  });

  test('visiting /stakeholders does not attempt any Supabase network call', async ({ page }) => {
    const supabaseCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('supabase.co')) supabaseCalls.push(request.url());
    });
    await page.goto('/stakeholders');
    await page.waitForLoadState('networkidle');
    expect(supabaseCalls).toEqual([]);
  });
});
