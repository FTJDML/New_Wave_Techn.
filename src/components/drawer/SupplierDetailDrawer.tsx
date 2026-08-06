import { useEffect } from 'react';
import type { Vendor } from '@/types/catalogue';
import { getCommercialRelationshipsForVendor, getComponentsForVendor } from '@/data/fullCatalogue';
import { VendorLogo } from '@/components/logo/VendorLogo';
import { humanize, formatDuration } from '@/lib/formatting';
import styles from './SystemDetailDrawer.module.css';

interface SupplierDetailDrawerProps {
  readonly vendor: Vendor;
  readonly onClose: () => void;
  readonly onSelectComponent: (componentId: string) => void;
}

export function SupplierDetailDrawer({ vendor, onClose, onSelectComponent }: SupplierDetailDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const relationships = getCommercialRelationshipsForVendor(vendor.vendor_id);
  const systemComponents = getComponentsForVendor(vendor.vendor_id);

  return (
    <>
      <button type="button" className={styles.overlay} aria-label="Close supplier detail" onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-label={`${vendor.vendor_name} detail`} data-testid="supplier-detail-drawer">
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className={styles.header}>
          <VendorLogo vendorId={vendor.vendor_id} size={26} />
          <div>
            <p className={styles.title}>{vendor.vendor_name}</p>
            <p className={styles.productName}>{vendor.vendor_category}</p>
          </div>
        </div>

        {vendor.website_url ? (
          <p className={styles.badgeRow}>
            <a className={styles.link} href={vendor.website_url} target="_blank" rel="noreferrer">
              {vendor.website_url} ↗
            </a>
          </p>
        ) : null}

        {vendor.action_relationship_summary ? (
          <>
            <p className={styles.sectionTitle}>Relationship summary</p>
            <p className={styles.description}>{vendor.action_relationship_summary}</p>
          </>
        ) : null}

        <p className={styles.sectionTitle}>Commercial relationships</p>
        {relationships.length > 0 ? (
          <ul className={styles.list}>
            {relationships.map((r) => {
              const duration = formatDuration(r.relationship_duration_years_json, r.start_precision);
              return (
                <li key={r.relationship_id} className={styles.listItem}>
                  <div className={styles.listItemTitle}>{humanize(r.relationship_type)}</div>
                  <div className={styles.listItemMeta}>{r.scope_summary}</div>
                  <div className={styles.listItemMeta}>
                    {humanize(r.current_status)} · {humanize(r.directness)}
                    {r.start_year ? ` · since ${r.start_year}` : ''}
                    {duration ? ` · ${duration}` : ''}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.emptySection}>No commercial relationship records.</p>
        )}

        <p className={styles.sectionTitle}>Systems from this vendor</p>
        {systemComponents.length > 0 ? (
          <ul className={styles.list}>
            {systemComponents.map((c) => (
              <li key={c.component_id} className={styles.listItem}>
                <button type="button" className={styles.link} onClick={() => onSelectComponent(c.component_id)}>
                  {c.display_name}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptySection}>No systems recorded for this vendor.</p>
        )}
      </aside>
    </>
  );
}
