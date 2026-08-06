import { describe, expect, it } from 'vitest';
import { buildViewSummary, formatViewSummary } from '../../src/lib/viewSummary';
import { totalArchitectureView } from '../../src/data/curatedView';
import { storeCheckoutView, erpSupplyView } from '../../src/data/deepDiveViews';

describe('buildViewSummary', () => {
  it('counts only non-gap top-level nodes as "shown"', () => {
    const summary = buildViewSummary(storeCheckoutView);
    const nonGapCount = storeCheckoutView.nodes.filter((n) => n.kind !== 'gap').length;
    expect(summary.shown).toBe(nonGapCount);
  });

  it('known-in-domain is always at least what is shown, for every canvas view', () => {
    for (const view of [totalArchitectureView, storeCheckoutView, erpSupplyView]) {
      const summary = buildViewSummary(view);
      expect(summary.knownInDomain).toBeGreaterThanOrEqual(summary.shown);
    }
  });

  it('formats as "N shown · M known in domain · K TO FIND"', () => {
    const summary = { shown: 18, knownInDomain: 43, toFind: 9 };
    expect(formatViewSummary(summary)).toBe('18 shown · 43 known in domain · 9 TO FIND');
  });
});
