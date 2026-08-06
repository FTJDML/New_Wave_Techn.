import { useCallback, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import type { ArchitectureView } from '@/types/architecture';
import { useCamera } from '@/hooks/useCamera';
import { useHighlight } from '@/hooks/useHighlight';
import { buildProviderOverlay } from '@/lib/providersView';
import { GroupLayer } from './GroupLayer';
import { EdgeLayer } from './EdgeLayer';
import { NodeLayer } from './NodeLayer';
import { ZoomControls } from '@/components/shell/ZoomControls';
import { ProviderOverlayToggle } from './ProviderOverlayToggle';
import { ProviderOverlayPanel } from './ProviderOverlayPanel';
import styles from './ArchitectureCanvas.module.css';

interface ArchitectureCanvasProps {
  readonly view: ArchitectureView;
  readonly onSelectNode: (id: string) => void;
  readonly exportFileName?: string;
}

export function ArchitectureCanvas({ view, onSelectNode, exportFileName = 'action-architecture.png' }: ArchitectureCanvasProps) {
  const { canvas, groups, nodes, edges } = view;
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const { camera, reset, zoomIn, zoomOut, isPanning, handlers } = useCamera(containerRef, {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    minScale: canvas.minScale,
    maxScale: canvas.maxScale,
  });
  const highlight = useHighlight(edges);
  const [showProviders, setShowProviders] = useState(false);
  const providerOverlay = buildProviderOverlay(view);

  const exportPng = useCallback(async () => {
    const layer = layerRef.current;
    if (!layer) return;
    // Exports the full poster at native resolution regardless of the current pan/zoom
    // camera — `style.transform: 'none'` overrides the clone html-to-image rasterizes,
    // so the export is always the complete, untransformed architecture.
    const dataUrl = await toPng(layer, {
      width: canvas.width,
      height: canvas.height,
      style: { transform: 'none' },
      backgroundColor: canvas.background,
      pixelRatio: 2,
    });
    const link = document.createElement('a');
    link.download = exportFileName;
    link.href = dataUrl;
    link.click();
  }, [canvas.width, canvas.height, canvas.background, exportFileName]);

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
        ref={layerRef}
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
          isEdgeDimmed={(id) => showProviders || highlight.isEdgeDimmed(id)}
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
      <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} onExportPng={exportPng} />
      <ProviderOverlayToggle active={showProviders} onToggle={() => setShowProviders((v) => !v)} />
      {showProviders ? <ProviderOverlayPanel overlay={providerOverlay} /> : null}
    </div>
  );
}
