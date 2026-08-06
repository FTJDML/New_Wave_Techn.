import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/shell/PageHeader';
import { FilterPanel, type FilterFieldConfig } from '@/components/table/FilterPanel';
import { DataTable, type DataTableColumn } from '@/components/table/DataTable';
import { GapDetailDrawer } from '@/components/drawer/GapDetailDrawer';
import { researchGaps, domains, getDomain } from '@/data/fullCatalogue';
import { mergedGap } from '@/research/store';
import { useResearchStoreVersion } from '@/research/useResearchStore';
import type { ResearchGap } from '@/types/catalogue';
import { humanize } from '@/lib/formatting';
import { priorityColor } from '@/lib/catalogueStatusMeta';
import pageStyles from './CatalogPage.module.css';

const GAP_STATUS_COLUMNS = ['OPEN', 'RESEARCHING', 'VALIDATING', 'RESOLVED', 'PARKED'] as const;

function uniqueSorted(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

export function ToFindPage() {
  const storeVersion = useResearchStoreVersion();
  const navigate = useNavigate();
  const { gapId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // storeVersion isn't read in the callback — it's the useSyncExternalStore snapshot, included
  // purely to force recomputation when a local gap-status/task edit commits.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allGaps = useMemo(() => researchGaps.map((g) => mergedGap(g.gap_id) ?? g), [storeVersion]);

  const view = searchParams.get('view') === 'table' ? 'table' : 'kanban';
  const search = searchParams.get('q') ?? '';
  const domainFilter = searchParams.get('domain') ?? '';
  const priorityFilter = searchParams.get('priority') ?? '';

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const filterFields: FilterFieldConfig[] = useMemo(
    () => [
      { key: 'domain', label: 'Domain', options: domains.map((d) => ({ value: d.domain_id, label: d.domain_name })) },
      { key: 'priority', label: 'Priority', options: uniqueSorted(allGaps.map((g) => g.priority)).map((v) => ({ value: v, label: v })) },
    ],
    [allGaps],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allGaps.filter((g) => {
      if (domainFilter && g.domain_id !== domainFilter) return false;
      if (priorityFilter && g.priority !== priorityFilter) return false;
      if (q && !`${g.gap_title} ${g.research_question}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, domainFilter, priorityFilter, allGaps]);

  const columns: DataTableColumn<ResearchGap>[] = [
    { key: 'title', label: 'Gap', sortValue: (g) => g.gap_title, render: (g) => g.gap_title },
    { key: 'domain', label: 'Domain', sortValue: (g) => getDomain(g.domain_id)?.domain_name ?? '', render: (g) => getDomain(g.domain_id)?.domain_name ?? humanize(g.domain_id) },
    {
      key: 'priority',
      label: 'Priority',
      sortValue: (g) => g.priority,
      render: (g) => (
        <span className={pageStyles.badge} style={{ background: priorityColor(g.priority) }}>
          {g.priority}
        </span>
      ),
    },
    { key: 'status', label: 'Status', sortValue: (g) => g.gap_status, render: (g) => humanize(g.gap_status) },
    { key: 'route', label: 'Fastest research route', sortValue: (g) => g.research_route, render: (g) => g.research_route },
  ];

  const selectedGap = gapId ? mergedGap(gapId) : undefined;

  return (
    <div className={pageStyles.page}>
      <PageHeader title="TO FIND" subtitle="Essential architecture objects not yet identified, tracked from open question to resolution." />
      <div className={pageStyles.body}>
        <FilterPanel
          searchValue={search}
          onSearchChange={(v) => setParam('q', v)}
          searchPlaceholder="Search gaps…"
          fields={filterFields}
          values={{ domain: domainFilter, priority: priorityFilter }}
          onFieldChange={setParam}
          shownCount={filtered.length}
          totalCount={allGaps.length}
        />
        <div className={pageStyles.viewToggle}>
          <button type="button" className={[pageStyles.tab, view === 'kanban' ? pageStyles.tabActive : ''].join(' ')} onClick={() => setParam('view', '')}>
            Kanban
          </button>
          <button type="button" className={[pageStyles.tab, view === 'table' ? pageStyles.tabActive : ''].join(' ')} onClick={() => setParam('view', 'table')}>
            Table
          </button>
        </div>
        <br />

        {view === 'kanban' ? (
          <div className={pageStyles.board}>
            {GAP_STATUS_COLUMNS.map((status) => {
              const gapsInColumn = filtered.filter((g) => g.gap_status === status);
              return (
                <div key={status} className={pageStyles.column} data-testid={`gap-column-${status}`}>
                  <p className={pageStyles.columnTitle}>
                    <span>{humanize(status)}</span>
                    <span>{gapsInColumn.length}</span>
                  </p>
                  {gapsInColumn.length === 0 ? (
                    <p className={pageStyles.columnEmpty}>None</p>
                  ) : (
                    gapsInColumn.map((g) => (
                      <button
                        key={g.gap_id}
                        type="button"
                        className={pageStyles.gapCard}
                        onClick={() => navigate(`/to-find/${g.gap_id}?${searchParams.toString()}`)}
                      >
                        <p className={pageStyles.gapCardTitle}>{g.gap_title}</p>
                        <p className={pageStyles.gapCardMeta}>
                          {g.priority} · {getDomain(g.domain_id)?.domain_name ?? humanize(g.domain_id)}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <DataTable columns={columns} rows={filtered} getRowId={(g) => g.gap_id} onRowClick={(g) => navigate(`/to-find/${g.gap_id}?${searchParams.toString()}`)} selectedId={gapId} />
        )}
      </div>
      {selectedGap ? (
        <GapDetailDrawer gap={selectedGap} onClose={() => navigate(`/to-find?${searchParams.toString()}`)} onSelectComponent={(id) => navigate(`/systems/${id}`)} />
      ) : null}
    </div>
  );
}
