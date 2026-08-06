import type { ArchitectureGroup } from '@/types/architecture';
import styles from './GroupLayer.module.css';

interface GroupLayerProps {
  readonly groups: readonly ArchitectureGroup[];
}

export function GroupLayer({ groups }: GroupLayerProps) {
  return (
    <>
      {groups.map((group) => (
        <div
          key={group.id}
          className={styles.group}
          style={{ left: group.x, top: group.y, width: group.w, height: group.h }}
          data-testid={`group-${group.id}`}
        >
          <span className={styles.label}>{group.label}</span>
        </div>
      ))}
    </>
  );
}
