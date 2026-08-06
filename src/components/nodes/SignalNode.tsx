import { NodeShell } from './NodeShell';
import { VendorLogo } from '@/components/logo/VendorLogo';
import { evidenceMeta } from './statusMeta';
import type { NodeComponentProps } from './types';
import styles from './NodeCard.module.css';

const ROW_LAYOUT_MIN_WIDTH = 190;

export function SignalNode({ node, ...rest }: NodeComponentProps) {
  const evidence = evidenceMeta(node.evidence);
  const rowLayout = node.w >= ROW_LAYOUT_MIN_WIDTH;
  return (
    <NodeShell node={node} kindClassName={styles.signal} {...rest}>
      <div className={styles.headerRow}>
        <div className={[styles.titleBlock, rowLayout ? styles.titleBlockRow : ''].join(' ')}>
          <VendorLogo vendorId={node.vendorId} size={16} />
          <p className={styles.title}>{node.title}</p>
        </div>
      </div>
      <div className={styles.metaRow}>
        {node.subtitle ? <p className={styles.subtitle}>{node.subtitle}</p> : null}
        {evidence ? (
          <span className={styles.badge} style={{ background: evidence.color }}>
            {evidence.label}
          </span>
        ) : null}
      </div>
    </NodeShell>
  );
}
