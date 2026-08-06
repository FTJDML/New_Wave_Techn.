import { useEffect } from 'react';
import { totalArchitectureView } from '@/data/curatedView';
import { resolveCatalogueRefs } from '@/data/catalogueIndex';
import { VendorLogo } from '@/components/logo/VendorLogo';
import { statusMeta, evidenceMeta } from '@/components/nodes/statusMeta';
import styles from './DetailDrawer.module.css';

interface DetailDrawerProps {
  readonly nodeId: string | null;
  readonly onClose: () => void;
}

export function DetailDrawer({ nodeId, onClose }: DetailDrawerProps) {
  const node = nodeId ? totalArchitectureView.nodes.find((n) => n.id === nodeId) : undefined;

  useEffect(() => {
    if (!node) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [node, onClose]);

  if (!node) return null;

  const status = statusMeta(node.status);
  const evidence = evidenceMeta(node.evidence);
  const catalogueRecords = resolveCatalogueRefs(node.catalogRefs);

  return (
    <>
      <button type="button" className={styles.overlay} aria-label="Close detail panel" onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-label={`${node.title} detail`} data-testid="detail-drawer">
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className={styles.header}>
          <VendorLogo vendorId={node.vendorId} size={28} />
          <div>
            <p className={styles.title}>{node.title}</p>
          </div>
        </div>
        {node.subtitle ? <p className={styles.subtitle}>{node.subtitle}</p> : null}

        <div className={styles.badgeRow}>
          {status ? (
            <span className={styles.badge} style={{ background: status.color }}>
              {status.label}
            </span>
          ) : null}
          {evidence ? (
            <span className={styles.badge} style={{ background: evidence.color }}>
              {evidence.label}
            </span>
          ) : null}
          {node.gapPriority ? (
            <span className={styles.badge} style={{ background: 'var(--color-gap-border)' }}>
              Priority {node.gapPriority}
            </span>
          ) : null}
        </div>

        {node.modules && node.modules.length > 0 ? (
          <>
            <p className={styles.sectionTitle}>Modules</p>
            <ul className={styles.moduleList}>
              {node.modules.map((module) => (
                <li key={module} className={styles.moduleItem}>
                  {module}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {catalogueRecords.length > 0 ? (
          <>
            <p className={styles.sectionTitle}>Represents (research catalogue)</p>
            <ul className={styles.refList}>
              {catalogueRecords.map((record) => (
                <li key={record.id} className={styles.refItem}>
                  {record.displayName}
                  {record.vendorName ? <div className={styles.refVendor}>{record.vendorName}</div> : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </aside>
    </>
  );
}
