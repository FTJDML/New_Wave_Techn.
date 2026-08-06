import { test, expect } from '@playwright/test';
import { totalArchitectureView } from '../../src/data/curatedView';

const { nodes, groups, canvas } = totalArchitectureView;

test.describe('Total Architecture — visual golden path', () => {
  test('renders every curated node and group, with a golden screenshot', async ({ page }, testInfo) => {
    await page.goto('/');

    await expect(page.getByTestId('architecture-viewport')).toBeVisible();

    for (const node of nodes) {
      await expect(page.getByTestId(`node-${node.id}`)).toBeVisible();
    }
    for (const group of groups) {
      await expect(page.getByTestId(`group-${group.id}`)).toBeVisible();
    }

    const nodeCount = await page.locator('[data-architecture-node]').count();
    expect(nodeCount).toBe(nodes.length);

    const gapCount = nodes.filter((n) => n.kind === 'gap').length;
    expect(gapCount).toBeLessThanOrEqual(8);

    await page.screenshot({
      path: `docs/screenshots/total-architecture-${testInfo.project.name}.png`,
      fullPage: false,
    });
  });

  test('every node title is visible and every text node respects the 11px floor', async ({ page }) => {
    await page.goto('/');

    for (const node of nodes) {
      await expect(page.getByTestId(`node-${node.id}`)).toContainText(node.title.length > 0 ? node.title.slice(0, 8) : node.title);
    }

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

  test('no card can ever show a scrollbar (overflow is clipped, not scrollable)', async ({ page }) => {
    await page.goto('/');
    const scrollable = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-architecture-node]'));
      return cards
        .filter((el) => !['hidden', 'clip'].includes(getComputedStyle(el).overflow))
        .map((el) => el.getAttribute('data-testid'));
    });
    expect(scrollable).toEqual([]);
  });

  test('no minimap is present and no filter panel is expanded by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('minimap')).toHaveCount(0);
    await expect(page.locator('[data-testid="filter-panel"][data-expanded="true"]')).toHaveCount(0);
  });

  test('initial camera fits and centers the whole canvas — no manual zoom needed', async ({ page }) => {
    await page.goto('/');
    const layer = page.getByTestId('architecture-layer');
    const transform = await layer.evaluate((el) => getComputedStyle(el).transform);
    expect(transform).not.toBe('none');

    const viewportBox = await page.getByTestId('architecture-viewport').boundingBox();
    const layerBox = await layer.boundingBox();
    expect(viewportBox).not.toBeNull();
    expect(layerBox).not.toBeNull();
    if (viewportBox && layerBox) {
      // The transformed canvas must fit inside the viewport in both dimensions (allow 1px rounding).
      expect(layerBox.width).toBeLessThanOrEqual(viewportBox.width + 1);
      expect(layerBox.height).toBeLessThanOrEqual(viewportBox.height + 1);
    }
  });

  test('reset button restores the fitted, centered camera after panning', async ({ page }) => {
    await page.goto('/');
    const viewport = page.getByTestId('architecture-viewport');
    const layer = page.getByTestId('architecture-layer');

    const initialTransform = await layer.evaluate((el) => getComputedStyle(el).transform);

    const box = await viewport.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2 - 80);
      await page.mouse.up();
    }
    const pannedTransform = await layer.evaluate((el) => getComputedStyle(el).transform);
    expect(pannedTransform).not.toBe(initialTransform);

    await page.getByRole('button', { name: 'Reset view' }).click();
    const resetTransform = await layer.evaluate((el) => getComputedStyle(el).transform);
    expect(resetTransform).toBe(initialTransform);
  });

  test('hover highlights first-degree neighbours and dims the rest', async ({ page }) => {
    await page.goto('/');
    const edge = totalArchitectureView.edges.find((e) => e.source === 'ctac-xv' || e.target === 'ctac-xv');
    expect(edge).toBeDefined();
    const neighbourId = edge!.source === 'ctac-xv' ? edge!.target : edge!.source;

    await page.getByTestId('node-ctac-xv').hover();
    await expect(page.getByTestId(`node-${neighbourId}`)).not.toHaveClass(/dimmed/);

    const unrelated = totalArchitectureView.nodes.find((n) => n.id !== 'ctac-xv' && n.id !== neighbourId && !totalArchitectureView.edges.some((e) => (e.source === 'ctac-xv' && e.target === n.id) || (e.target === 'ctac-xv' && e.source === n.id)));
    expect(unrelated).toBeDefined();
    await expect(page.getByTestId(`node-${unrelated!.id}`)).toHaveClass(/dimmed/);
  });

  test('clicking a node opens the read-only detail drawer; Escape closes it', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('node-ctac-xv').click();
    const drawer = page.getByTestId('detail-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('Ctac XV Unified Commerce');

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
  });

  test('every vendor node renders a non-empty logo icon or wordmark', async ({ page }) => {
    await page.goto('/');
    for (const node of nodes) {
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

  test('logical canvas matches the curated view canvas size', async ({ page }) => {
    await page.goto('/');
    const layer = page.getByTestId('architecture-layer');
    const box = await layer.evaluate((el) => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height }));
    const transform = await layer.evaluate((el) => getComputedStyle(el).transform);
    const match = /matrix\(([^,]+),/.exec(transform);
    const scale = match ? parseFloat(match[1]) : 1;
    expect(Math.round(box.width / scale)).toBe(canvas.width);
    expect(Math.round(box.height / scale)).toBe(canvas.height);
  });
});
