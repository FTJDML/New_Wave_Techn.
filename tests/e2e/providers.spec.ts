import { test, expect } from '@playwright/test';
import { buildProviderSections, buildProviderToFindGaps } from '../../src/lib/providersView';

const sections = buildProviderSections();
const toFindGaps = buildProviderToFindGaps();

test.describe('Providers & Partners page', () => {
  test('renders every section with its cards, and a golden screenshot', async ({ page }, testInfo) => {
    await page.goto('/architecture/providers');

    for (const section of sections) {
      await expect(page.getByRole('heading', { name: section.title })).toBeVisible();
      for (const card of section.cards) {
        await expect(page.getByRole('heading', { name: card.vendor.vendor_name, exact: true })).toBeVisible();
      }
    }

    await expect(page.getByRole('heading', { name: 'TO FIND — delivery ecosystem' })).toBeVisible();
    for (const gap of toFindGaps) {
      await expect(page.getByText(gap.gap_title, { exact: true })).toBeVisible();
    }

    await page.screenshot({
      path: `docs/screenshots/providers-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });

  test('a candidate-affiliation vendor renders without a fabricated role or system list', async ({ page }) => {
    await page.goto('/architecture/providers');
    const card = page.locator('article', { has: page.getByRole('heading', { name: '4POS', exact: true }) });
    await expect(card).toContainText('Candidate affiliation — no relationship record');
  });

  test('clicking a TO FIND gap navigates to its detail page', async ({ page }) => {
    await page.goto('/architecture/providers');
    const gap = toFindGaps[0];
    await page.getByText(gap.gap_title, { exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/to-find/${gap.gap_id}`));
  });

  test('the Providers & Partners tab is present and active', async ({ page }) => {
    await page.goto('/architecture/providers');
    const tab = page.getByRole('link', { name: 'Providers & Partners' });
    await expect(tab).toBeVisible();
  });
});
