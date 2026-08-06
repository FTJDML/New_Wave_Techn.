import { test, expect } from '@playwright/test';
import { buildProviderOverlay } from '../../src/lib/providersView';
import { storeCheckoutView, erpSupplyView } from '../../src/data/deepDiveViews';
import { totalArchitectureView } from '../../src/data/curatedView';

test.describe('Provider overlay toggle (content-provider patch §6)', () => {
  test('defaults to OFF on Total Architecture and every deep dive', async ({ page }) => {
    for (const path of ['/', '/architecture/store', '/architecture/erp-supply']) {
      await page.goto(path);
      await expect(page.getByTestId('provider-overlay-toggle')).toHaveAttribute('aria-pressed', 'false');
      await expect(page.getByTestId('provider-overlay-panel')).toHaveCount(0);
    }
  });

  test('toggling on shows the related provider cards and dims application edges; toggling off restores them', async ({ page }) => {
    await page.goto('/architecture/store');
    const overlay = buildProviderOverlay(storeCheckoutView);
    expect(overlay.cards.length).toBeGreaterThan(0);

    const firstEdge = page.getByTestId(`edge-${storeCheckoutView.edges[0].id}`);
    await expect(firstEdge).not.toHaveClass(/dimmed/);

    await page.getByTestId('provider-overlay-toggle').click();
    await expect(page.getByTestId('provider-overlay-toggle')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('provider-overlay-panel')).toBeVisible();
    for (const card of overlay.cards) {
      await expect(page.getByTestId(`provider-overlay-card-${card.vendor.vendor_id}`)).toBeVisible();
    }
    await expect(firstEdge).toHaveClass(/dimmed/);

    await page.getByTestId('provider-overlay-toggle').click();
    await expect(page.getByTestId('provider-overlay-panel')).toHaveCount(0);
    await expect(firstEdge).not.toHaveClass(/dimmed/);
  });

  test('never shows more than six provider cards combined with gap stubs, on any view', async ({ page }) => {
    for (const [path, view] of [
      ['/', totalArchitectureView],
      ['/architecture/erp-supply', erpSupplyView],
    ] as const) {
      await page.goto(path);
      await page.getByTestId('provider-overlay-toggle').click();
      const overlay = buildProviderOverlay(view);
      const cardCount = await page.locator('[data-testid^="provider-overlay-card-"]').count();
      const gapCount = await page.locator('[data-testid^="provider-overlay-gap-"]').count();
      expect(cardCount + gapCount).toBeLessThanOrEqual(6);
      expect(cardCount).toBe(overlay.cards.length);
      expect(gapCount).toBe(overlay.gaps.length);
    }
  });

  test('golden screenshot of the ERP & Supply overlay panel', async ({ page }, testInfo) => {
    await page.goto('/architecture/erp-supply');
    await page.getByTestId('provider-overlay-toggle').click();
    await expect(page.getByTestId('provider-overlay-panel')).toBeVisible();
    await page.screenshot({
      path: `docs/screenshots/erp-supply-provider-overlay-${testInfo.project.name}.png`,
      fullPage: false,
    });
  });
});
