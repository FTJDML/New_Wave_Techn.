import { test, expect } from '@playwright/test';
import {
  storeCheckoutView,
  digitalCommerceView,
  erpSupplyView,
  dataIntelligenceView,
  peopleServiceView,
  foundationSecurityView,
} from '../../src/data/deepDiveViews';
import type { ArchitectureView } from '../../src/types/architecture';

const DEEP_DIVES: ReadonlyArray<{ readonly path: string; readonly view: ArchitectureView }> = [
  { path: '/architecture/store', view: storeCheckoutView },
  { path: '/architecture/digital', view: digitalCommerceView },
  { path: '/architecture/erp-supply', view: erpSupplyView },
  { path: '/architecture/data', view: dataIntelligenceView },
  { path: '/architecture/people-service', view: peopleServiceView },
  { path: '/architecture/foundation', view: foundationSecurityView },
];

for (const { path, view } of DEEP_DIVES) {
  test.describe(`${view.title} — deep dive golden path`, () => {
    test(`renders every curated node and group, with a golden screenshot (${view.id})`, async ({ page }, testInfo) => {
      await page.goto(path);
      await expect(page.getByTestId('architecture-viewport')).toBeVisible();

      for (const node of view.nodes) {
        await expect(page.getByTestId(`node-${node.id}`)).toBeVisible();
      }
      for (const group of view.groups) {
        await expect(page.getByTestId(`group-${group.id}`)).toBeVisible();
      }

      const nodeCount = await page.locator('[data-architecture-node]').count();
      expect(nodeCount).toBe(view.nodes.length);

      const gapCount = view.nodes.filter((n) => n.kind === 'gap').length;
      expect(gapCount).toBeLessThanOrEqual(view.rules.maxVisibleGaps);

      await page.screenshot({
        path: `docs/screenshots/${view.id}-${testInfo.project.name}.png`,
        fullPage: false,
      });
    });

    test(`every text node respects the 11px floor (${view.id})`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByTestId('architecture-viewport')).toBeVisible();

      const tooSmall = await page.evaluate(() => {
        const violations: string[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
        let el = walker.nextNode() as Element | null;
        while (el) {
          const hasOwnText = Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0);
          if (hasOwnText) {
            const size = parseFloat(getComputedStyle(el).fontSize);
            if (size < 11) violations.push(`${el.tagName}.${el.className}: ${size}px`);
          }
          el = walker.nextNode() as Element | null;
        }
        return violations;
      });
      expect(tooSmall).toEqual([]);
    });

    test(`no card can ever show a scrollbar (${view.id})`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByTestId('architecture-viewport')).toBeVisible();
      const scrollable = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('[data-architecture-node]'));
        return cards
          .filter((el) => !['hidden', 'clip'].includes(getComputedStyle(el).overflow))
          .map((el) => el.getAttribute('data-testid'));
      });
      expect(scrollable).toEqual([]);
    });

    test(`every vendor node renders a non-empty logo icon or wordmark (${view.id})`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByTestId('architecture-viewport')).toBeVisible();
      for (const node of view.nodes) {
        if (!node.vendorId) continue;
        const logo = page.locator(`[data-testid="node-${node.id}"] [data-testid^="vendor-logo-"]`);
        await expect(logo).toHaveCount(1);
        const box = await logo.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          expect(box.width).toBeGreaterThan(0);
          expect(box.height).toBeGreaterThan(0);
        }
      }
    });

    test(`clicking a node opens the read-only detail drawer (${view.id})`, async ({ page }) => {
      await page.goto(path);
      const firstNode = view.nodes[0];
      await page.getByTestId(`node-${firstNode.id}`).click();
      const drawer = page.getByTestId('detail-drawer');
      await expect(drawer).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(drawer).toHaveCount(0);
    });
  });
}

const TAB_LABELS: ReadonlyArray<{ readonly path: string; readonly label: string }> = [
  { path: '/architecture/store', label: 'Store & Checkout' },
  { path: '/architecture/digital', label: 'Digital Experience' },
  { path: '/architecture/erp-supply', label: 'ERP & Supply' },
  { path: '/architecture/data', label: 'Data & Intelligence' },
  { path: '/architecture/people-service', label: 'People & Service' },
  { path: '/architecture/foundation', label: 'Foundation' },
];

test('DomainTabs navigates between the Total Architecture and every deep dive', async ({ page }) => {
  for (const { path, label } of TAB_LABELS) {
    await page.goto('/architecture');
    await page.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(path.replace(/\//g, '\\/') + '$'));
  }
});
