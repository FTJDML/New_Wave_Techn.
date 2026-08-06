import { useState } from 'react';
import type { ArchitectureViewEdge } from '@/types/architecture';
import { EDGE_STYLES } from './edgeStyles';
import styles from './EdgeLayer.module.css';

interface EdgeLayerProps {
  readonly edges: readonly ArchitectureViewEdge[];
  readonly width: number;
  readonly height: number;
  readonly isEdgeDimmed: (edgeId: string) => boolean;
  readonly isEdgeEmphasised: (edgeId: string) => boolean;
}

function midpoint(points: readonly (readonly [number, number])[]): [number, number] {
  const midIndex = Math.floor((points.length - 1) / 2);
  const [x1, y1] = points[midIndex];
  const [x2, y2] = points[Math.min(midIndex + 1, points.length - 1)];
  return [(x1 + x2) / 2, (y1 + y2) / 2];
}

export function EdgeLayer({ edges, width, height, isEdgeDimmed, isEdgeEmphasised }: EdgeLayerProps) {
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  return (
    <svg
      className={styles.svg}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      data-testid="edge-layer"
    >
      <defs>
        {Object.entries(EDGE_STYLES).map(([type, style]) => (
          <marker
            key={type}
            id={`arrow-${type}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={style.markerColor} />
          </marker>
        ))}
      </defs>
      {edges.map((edge) => {
        const style = EDGE_STYLES[edge.type];
        const pointsAttr = edge.points.map(([x, y]) => `${x},${y}`).join(' ');
        const [labelX, labelY] = midpoint(edge.points);
        const dimmed = isEdgeDimmed(edge.id);
        const emphasised = isEdgeEmphasised(edge.id);
        const labelVisible = hoveredEdgeId === edge.id || emphasised;

        return (
          <g
            key={edge.id}
            className={[styles.edgeGroup, dimmed ? styles.dimmed : '', emphasised ? styles.emphasised : ''].join(' ')}
            data-testid={`edge-${edge.id}`}
          >
            <polyline
              points={pointsAttr}
              fill="none"
              stroke="transparent"
              strokeWidth={10}
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredEdgeId(edge.id)}
              onMouseLeave={() => setHoveredEdgeId(null)}
            />
            <polyline
              points={pointsAttr}
              fill="none"
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              strokeDasharray={style.dashArray}
              markerEnd={`url(#arrow-${edge.type})`}
              style={{ pointerEvents: 'none' }}
            />
            {edge.label ? (
              <text
                x={labelX}
                y={labelY - 6}
                textAnchor="middle"
                className={[styles.label, labelVisible ? styles.labelVisible : ''].join(' ')}
              >
                {edge.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
