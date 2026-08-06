import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/shell/PageHeader';
import { FilterPanel, type FilterFieldConfig } from '@/components/table/FilterPanel';
import { DataTable, type DataTableColumn } from '@/components/table/DataTable';
import { SupplierDetailDrawer } from '@/components/drawer/SupplierDetailDrawer';
import { VendorLogo } from '@/components/logo/VendorLogo';
import { vendors, getVendor, getDomain, getCommercialRelationshipsForVendor, getComponentsForVendor } from '@/data/fullCatalogue';
import type { Vendor } from '@/types/catalogue';
import { humanize } from '@/lib/formatting';
import {
  vendorProviderRoles,
  vendorCurrentStatuses,
  vendorDirectness,
  vendorGeographies,
  vendorEvidenceStatuses,
  vendorKnownSinceYears,
  vendorDomainIds,
  vendorHasOpenProviderGap,
} from '@/lib/supplierFilters';
import pageStyles from './CatalogPage.module.css';

function uniqueSorted(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

export function SuppliersPage() {
  const navigate = useNavigate();
  const { vendorId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const categoryFilter = searchParams.get('category') ?? '';
  const roleFilter = searchParams.get('role') ?? '';
  const statusFilter = searchParams.get('status') ?? '';
  const directnessFilter = searchParams.get('directness') ?? '';
  const domainFilter = searchParams.get('domain') ?? '';
  const geographyFilter = searchParams.get('geography') ?? '';
  const evidenceFilter = searchParams.get('evidence') ?? '';
  const yearFilter = searchParams.get('year') ?? '';
  const gapFilter = searchParams.get('gap') ?? '';

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const filterFields: FilterFieldConfig[] = useMemo(
    () => [
      { key: 'category', label: 'Category', options: uniqueSorted(vendors.map((v) => v.vendor_category)).map((v) => ({ value: v, label: v })) },
      {
        key: 'role',
        label: 'Provider role',
        options: uniqueSorted(vendors.flatMap(vendorProviderRoles)).map((v) => ({ value: v, label: humanize(v) })),
      },
      {
        key: 'status',
        label: 'Current status',
        options: uniqueSorted(vendors.flatMap(vendorCurrentStatuses)).map((v) => ({ value: v, label: humanize(v) })),
      },
      {
        key: 'directness',
        label: 'Directness',
        options: uniqueSorted(vendors.flatMap(vendorDirectness)).map((v) => ({ value: v, label: humanize(v) })),
      },
      {
        key: 'domain',
        label: 'Domain',
        options: uniqueSorted(vendors.flatMap(vendorDomainIds)).map((id) => ({ value: id, label: getDomain(id)?.domain_name ?? id })),
      },
      {
        key: 'geography',
        label: 'Geography',
        options: uniqueSorted(vendors.flatMap(vendorGeographies)).map((v) => ({ value: v, label: v })),
      },
      {
        key: 'evidence',
        label: 'Evidence status',
        options: uniqueSorted(vendors.flatMap(vendorEvidenceStatuses)).map((v) => ({ value: v, label: humanize(v) })),
      },
      {
        key: 'year',
        label: 'Known since',
        options: uniqueSorted(vendors.flatMap(vendorKnownSinceYears)).map((v) => ({ value: v, label: v })),
      },
      {
        key: 'gap',
        label: 'Open provider gap',
        options: [
          { value: 'yes', label: 'Yes — TO FIND' },
          { value: 'no', label: 'No' },
        ],
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vendors.filter((v) => {
      if (categoryFilter && v.vendor_category !== categoryFilter) return false;
      if (roleFilter && !vendorProviderRoles(v).includes(roleFilter)) return false;
      if (statusFilter && !vendorCurrentStatuses(v).includes(statusFilter)) return false;
      if (directnessFilter && !vendorDirectness(v).includes(directnessFilter)) return false;
      if (domainFilter && !vendorDomainIds(v).includes(domainFilter)) return false;
      if (geographyFilter && !vendorGeographies(v).includes(geographyFilter)) return false;
      if (evidenceFilter && !vendorEvidenceStatuses(v).includes(evidenceFilter)) return false;
      if (yearFilter && !vendorKnownSinceYears(v).includes(yearFilter)) return false;
      if (gapFilter && vendorHasOpenProviderGap(v) !== (gapFilter === 'yes')) return false;
      if (q && !v.vendor_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, categoryFilter, roleFilter, statusFilter, directnessFilter, domainFilter, geographyFilter, evidenceFilter, yearFilter, gapFilter]);

  const columns: DataTableColumn<Vendor>[] = [
    {
      key: 'name',
      label: 'Vendor',
      sortValue: (v) => v.vendor_name,
      render: (v) => (
        <span className={pageStyles.nameCell}>
          <VendorLogo vendorId={v.vendor_id} size={16} />
          {v.vendor_name}
        </span>
      ),
    },
    { key: 'category', label: 'Category', sortValue: (v) => v.vendor_category, render: (v) => v.vendor_category },
    {
      key: 'relationships',
      label: 'Commercial relationships',
      sortValue: (v) => getCommercialRelationshipsForVendor(v.vendor_id).length,
      render: (v) => {
        const rels = getCommercialRelationshipsForVendor(v.vendor_id);
        return rels.length > 0 ? rels.map((r) => humanize(r.relationship_type)).join(', ') : '—';
      },
    },
    {
      key: 'systems',
      label: 'Systems',
      sortValue: (v) => getComponentsForVendor(v.vendor_id).length,
      render: (v) => getComponentsForVendor(v.vendor_id).length,
    },
  ];

  const selectedVendor = vendorId ? getVendor(vendorId) : undefined;

  return (
    <div className={pageStyles.page}>
      <PageHeader title="Suppliers" subtitle="Vendors and their commercial relationships with Action." />
      <div className={pageStyles.body}>
        <FilterPanel
          searchValue={search}
          onSearchChange={(value) => setFilter('q', value)}
          searchPlaceholder="Search vendors…"
          fields={filterFields}
          values={{
            category: categoryFilter,
            role: roleFilter,
            status: statusFilter,
            directness: directnessFilter,
            domain: domainFilter,
            geography: geographyFilter,
            evidence: evidenceFilter,
            year: yearFilter,
            gap: gapFilter,
          }}
          onFieldChange={setFilter}
          shownCount={filtered.length}
          totalCount={vendors.length}
        />
        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(v) => v.vendor_id}
          onRowClick={(v) => navigate(`/suppliers/${v.vendor_id}?${searchParams.toString()}`)}
          selectedId={vendorId}
        />
      </div>
      {selectedVendor ? (
        <SupplierDetailDrawer
          vendor={selectedVendor}
          onClose={() => navigate(`/suppliers?${searchParams.toString()}`)}
          onSelectComponent={(id) => navigate(`/systems/${id}`)}
        />
      ) : null}
    </div>
  );
}
