import { NodeShell } from './NodeShell';
import { VendorLogo } from '@/components/logo/VendorLogo';
import { StatusBadge } from './StatusBadge';
import type { NodeComponentProps } from './types';
import styles from './NodeCard.module.css';

const ROW_LAYOUT_MIN_WIDTH = 190;

export function CoreNode({ node, ...rest }: NodeComponentProps) {
  const rowLayout = node.w >= ROW_LAYOUT_MIN_WIDTH;
  return (
    <NodeShell node={node} kindClassName={styles.core} {...rest}>
      <div className={styles.headerRow}>
        <div className={[styles.titleBlock, rowLayout ? styles.titleBlockRow : ''].join(' ')}>
          <VendorLogo vendorId={node.vendorId} size={22} />
          <p className={styles.title}>{node.title}</p>
        </div>
      </div>
      <div className={styles.metaRow}>
        {node.subtitle ? <p className={styles.subtitle}>{node.subtitle}</p> : null}
        <StatusBadge status={node.status} />
      </div>
      {node.modules && node.modules.length > 0 ? (
        <div className={styles.modules}>
          {node.modules.map((module) => (
            <span key={module} className={styles.module}>
              {module}
            </span>
          ))}
        </div>
      ) : null}
    </NodeShell>
  );
}
