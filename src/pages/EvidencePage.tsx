import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/shell/PageHeader';
import { FilterPanel, type FilterFieldConfig } from '@/components/table/FilterPanel';
import { DataTable, type DataTableColumn } from '@/components/table/DataTable';
import { EvidenceSourceDrawer } from '@/components/drawer/EvidenceSourceDrawer';
import { evidenceSources, claims, technicalObservations, getEvidenceSource, getComponent } from '@/data/fullCatalogue';
import type { EvidenceSource, Claim, TechnicalObservation } from '@/types/catalogue';
import { humanize } from '@/lib/formatting';
import { evidenceStatusColor } from '@/lib/catalogueStatusMeta';
import pageStyles from './CatalogPage.module.css';

type Tab = 'sources' | 'claims' | 'observations';

function uniqueSorted(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter((v) => v && v !== 'UNKNOWN'))).sort();
}

export function EvidencePage() {
  const navigate = useNavigate();
  const { sourceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = (searchParams.get('tab') as Tab) || 'sources';
  const search = searchParams.get('q') ?? '';
  const typeFilter = searchParams.get('type') ?? '';

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const setTab = (nextTab: Tab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', nextTab);
    next.delete('type');
    next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const sourceColumns: DataTableColumn<EvidenceSource>[] = [
    { key: 'title', label: 'Source', sortValue: (s) => s.source_title, render: (s) => s.source_title },
    { key: 'publisher', label: 'Publisher', sortValue: (s) => s.publisher, render: (s) => s.publisher },
    { key: 'type', label: 'Type', sortValue: (s) => s.source_type, render: (s) => humanize(s.source_type) },
    { key: 'reliability', label: 'Reliability', sortValue: (s) => s.reliability_rating_1_5, render: (s) => `${s.reliability_rating_1_5 || '—'}/5` },
    { key: 'verified', label: 'Last verified', sortValue: (s) => s.last_verified_date, render: (s) => s.last_verified_date || 'Unknown' },
  ];

  const claimColumns: DataTableColumn<Claim>[] = [
    {
      key: 'value',
      label: 'Claim',
      sortValue: (c) => c.value,
      render: (c) => <span className={pageStyles.truncate} title={c.value}>{c.value}</span>,
    },
    {
      key: 'subject',
      label: 'Subject',
      sortValue: (c) => c.subject_id,
      render: (c) => {
        const component = c.subject_type === 'COMPONENT' ? getComponent(c.subject_id) : undefined;
        return component ? (
          <button
            type="button"
            className={pageStyles.linkButton}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/systems/${component.component_id}`);
            }}
          >
            {component.display_name}
          </button>
        ) : (
          c.subject_id
        );
      },
    },
    { key: 'status', label: 'Status', sortValue: (c) => c.claim_status, render: (c) => humanize(c.claim_status) },
    { key: 'confidence', label: 'Confidence', sortValue: (c) => c.confidence_score, render: (c) => c.confidence_score },
    { key: 'checked', label: 'Checked', sortValue: (c) => c.date_checked, render: (c) => c.date_checked || 'Unknown' },
  ];

  const observationColumns: DataTableColumn<TechnicalObservation>[] = [
    { key: 'technology', label: 'Technology', sortValue: (o) => o.technology_name, render: (o) => o.technology_name },
    { key: 'category', label: 'Category', sortValue: (o) => o.category, render: (o) => o.category },
    {
      key: 'component',
      label: 'Mapped system',
      sortValue: (o) => o.mapped_component_id,
      render: (o) => {
        const component = getComponent(o.mapped_component_id);
        return component ? (
          <button
            type="button"
            className={pageStyles.linkButton}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/systems/${component.component_id}`);
            }}
          >
            {component.display_name}
          </button>
        ) : (
          o.mapped_component_id
        );
      },
    },
    {
      key: 'evidence',
      label: 'Evidence',
      sortValue: (o) => o.evidence_status,
      render: (o) => (
        <span className={pageStyles.badge} style={{ background: evidenceStatusColor(o.evidence_status) }}>
          {humanize(o.evidence_status)}
        </span>
      ),
    },
    { key: 'confidence', label: 'Confidence', sortValue: (o) => o.confidence_score, render: (o) => o.confidence_score },
  ];

  const sourceFilterFields: FilterFieldConfig[] = useMemo(
    () => [{ key: 'type', label: 'Source type', options: uniqueSorted(evidenceSources.map((s) => s.source_type)).map((v) => ({ value: v, label: humanize(v) })) }],
    [],
  );
  const claimFilterFields: FilterFieldConfig[] = useMemo(
    () => [{ key: 'type', label: 'Claim status', options: uniqueSorted(claims.map((c) => c.claim_status)).map((v) => ({ value: v, label: humanize(v) })) }],
    [],
  );
  const observationFilterFields: FilterFieldConfig[] = useMemo(
    () => [{ key: 'type', label: 'Evidence status', options: uniqueSorted(technicalObservations.map((o) => o.evidence_status)).map((v) => ({ value: v, label: humanize(v) })) }],
    [],
  );

  const filteredSources = useMemo(() => {
    const q = search.trim().toLowerCase();
    return evidenceSources.filter((s) => {
      if (typeFilter && s.source_type !== typeFilter) return false;
      if (q && !`${s.source_title} ${s.publisher}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, typeFilter]);

  const filteredClaims = useMemo(() => {
    const q = search.trim().toLowerCase();
    return claims.filter((c) => {
      if (typeFilter && c.claim_status !== typeFilter) return false;
      if (q && !c.value.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, typeFilter]);

  const filteredObservations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return technicalObservations.filter((o) => {
      if (typeFilter && o.evidence_status !== typeFilter) return false;
      if (q && !`${o.technology_name} ${o.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, typeFilter]);

  const selectedSource = sourceId ? getEvidenceSource(sourceId) : undefined;

  return (
    <div className={pageStyles.page}>
      <PageHeader
        title="Evidence"
        subtitle="Sources, claims and technical observations. Technically-observed technology is never presented as a confirmed contract."
      />
      <div className={pageStyles.body}>
        <div className={pageStyles.tabs}>
          <button type="button" className={[pageStyles.tab, tab === 'sources' ? pageStyles.tabActive : ''].join(' ')} onClick={() => setTab('sources')}>
            Sources ({evidenceSources.length})
          </button>
          <button type="button" className={[pageStyles.tab, tab === 'claims' ? pageStyles.tabActive : ''].join(' ')} onClick={() => setTab('claims')}>
            Claims ({claims.length})
          </button>
          <button type="button" className={[pageStyles.tab, tab === 'observations' ? pageStyles.tabActive : ''].join(' ')} onClick={() => setTab('observations')}>
            Technical observations ({technicalObservations.length})
          </button>
        </div>

        {tab === 'sources' ? (
          <>
            <FilterPanel
              searchValue={search}
              onSearchChange={(v) => setParam('q', v)}
              searchPlaceholder="Search evidence sources…"
              fields={sourceFilterFields}
              values={{ type: typeFilter }}
              onFieldChange={setParam}
              shownCount={filteredSources.length}
              totalCount={evidenceSources.length}
            />
            <DataTable columns={sourceColumns} rows={filteredSources} getRowId={(s) => s.source_id} onRowClick={(s) => navigate(`/evidence/${s.source_id}?${searchParams.toString()}`)} selectedId={sourceId} />
          </>
        ) : null}

        {tab === 'claims' ? (
          <>
            <FilterPanel
              searchValue={search}
              onSearchChange={(v) => setParam('q', v)}
              searchPlaceholder="Search claims…"
              fields={claimFilterFields}
              values={{ type: typeFilter }}
              onFieldChange={setParam}
              shownCount={filteredClaims.length}
              totalCount={claims.length}
            />
            <DataTable columns={claimColumns} rows={filteredClaims} getRowId={(c) => c.claim_id} />
          </>
        ) : null}

        {tab === 'observations' ? (
          <>
            <FilterPanel
              searchValue={search}
              onSearchChange={(v) => setParam('q', v)}
              searchPlaceholder="Search technical observations…"
              fields={observationFilterFields}
              values={{ type: typeFilter }}
              onFieldChange={setParam}
              shownCount={filteredObservations.length}
              totalCount={technicalObservations.length}
            />
            <DataTable columns={observationColumns} rows={filteredObservations} getRowId={(o) => o.observation_id} />
          </>
        ) : null}
      </div>
      {selectedSource ? (
        <EvidenceSourceDrawer
          source={selectedSource}
          onClose={() => navigate(`/evidence?${searchParams.toString()}`)}
          onSelectComponent={(id) => navigate(`/systems/${id}`)}
        />
      ) : null}
    </div>
  );
}
