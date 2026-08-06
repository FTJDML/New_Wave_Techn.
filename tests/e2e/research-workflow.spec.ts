import { test, expect } from '@playwright/test';

test.describe('Phase 4 research workflow', () => {
  test('add an evidence source and see it in the table', async ({ page }) => {
    await page.goto('/evidence');
    await page.getByTestId('add-source-toggle').click();
    await page.locator('#source-title').fill('Playwright test source');
    await page.locator('#source-publisher').fill('Playwright');
    await page.getByTestId('add-source-submit').click();
    await expect(page.getByTestId('evidence-source-drawer')).toBeVisible();
    await expect(page.getByTestId('evidence-source-drawer')).toContainText('Playwright test source');
  });

  test('add-source form rejects an incomplete submission', async ({ page }) => {
    await page.goto('/evidence');
    await page.getByTestId('add-source-toggle').click();
    await page.getByTestId('add-source-submit').click();
    await expect(page.getByTestId('add-source-errors')).toBeVisible();
  });

  test('add a claim citing an existing source', async ({ page }) => {
    await page.goto('/evidence?tab=claims');
    await page.getByTestId('add-claim-toggle').click();
    await page.locator('#claim-subject-id').fill('CMP-CTAC-XV');
    await page.locator('#claim-value').fill('Playwright-authored claim value');
    await page.getByTestId('claim-source-checkboxes').locator('input[type="checkbox"]').first().check();
    await page.getByTestId('add-claim-submit').click();
    await expect(page.getByTestId('add-claim-panel')).toHaveCount(0);
    await expect(page.locator('table')).toContainText('Playwright-authored claim value');
  });

  test('promoting a technical observation requires a claim and a note', async ({ page }) => {
    await page.goto('/systems/CMP-NEXTJS');
    const toggle = page.locator('[data-testid^="promote-toggle-"]').first();
    await toggle.click();
    const submitButton = page.locator('[data-testid^="promote-submit-"]').first();
    await submitButton.click();
    const errors = page.locator('[data-testid^="promote-errors-"]').first();
    await expect(errors).toBeVisible();
  });

  test('gap status control only offers valid next transitions and requires a resolution summary to resolve', async ({ page }) => {
    await page.goto('/to-find?view=table');
    await page.locator('table tbody tr').first().click();
    const drawer = page.getByTestId('gap-detail-drawer');
    await drawer.waitFor();

    // OPEN gaps should offer RESEARCHING and PARKED, never RESOLVED directly.
    await expect(page.getByTestId('gap-status-RESEARCHING')).toBeVisible();
    await expect(page.getByTestId('gap-status-RESOLVED')).toHaveCount(0);

    await page.getByTestId('gap-status-RESEARCHING').click();
    await page.getByTestId('gap-status-confirm-submit').click();
    await expect(page.getByTestId('gap-status-control')).toContainText('Move to Validating');

    await page.getByTestId('gap-status-VALIDATING').click();
    await page.getByTestId('gap-status-confirm-submit').click();
    await page.getByTestId('gap-status-RESOLVED').click();
    await page.getByTestId('gap-status-confirm-submit').click();
    await expect(page.getByTestId('gap-status-errors')).toContainText('resolution summary');
  });

  test('adding a research task shows up under the gap', async ({ page }) => {
    await page.goto('/to-find?view=table');
    await page.locator('table tbody tr').nth(1).click();
    await page.getByTestId('add-task-toggle').click();
    await page.locator('#task-title').fill('Playwright research task');
    await page.getByTestId('add-task-submit').click();
    await expect(page.getByTestId('gap-detail-drawer')).toContainText('Playwright research task');
  });

  test('CSV import previews and commits only valid rows', async ({ page }) => {
    await page.goto('/research');
    await page.getByTestId('csv-textarea').fill(
      'source_title,publisher,source_type,reliability_rating_1_5,data_classification\nGood Row,Pub,FIRST_PARTY,4,INTERNAL\nBad Row,,BOGUS,9,INTERNAL',
    );
    await page.getByTestId('csv-preview-button').click();
    await expect(page.getByTestId('csv-preview-table')).toContainText('Valid');
    await expect(page.getByTestId('csv-preview-table')).toContainText('Invalid');
    await page.getByTestId('csv-confirm-import').click();
    await expect(page.getByTestId('csv-import-summary')).toContainText('Imported 1 row(s), skipped 1');
  });

  test('audit history records the import and is visible on the audit tab', async ({ page }) => {
    await page.goto('/research');
    await page.getByTestId('csv-textarea').fill('source_title,publisher,source_type,reliability_rating_1_5,data_classification\nAudited Row,Pub,FIRST_PARTY,4,INTERNAL');
    await page.getByTestId('csv-preview-button').click();
    await page.getByTestId('csv-confirm-import').click();
    await page.goto('/research?tab=audit');
    await expect(page.getByTestId('audit-log-table')).toContainText('import');
  });
});

test.describe('Phase 4 ownership masking — live creation regression', () => {
  test('a freshly created contact name is never rendered anywhere in the DOM', async ({ page }) => {
    const secretName = 'Testonly Confidential Person';

    await page.goto('/systems/CMP-CTAC-XV');
    await page.getByTestId('add-ownership-toggle').click();
    await page.getByTestId('new-contact-toggle').click();
    await page.getByTestId('new-contact-name-input').fill(secretName);
    await page.locator('#ownership-role').fill('TECHNOLOGY_OWNER_OR_MANAGER');
    await page.getByTestId('add-ownership-submit').click();

    await expect(page.getByTestId('ownership-link-list')).toContainText('Contact');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain(secretName);

    // Also check the research/audit trail and the systems catalogue don't leak it either.
    await page.goto('/research?tab=audit');
    const auditText = await page.locator('body').innerText();
    expect(auditText).not.toContain(secretName);

    await page.goto('/systems');
    const systemsText = await page.locator('body').innerText();
    expect(systemsText).not.toContain(secretName);
  });
});
