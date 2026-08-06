import type { ProviderOverlay } from '@/lib/providersView';
import { formatProviderRole } from '@/lib/providersView';
import { VendorLogo } from '@/components/logo/VendorLogo';
import { evidenceStatusColor, priorityColor } from '@/lib/catalogueStatusMeta';
import { humanize } from '@/lib/formatting';
import styles from './ProviderOverlayPanel.module.css';

interface ProviderOverlayPanelProps {
  readonly overlay: ProviderOverlay;
}

export function ProviderOverlayPanel({ overlay }: ProviderOverlayPanelProps) {
  const { cards, gaps } = overlay;
  if (cards.length === 0 && gaps.length === 0) {
    return (
      <aside className={styles.panel} data-testid="provider-overlay-panel">
        <h3 className={styles.title}>Delivery partners</h3>
        <p className={styles.empty}>No evidenced provider relationship touches a system in this view yet.</p>
      </aside>
    );
  }

  return (
    <aside className={styles.panel} data-testid="provider-overlay-panel">
      <h3 className={styles.title}>Delivery partners</h3>
      <ul className={styles.list}>
        {cards.map((card) => (
          <li key={card.vendor.vendor_id} className={styles.card} data-testid={`provider-overlay-card-${card.vendor.vendor_id}`}>
            <div className={styles.cardHeader}>
              <VendorLogo vendorId={card.vendor.vendor_id} size={16} />
              <span className={styles.cardName}>{card.vendor.vendor_name}</span>
            </div>
            <span className={styles.roleBadge}>{formatProviderRole(card.relationship)}</span>
            {card.relationship ? (
              <p className={styles.cardMeta}>
                <span className={styles.statusDot} style={{ background: evidenceStatusColor(card.relationship.evidence_status) }} />
                {humanize(card.relationship.current_status)} · {card.relationship.geography_scope || 'Unknown geography'}
              </p>
            ) : null}
          </li>
        ))}
        {gaps.map((gap) => (
          <li key={gap.gap_id} className={styles.gapCard} data-testid={`provider-overlay-gap-${gap.gap_id}`}>
            <div className={styles.cardHeader}>
              <span className={styles.gapPriority} style={{ background: priorityColor(gap.priority) }}>
                {gap.priority}
              </span>
              <span className={styles.cardName}>{gap.gap_title}</span>
            </div>
            <span className={styles.gapBadge}>Provider TO FIND</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
