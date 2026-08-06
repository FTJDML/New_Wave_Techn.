import { useRef } from 'react';
import { totalArchitectureView } from '@/data/curatedView';
import { useCamera } from '@/hooks/useCamera';
import { useHighlight } from '@/hooks/useHighlight';
import { GroupLayer } from './GroupLayer';
import { EdgeLayer } from './EdgeLayer';
import { NodeLayer } from './NodeLayer';
import { ZoomControls } from '@/components/shell/ZoomControls';
import styles from './ArchitectureCanvas.module.css';

interface ArchitectureCanvasProps {
  readonly onSelectNode: (id: string) => void;
}

export function ArchitectureCanvas({ onSelectNode }: ArchitectureCanvasProps) {
  const { canvas, groups, nodes, edges } = totalArchitectureView;
  const containerRef = useRef<HTMLDivElement>(null);
  const { camera, reset, zoomIn, zoomOut, isPanning, handlers } = useCamera(containerRef, {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    minScale: canvas.minScale,
    maxScale: canvas.maxScale,
  });
  const highlight = useHighlight();

  return (
    <div
      ref={containerRef}
      className={[styles.viewport, isPanning ? styles.panning : ''].join(' ')}
      data-testid="architecture-viewport"
      onWheel={handlers.onWheel}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
    >
      <div
        className={styles.layer}
        data-testid="architecture-layer"
        style={{
          width: canvas.width,
          height: canvas.height,
          background: canvas.background,
          transform: `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.scale})`,
        }}
      >
        <GroupLayer groups={groups} />
        <EdgeLayer
          edges={edges}
          width={canvas.width}
          height={canvas.height}
          isEdgeDimmed={highlight.isEdgeDimmed}
          isEdgeEmphasised={highlight.isEdgeEmphasised}
        />
        <NodeLayer
          nodes={nodes}
          isNodeDimmed={highlight.isNodeDimmed}
          isNodeEmphasised={highlight.isNodeEmphasised}
          onActivate={onSelectNode}
          onHover={highlight.setActiveNodeId}
        />
      </div>
      <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} />
    </div>
  );
}
