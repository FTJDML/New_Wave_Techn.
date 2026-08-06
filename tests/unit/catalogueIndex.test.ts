import { describe, expect, it } from 'vitest';
import { resolveCatalogueRef, resolveCatalogueRefs } from '../../src/data/catalogueIndex';
import { totalArchitectureView } from '../../src/data/curatedView';

describe('resolveCatalogueRef', () => {
  it('resolves every catalogRef used by the curated Total Architecture view', () => {
    for (const node of totalArchitectureView.nodes) {
      for (const ref of node.catalogRefs) {
        const record = resolveCatalogueRef(ref);
        expect(record, `expected catalogRef ${ref} on node ${node.id} to resolve`).toBeDefined();
        expect(record?.id).toBe(ref);
      }
    }
  });

  it('returns undefined for an unknown id', () => {
    expect(resolveCatalogueRef('CMP-DOES-NOT-EXIST')).toBeUndefined();
  });
});

describe('resolveCatalogueRefs', () => {
  it('silently drops unresolved ids instead of throwing', () => {
    const [known] = totalArchitectureView.nodes[0].catalogRefs;
    const result = resolveCatalogueRefs([known, 'CMP-DOES-NOT-EXIST']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(known);
  });

  it('returns an empty array for an empty input', () => {
    expect(resolveCatalogueRefs([])).toEqual([]);
  });
});
