import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export interface CameraState {
  readonly scale: number;
  readonly tx: number;
  readonly ty: number;
}

interface UseCameraOptions {
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly minScale: number;
  readonly maxScale: number;
}

function computeFitScale(
  containerW: number,
  containerH: number,
  canvasW: number,
  canvasH: number,
  minScale: number,
  maxScale: number,
): number {
  if (containerW <= 0 || containerH <= 0) return minScale;
  const fit = Math.min(containerW / canvasW, containerH / canvasH);
  return Math.min(maxScale, Math.max(minScale, fit));
}

/**
 * Owns pan/zoom camera state for the fixed-size logical canvas. On mount and on resize,
 * the camera fits and centers the whole canvas inside the viewport (so the full
 * architecture is visible without manual zoom), while still allowing the user to pan
 * and zoom freely afterwards. Reset returns to that fitted, centered state.
 */
export function useCamera(containerRef: React.RefObject<HTMLDivElement | null>, options: UseCameraOptions) {
  const { canvasWidth, canvasHeight, minScale, maxScale } = options;
  const [camera, setCamera] = useState<CameraState>({ scale: minScale, tx: 0, ty: 0 });
  const dragState = useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const fitAndCenter = useCallback((): CameraState => {
    const container = containerRef.current;
    const containerW = container?.clientWidth ?? 0;
    const containerH = container?.clientHeight ?? 0;
    const scale = computeFitScale(containerW, containerH, canvasWidth, canvasHeight, minScale, maxScale);
    const tx = (containerW - canvasWidth * scale) / 2;
    const ty = (containerH - canvasHeight * scale) / 2;
    return { scale, tx, ty };
  }, [containerRef, canvasWidth, canvasHeight, minScale, maxScale]);

  const reset = useCallback(() => {
    setCamera(fitAndCenter());
  }, [fitAndCenter]);

  useLayoutEffect(() => {
    // The initial camera fit depends on the container's rendered size, which only exists
    // after the DOM has mounted — this can't be derived during render, so measuring and
    // setting it here (before paint, via useLayoutEffect) is the correct escape hatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reset();
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => reset());
    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pointerX = clientX - rect.left;
      const pointerY = clientY - rect.top;

      setCamera((prev) => {
        const newScale = Math.min(maxScale, Math.max(minScale, prev.scale * factor));
        const canvasX = (pointerX - prev.tx) / prev.scale;
        const canvasY = (pointerY - prev.ty) / prev.scale;
        return {
          scale: newScale,
          tx: pointerX - canvasX * newScale,
          ty: pointerY - canvasY * newScale,
        };
      });
    },
    [containerRef, minScale, maxScale],
  );

  const zoomIn = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.2);
  }, [containerRef, zoomAt]);

  const zoomOut = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / 1.2);
  }, [containerRef, zoomAt]);

  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const factor = Math.exp(-event.deltaY * 0.0015);
      zoomAt(event.clientX, event.clientY, factor);
    },
    [zoomAt],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (target.closest('[data-architecture-node]')) return;
      dragState.current = { startX: event.clientX, startY: event.clientY, startTx: camera.tx, startTy: camera.ty };
      setIsPanning(true);
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    },
    [camera.tx, camera.ty],
  );

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;
    setCamera((prev) => ({ ...prev, tx: dragState.current!.startTx + dx, ty: dragState.current!.startTy + dy }));
  }, []);

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = null;
    setIsPanning(false);
    if ((event.target as HTMLElement).hasPointerCapture?.(event.pointerId)) {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    }
  }, []);

  return { camera, reset, zoomIn, zoomOut, isPanning, handlers: { onWheel, onPointerDown, onPointerMove, onPointerUp } };
}
