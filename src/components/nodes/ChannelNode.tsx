import { NodeShell } from './NodeShell';
import type { NodeComponentProps } from './types';
import styles from './NodeCard.module.css';

export function ChannelNode({ node, ...rest }: NodeComponentProps) {
  return (
    <NodeShell node={node} kindClassName={styles.channel} {...rest}>
      <p className={styles.title}>{node.title}</p>
      {node.subtitle ? <p className={styles.subtitle}>{node.subtitle}</p> : null}
    </NodeShell>
  );
}
