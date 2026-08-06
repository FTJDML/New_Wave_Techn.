import styles from './AppHeader.module.css';

interface AppHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly summary?: string;
}

const LEGEND: ReadonlyArray<{ label: string; color: string }> = [
  { label: 'Confirmed current', color: 'var(--color-status-current)' },
  { label: 'Observed / inferred', color: 'var(--color-status-observed)' },
  { label: 'Transition', color: 'var(--color-status-transition)' },
  { label: 'Target', color: 'var(--color-status-target)' },
  { label: 'Legacy / historical', color: 'var(--color-status-legacy)' },
  { label: 'Private confirmation', color: 'var(--color-status-private)' },
  { label: 'TO FIND', color: 'var(--color-gap-border)' },
];

export function AppHeader({ title, subtitle, summary }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.brandName}>ACTION</span>
        <span className={styles.brandSub}>Architecture Workbench</span>
      </div>
      <div className={styles.titles}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        {summary ? <p className={styles.summary} data-testid="view-summary">{summary}</p> : null}
      </div>
      <ul className={styles.legend} aria-label="Status legend">
        {LEGEND.map((item) => (
          <li key={item.label} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: item.color }} aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>
    </header>
  );
}
