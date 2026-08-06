import styles from './ZoomControls.module.css';

interface ZoomControlsProps {
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onReset: () => void;
}

export function ZoomControls({ onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  return (
    <div className={styles.controls} data-testid="zoom-controls">
      <button type="button" className={styles.button} onClick={onZoomIn} aria-label="Zoom in">
        +
      </button>
      <div className={styles.divider} />
      <button type="button" className={styles.button} onClick={onZoomOut} aria-label="Zoom out">
        −
      </button>
      <div className={styles.divider} />
      <button type="button" className={styles.button} onClick={onReset} aria-label="Reset view">
        ⤾
      </button>
    </div>
  );
}
