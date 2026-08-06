import { NodeShell } from './NodeShell';
import type { NodeComponentProps } from './types';
import styles from './NodeCard.module.css';

export function GapNode({ node, ...rest }: NodeComponentProps) {
  return (
    <NodeShell node={node} kindClassName={styles.gap} {...rest}>
      <div className={styles.headerRow}>
        <p className={styles.gapTitle}>{node.title}</p>
        {node.gapPriority ? <span className={styles.gapPriority}>{node.gapPriority}</span> : null}
      </div>
      {node.subtitle ? <p className={styles.subtitle}>{node.subtitle}</p> : null}
    </NodeShell>
  );
}
