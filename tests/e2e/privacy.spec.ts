import { test, expect } from '@playwright/test';

/**
 * Regression guard for the Phase 2 privacy scope decision: stakeholders, ownership_links
 * and cgi_relationships (personal names, roles and warm-introduction routes classified
 * INTERNAL_CONFIDENTIAL / RESTRICTED) are deliberately excluded from every Phase 2 page,
 * since no authentication/RLS exists yet (CLAUDE.md's privacy guardrails). This test reads
 * the real stakeholder/CGI names straight from the data bundle and asserts none of them
 * ever render anywhere in the app.
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

const ROUTES_TO_CHECK = [
  '/architecture',
  '/architecture/store',
  '/architecture/digital',
  '/architecture/erp-supply',
  '/architecture/data',
  '/architecture/people-service',
  '/architecture/foundation',
  '/systems',
  '/suppliers',
  '/evidence',
  '/to-find',
];

test.describe('Privacy — no stakeholder or CGI identity ever renders', () => {
  for (const route of ROUTES_TO_CHECK) {
    test(`${route} never renders a stakeholder or CGI contact name`, async ({ page }) => {
      await page.goto(route);
      const bodyText = await page.locator('body').innerText();
      for (const name of FORBIDDEN_NAMES) {
        expect(bodyText, `expected "${name}" to be absent from ${route}`).not.toContain(name);
      }
    });
  }

  test('every TO FIND gap drawer never renders a stakeholder name', async ({ page }) => {
    await page.goto('/to-find?view=table');
    const rows = page.locator('table tbody tr');
    const count = Math.min(await rows.count(), 15);
    for (let i = 0; i < count; i++) {
      await rows.nth(i).click();
      const drawerText = await page.getByTestId('gap-detail-drawer').innerText();
      for (const name of FORBIDDEN_NAMES) {
        expect(drawerText, `gap row ${i} leaked "${name}"`).not.toContain(name);
      }
      await page.keyboard.press('Escape');
    }
  });

  test('every system detail drawer never renders a stakeholder name', async ({ page }) => {
    await page.goto('/systems');
    const rows = page.locator('table tbody tr');
    const count = Math.min(await rows.count(), 20);
    for (let i = 0; i < count; i++) {
      await rows.nth(i).click();
      const drawerText = await page.getByTestId('system-detail-drawer').innerText();
      for (const name of FORBIDDEN_NAMES) {
        expect(drawerText, `system row ${i} leaked "${name}"`).not.toContain(name);
      }
      await page.keyboard.press('Escape');
    }
  });

  test('no CGI navigation entry point exists', async ({ page }) => {
    // Phase 5 deliberately adds a "Stakeholders" nav link (gated behind auth — see
    // tests/e2e/auth-unconfigured.spec.ts and auth-configured.spec.ts for its own coverage),
    // so that link is no longer forbidden here. CGI-relationship data still has no
    // access-controlled home (docs/PHASE5_REVIEW_REPORT.md §5) and stays off every nav.
    await page.goto('/architecture');
    await expect(page.getByRole('link', { name: /cgi/i })).toHaveCount(0);
  });
});
