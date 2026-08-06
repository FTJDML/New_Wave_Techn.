import type { ReactNode } from 'react';
import type { ArchitectureViewNode } from '@/types/architecture';
import styles from './NodeCard.module.css';

interface NodeShellProps {
  readonly node: ArchitectureViewNode;
  readonly kindClassName: string;
  readonly dimmed: boolean;
  readonly emphasised: boolean;
  readonly onActivate: (id: string) => void;
  readonly onHover: (id: string | null) => void;
  readonly children: ReactNode;
}

export function NodeShell({ node, kindClassName, dimmed, emphasised, onActivate, onHover, children }: NodeShellProps) {
  return (
    <button
      type="button"
      data-architecture-node
      data-testid={`node-${node.id}`}
      className={[styles.card, kindClassName, dimmed ? styles.dimmed : '', emphasised ? styles.emphasised : ''].join(' ')}
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
      onClick={() => onActivate(node.id)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
    >
      {children}
    </button>
  );
}
