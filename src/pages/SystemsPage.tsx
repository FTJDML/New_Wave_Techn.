import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/shell/PageHeader';
import { FilterPanel, type FilterFieldConfig } from '@/components/table/FilterPanel';
import { DataTable, type DataTableColumn } from '@/components/table/DataTable';
import { SystemDetailDrawer } from '@/components/drawer/SystemDetailDrawer';
import { VendorLogo } from '@/components/logo/VendorLogo';
import { components, domains, getComponent, getDomain } from '@/data/fullCatalogue';
import type { Component } from '@/types/catalogue';
import { humanize } from '@/lib/formatting';
import { deploymentStatusColor, evidenceStatusColor } from '@/lib/catalogueStatusMeta';
import pageStyles from './CatalogPage.module.css';

function uniqueSorted(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter((v) => v && v !== 'UNKNOWN'))).sort();
}

export function SystemsPage() {
  const navigate = useNavigate();
  const { componentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const domainFilter = searchParams.get('domain') ?? '';
  const roleFilter = searchParams.get('role') ?? '';
  const statusFilter = searchParams.get('status') ?? '';
  const evidenceFilter = searchParams.get('evidence') ?? '';
  const capabilityFilter = searchParams.get('capability') ?? '';

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const filterFields: FilterFieldConfig[] = useMemo(
    () => [
      { key: 'domain', label: 'Domain', options: domains.map((d) => ({ value: d.domain_id, label: d.domain_name })) },
      { key: 'role', label: 'Architecture role', options: uniqueSorted(components.map((c) => c.architecture_role)).map((v) => ({ value: v, label: humanize(v) })) },
      { key: 'status', label: 'Deployment status', options: uniqueSorted(components.map((c) => c.deployment_status)).map((v) => ({ value: v, label: humanize(v) })) },
      { key: 'evidence', label: 'Evidence', options: uniqueSorted(components.map((c) => c.evidence_status)).map((v) => ({ value: v, label: humanize(v) })) },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return components.filter((c) => {
      if (domainFilter && c.domain_id !== domainFilter) return false;
      if (roleFilter && c.architecture_role !== roleFilter) return false;
      if (statusFilter && c.deployment_status !== statusFilter) return false;
      if (evidenceFilter && c.evidence_status !== evidenceFilter) return false;
      if (capabilityFilter && c.primary_capability_id !== capabilityFilter) return false;
      if (q && !(`${c.display_name} ${c.vendor_name} ${c.product_name} ${c.business_process}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [search, domainFilter, roleFilter, statusFilter, evidenceFilter, capabilityFilter]);

  const columns: DataTableColumn<Component>[] = [
    {
      key: 'name',
      label: 'System',
      sortValue: (c) => c.display_name,
      render: (c) => (
        <span className={pageStyles.nameCell}>
          <VendorLogo vendorId={c.vendor_id} size={16} />
          {c.display_name}
        </span>
      ),
    },
    { key: 'vendor', label: 'Vendor', sortValue: (c) => c.vendor_name, render: (c) => c.vendor_name },
    { key: 'domain', label: 'Domain', sortValue: (c) => getDomain(c.domain_id)?.domain_name ?? '', render: (c) => getDomain(c.domain_id)?.domain_name ?? humanize(c.domain_id) },
    { key: 'role', label: 'Role', sortValue: (c) => c.architecture_role, render: (c) => humanize(c.architecture_role) },
    {
      key: 'status',
      label: 'Status',
      sortValue: (c) => c.deployment_status,
      render: (c) => (
        <span className={pageStyles.badge} style={{ background: deploymentStatusColor(c.deployment_status) }}>
          {humanize(c.deployment_status)}
        </span>
      ),
    },
    {
      key: 'evidence',
      label: 'Evidence',
      sortValue: (c) => c.evidence_status,
      render: (c) => (
        <span className={pageStyles.badge} style={{ background: evidenceStatusColor(c.evidence_status) }}>
          {humanize(c.evidence_status)}
        </span>
      ),
    },
  ];

  const selectedComponent = componentId ? getComponent(componentId) : undefined;

  return (
    <div className={pageStyles.page}>
      <PageHeader title="Systems" subtitle="Searchable catalogue of every known system, module and gap placeholder — not rendered on the architecture canvas." />
      <div className={pageStyles.body}>
        <FilterPanel
          searchValue={search}
          onSearchChange={(value) => setFilter('q', value)}
          searchPlaceholder="Search systems, vendors, business process…"
          fields={filterFields}
          values={{ domain: domainFilter, role: roleFilter, status: statusFilter, evidence: evidenceFilter }}
          onFieldChange={setFilter}
          shownCount={filtered.length}
          totalCount={components.length}
        />
        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(c) => c.component_id}
          onRowClick={(c) => navigate(`/systems/${c.component_id}?${searchParams.toString()}`)}
          selectedId={componentId}
        />
      </div>
      {selectedComponent ? (
        <SystemDetailDrawer
          component={selectedComponent}
          onClose={() => navigate(`/systems?${searchParams.toString()}`)}
          onSelectComponent={(id) => navigate(`/systems/${id}?${searchParams.toString()}`)}
        />
      ) : null}
    </div>
  );
}
