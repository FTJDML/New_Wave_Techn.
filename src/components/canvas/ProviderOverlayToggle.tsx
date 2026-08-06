import styles from './ProviderOverlayToggle.module.css';

interface ProviderOverlayToggleProps {
  readonly active: boolean;
  readonly onToggle: () => void;
}

export function ProviderOverlayToggle({ active, onToggle }: ProviderOverlayToggleProps) {
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={onToggle}
      aria-pressed={active}
      data-testid="provider-overlay-toggle"
    >
      <span className={styles.dot} />
      Show delivery partners
    </button>
  );
}
