import type { ArchitectureViewNode } from '@/types/architecture';

export interface NodeComponentProps {
  readonly node: ArchitectureViewNode;
  readonly dimmed: boolean;
  readonly emphasised: boolean;
  readonly onActivate: (id: string) => void;
  readonly onHover: (id: string | null) => void;
}
