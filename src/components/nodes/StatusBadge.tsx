import styles from './NodeCard.module.css';
import { statusMeta } from './statusMeta';
import type { DeploymentStatus } from '@/types/architecture';

export function StatusBadge({ status }: { readonly status?: DeploymentStatus }) {
  const meta = statusMeta(status);
  if (!meta) return null;
  return (
    <span className={styles.badge} style={{ background: meta.color }}>
      {meta.label}
    </span>
  );
}
