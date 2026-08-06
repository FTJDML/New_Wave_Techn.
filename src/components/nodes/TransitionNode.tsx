import { NodeShell } from './NodeShell';
import { VendorLogo } from '@/components/logo/VendorLogo';
import { StatusBadge } from './StatusBadge';
import type { NodeComponentProps } from './types';
import styles from './NodeCard.module.css';

const ROW_LAYOUT_MIN_WIDTH = 190;

export function TransitionNode({ node, ...rest }: NodeComponentProps) {
  const [legacy, target] = node.modules ?? [];
  const rowLayout = node.w >= ROW_LAYOUT_MIN_WIDTH;
  return (
    <NodeShell node={node} kindClassName={styles.transition} {...rest}>
      <div className={styles.headerRow}>
        <div className={[styles.titleBlock, rowLayout ? styles.titleBlockRow : ''].join(' ')}>
          <VendorLogo vendorId={node.vendorId} size={16} />
          <p className={styles.title}>{node.title}</p>
        </div>
      </div>
      <div className={styles.metaRow}>
        {node.subtitle ? <p className={styles.subtitle}>{node.subtitle}</p> : null}
        <StatusBadge status={node.status} />
      </div>
      {legacy && target ? (
        <p className={styles.transitionArrow}>
          <span className={styles.legacy}>{legacy}</span>
          <span aria-hidden="true">&rarr;</span>
          <span className={styles.futureTarget}>{target}</span>
        </p>
      ) : null}
    </NodeShell>
  );
}
