import type { ArchitectureViewNode, ViewNodeKind } from '@/types/architecture';
import { ChannelNode } from '@/components/nodes/ChannelNode';
import { CoreNode } from '@/components/nodes/CoreNode';
import { HubNode } from '@/components/nodes/HubNode';
import { SatelliteNode } from '@/components/nodes/SatelliteNode';
import { SignalNode } from '@/components/nodes/SignalNode';
import { TransitionNode } from '@/components/nodes/TransitionNode';
import { GapNode } from '@/components/nodes/GapNode';
import type { NodeComponentProps } from '@/components/nodes/types';

const NODE_COMPONENTS: Readonly<Record<ViewNodeKind, (props: NodeComponentProps) => React.JSX.Element>> = {
  channel: ChannelNode,
  core: CoreNode,
  hub: HubNode,
  satellite: SatelliteNode,
  signal: SignalNode,
  transition: TransitionNode,
  gap: GapNode,
};

interface NodeLayerProps {
  readonly nodes: readonly ArchitectureViewNode[];
  readonly isNodeDimmed: (id: string) => boolean;
  readonly isNodeEmphasised: (id: string) => boolean;
  readonly onActivate: (id: string) => void;
  readonly onHover: (id: string | null) => void;
}

export function NodeLayer({ nodes, isNodeDimmed, isNodeEmphasised, onActivate, onHover }: NodeLayerProps) {
  return (
    <>
      {nodes.map((node) => {
        const Component = NODE_COMPONENTS[node.kind];
        return (
          <Component
            key={node.id}
            node={node}
            dimmed={isNodeDimmed(node.id)}
            emphasised={isNodeEmphasised(node.id)}
            onActivate={onActivate}
            onHover={onHover}
          />
        );
      })}
    </>
  );
}
