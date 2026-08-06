import { test, expect } from '@playwright/test';
import { components, vendors, evidenceSources, claims, technicalObservations, researchGaps } from '../../src/data/fullCatalogue';

test.describe('Navigation shell', () => {
  test('nav links route to each Phase 2 page', async ({ page }) => {
    await page.goto('/architecture');
    await page.getByRole('link', { name: 'Systems' }).click();
    await expect(page).toHaveURL(/\/systems/);
    await page.getByRole('link', { name: 'Suppliers' }).click();
    await expect(page).toHaveURL(/\/suppliers/);
    await page.getByRole('link', { name: 'Evidence' }).click();
    await expect(page).toHaveURL(/\/evidence/);
    await page.getByRole('link', { name: 'TO FIND' }).click();
    await expect(page).toHaveURL(/\/to-find/);
    await page.getByRole('link', { name: 'Architecture' }).click();
    await expect(page).toHaveURL(/\/architecture/);
  });

  test('unknown route redirects to /architecture', async ({ page }) => {
    await page.goto('/does-not-exist');
    await expect(page).toHaveURL(/\/architecture/);
  });
});

test.describe('Systems page', () => {
  test('lists every catalogue component and filter panel starts closed', async ({ page }) => {
    await page.goto('/systems');
    await expect(page.locator('table tbody tr')).toHaveCount(components.length);
    await expect(page.getByTestId('filter-panel')).toHaveCount(0);
    await page.getByTestId('filter-panel-toggle').click();
    await expect(page.getByTestId('filter-panel')).toBeVisible();
  });

  test('search narrows the row count', async ({ page }) => {
    await page.goto('/systems');
    await page.getByPlaceholder(/Search systems/).fill('Ctac');
    await expect(page.locator('table tbody tr')).toHaveCount(components.filter((c) => `${c.display_name} ${c.vendor_name} ${c.product_name} ${c.business_process}`.toLowerCase().includes('ctac')).length);
  });

  test('deep link opens the matching system drawer', async ({ page }) => {
    await page.goto('/systems/CMP-CTAC-XV');
    await expect(page.getByTestId('system-detail-drawer')).toBeVisible();
    await expect(page.getByTestId('system-detail-drawer')).toContainText('Ctac XV Unified Commerce');
    await page.getByTestId('system-detail-drawer').getByRole('button', { name: 'Close' }).click();
    await expect(page).toHaveURL(/\/systems(\?.*)?$/);
  });

  test('clicking a linked module navigates the drawer to that module', async ({ page }) => {
    await page.goto('/systems/CMP-CTAC-XV');
    await page.getByTestId('system-detail-drawer').getByRole('button', { name: 'XV POS' }).first().click();
    await expect(page).toHaveURL(/CMP-XV-POS/);
    await expect(page.getByTestId('system-detail-drawer')).toContainText('XV POS');
  });
});

test.describe('Suppliers page', () => {
  test('lists every vendor', async ({ page }) => {
    await page.goto('/suppliers');
    await expect(page.locator('table tbody tr')).toHaveCount(vendors.length);
  });

  test('deep link opens the matching supplier drawer', async ({ page }) => {
    await page.goto('/suppliers/VEN-SAP');
    await expect(page.getByTestId('supplier-detail-drawer')).toBeVisible();
    await expect(page.getByTestId('supplier-detail-drawer')).toContainText('SAP');
  });

  test('selecting a vendor system navigates to the Systems page drawer', async ({ page }) => {
    await page.goto('/suppliers/VEN-CTAC');
    await page.getByTestId('supplier-detail-drawer').locator('button').filter({ hasText: 'Ctac XV Unified Commerce' }).click();
    await expect(page).toHaveURL(/\/systems\/CMP-CTAC-XV/);
  });

  test('exposes provider-role, status, directness, domain, geography, evidence, year and open-gap filters (content-provider patch §10)', async ({ page }) => {
    await page.goto('/suppliers');
    await page.getByTestId('filter-panel-toggle').click();
    const panel = page.getByTestId('filter-panel');
    for (const label of [
      'Provider role',
      'Current status',
      'Directness',
      'Domain',
      'Geography',
      'Evidence status',
      'Known since',
      'Open provider gap',
    ]) {
      await expect(panel.getByLabel(label)).toBeVisible();
    }
  });

  test('filtering by provider role narrows to only software/platform vendors', async ({ page }) => {
    await page.goto('/suppliers?role=SOFTWARE_PLATFORM_VENDOR');
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
    expect(rowCount).toBeLessThan(vendors.length);
  });

  test('filtering by open provider gap surfaces Mendix and Stibo', async ({ page }) => {
    await page.goto('/suppliers?gap=yes');
    await expect(page.getByRole('row', { name: /Mendix/ })).toBeVisible();
    await expect(page.getByRole('row', { name: /Stibo/ })).toBeVisible();
  });

  test('global search returns every newly evidenced catalogue item (content-provider patch §10)', async ({ page }) => {
    await page.goto('/architecture');
    await page.getByRole('button', { name: /Search/ }).click();
    const REQUIRED_TERMS = [
      'Mendix',
      'STEP',
      'Stibo',
      'RIFF',
      'Capgemini',
      'Squadra',
      'PowerText',
      'Staffly',
      'eRecruiter',
      'RetailSonar',
      'Planon',
      'Daikin',
      'Cloudflare',
      'Microsoft 365',
      'Publitas',
      'SendGrid',
      'Cookiebot',
      'Usercentrics',
      'SAP Analytics Cloud',
      'SAP BusinessObjects',
      'Looker Studio',
      'Smartly',
      'Channable',
    ];
    for (const query of REQUIRED_TERMS) {
      await page.getByPlaceholder(/Search systems/).fill(query);
      await expect(page.getByTestId('search-palette'), `expected a search result for "${query}"`).toContainText(query, { ignoreCase: true });
    }
  });
});

test.describe('Evidence page', () => {
  test('tabs switch between sources, claims and technical observations', async ({ page }) => {
    await page.goto('/evidence');
    await expect(page.locator('table tbody tr')).toHaveCount(evidenceSources.length);
    await page.getByRole('button', { name: /Claims/ }).click();
    await expect(page.locator('table tbody tr')).toHaveCount(claims.length);
    await page.getByRole('button', { name: /Technical observations/ }).click();
    await expect(page.locator('table tbody tr')).toHaveCount(technicalObservations.length);
  });

  test('deep link opens the matching evidence source drawer with citing claims', async ({ page }) => {
    await page.goto('/evidence/SRC-CTAC-XV-RENEWAL');
    await expect(page.getByTestId('evidence-source-drawer')).toBeVisible();
    await expect(page.getByTestId('evidence-source-drawer')).toContainText('Claims citing this source');
  });
});

test.describe('TO FIND page', () => {
  test('kanban shows all gaps under OPEN and table view shows the same total', async ({ page }) => {
    await page.goto('/to-find');
    await expect(page.getByTestId('gap-column-OPEN')).toContainText(String(researchGaps.filter((g) => g.gap_status === 'OPEN').length));
    await page.getByRole('button', { name: 'Table' }).click();
    await expect(page.locator('table tbody tr')).toHaveCount(researchGaps.length);
  });

  test('deep link opens the matching gap drawer', async ({ page }) => {
    await page.goto('/to-find/GAP-001');
    await expect(page.getByTestId('gap-detail-drawer')).toBeVisible();
    await expect(page.getByTestId('gap-detail-drawer')).toContainText('target POS / SCO platform');
  });
});

test.describe('Search palette', () => {
  test('opens via the header button, filters results, and navigates on selection', async ({ page }) => {
    await page.goto('/architecture');
    await page.getByRole('button', { name: /Search/ }).click();
    await expect(page.getByTestId('search-palette')).toBeVisible();
    await page.getByPlaceholder(/Search systems/).fill('SAP S/4HANA');
    await page.getByTestId('search-palette').getByText('SAP S/4HANA', { exact: false }).first().click();
    await expect(page).toHaveURL(/\/systems\//);
    await expect(page.getByTestId('search-palette')).toHaveCount(0);
  });

  test('Escape closes the palette without navigating', async ({ page }) => {
    await page.goto('/architecture');
    await page.getByRole('button', { name: /Search/ }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('search-palette')).toHaveCount(0);
    await expect(page).toHaveURL(/\/architecture/);
  });
});

test.describe('Architecture deep link and export', () => {
  test('?node= query param opens the matching drawer on load', async ({ page }) => {
    await page.goto('/architecture?node=ctac-xv');
    await expect(page.getByTestId('detail-drawer')).toBeVisible();
    await expect(page.getByTestId('detail-drawer')).toContainText('Ctac XV Unified Commerce');
  });

  test('zoom controls stay usable while the drawer is open', async ({ page }) => {
    await page.goto('/architecture?node=ctac-xv');
    await expect(page.getByTestId('detail-drawer')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeInViewport();
    await page.getByRole('button', { name: 'Zoom in' }).click({ timeout: 3000 });
  });

  test('Export PNG downloads a poster image', async ({ page }) => {
    await page.goto('/architecture');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export PNG' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('action-total-architecture.png');
  });
});
