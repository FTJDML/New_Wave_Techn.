import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { components, vendors, capabilities, researchGaps, evidenceSources } from '@/data/fullCatalogue';
import styles from './SearchPalette.module.css';

interface SearchResult {
  readonly id: string;
  readonly kind: 'System' | 'Vendor' | 'Capability' | 'TO FIND gap' | 'Evidence source';
  readonly title: string;
  readonly meta: string;
  readonly to: string;
}

function buildIndex(): readonly SearchResult[] {
  const results: SearchResult[] = [];
  for (const c of components) {
    results.push({ id: c.component_id, kind: 'System', title: c.display_name, meta: `${c.vendor_name} · ${c.business_process || c.architecture_role}`, to: `/systems/${c.component_id}` });
  }
  for (const v of vendors) {
    results.push({ id: v.vendor_id, kind: 'Vendor', title: v.vendor_name, meta: v.vendor_category, to: `/suppliers/${v.vendor_id}` });
  }
  for (const cap of capabilities) {
    results.push({ id: cap.capability_id, kind: 'Capability', title: cap.capability_name, meta: cap.description, to: `/systems?capability=${cap.capability_id}` });
  }
  for (const g of researchGaps) {
    results.push({ id: g.gap_id, kind: 'TO FIND gap', title: g.gap_title, meta: g.research_question, to: `/to-find/${g.gap_id}` });
  }
  for (const e of evidenceSources) {
    results.push({ id: e.source_id, kind: 'Evidence source', title: e.source_title, meta: e.publisher, to: `/evidence/${e.source_id}` });
  }
  return results;
}

const SEARCH_INDEX = buildIndex();
const MAX_RESULTS_PER_KIND = 5;

interface SearchPaletteProps {
  readonly onClose: () => void;
}

/** Only ever mounted while open (see AppShell) — a fresh mount gives a clean default
 * query/activeIndex for free, so no reset effect is needed on top of the focus effect. */
export function SearchPalette({ onClose }: SearchPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const grouped = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    const matches = SEARCH_INDEX.filter((r) => r.title.toLowerCase().includes(trimmed) || r.meta.toLowerCase().includes(trimmed));
    const byKind = new Map<SearchResult['kind'], SearchResult[]>();
    for (const match of matches) {
      const list = byKind.get(match.kind) ?? [];
      if (list.length < MAX_RESULTS_PER_KIND) list.push(match);
      byKind.set(match.kind, list);
    }
    return Array.from(byKind.entries());
  }, [query]);

  const flatResults = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

  const select = (result: SearchResult) => {
    navigate(result.to);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const result = flatResults[activeIndex];
      if (result) select(result);
    }
  };

  return (
    <button type="button" className={styles.overlay} aria-label="Close search" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-label="Search"
        onClick={(event) => event.stopPropagation()}
        data-testid="search-palette"
      >
        <div className={styles.inputRow}>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="Search systems, vendors, capabilities, gaps, evidence…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className={styles.results}>
          {query.trim() === '' ? null : flatResults.length === 0 ? (
            <p className={styles.empty}>No matches.</p>
          ) : (
            grouped.map(([kind, items]) => (
              <div key={kind}>
                <p className={styles.groupLabel}>{kind}</p>
                {items.map((item) => {
                  const flatIndex = flatResults.indexOf(item);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={[styles.item, flatIndex === activeIndex ? styles.itemActive : ''].join(' ')}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      onClick={() => select(item)}
                    >
                      <span className={styles.itemTitle}>{item.title}</span>
                      {item.meta ? <span className={styles.itemMeta}>{item.meta}</span> : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </button>
  );
}
