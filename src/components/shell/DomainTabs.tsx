import { Link } from 'react-router-dom';
import styles from './DomainTabs.module.css';

export type DomainTabKey = 'total' | 'store' | 'digital' | 'erp-supply' | 'data' | 'people-service' | 'foundation';

const TABS: ReadonlyArray<{ key: DomainTabKey; to: string; label: string }> = [
  { key: 'total', to: '/architecture', label: 'Total Architecture' },
  { key: 'store', to: '/architecture/store', label: 'Store & Checkout' },
  { key: 'digital', to: '/architecture/digital', label: 'Digital Experience' },
  { key: 'erp-supply', to: '/architecture/erp-supply', label: 'ERP & Supply' },
  { key: 'data', to: '/architecture/data', label: 'Data & Intelligence' },
  { key: 'people-service', to: '/architecture/people-service', label: 'People & Service' },
  { key: 'foundation', to: '/architecture/foundation', label: 'Foundation' },
];

export function DomainTabs({ current }: { readonly current: DomainTabKey }) {
  return (
    <nav className={styles.tabs} aria-label="Architecture views">
      {TABS.map((tab) => (
        <Link key={tab.key} to={tab.to} className={[styles.tab, tab.key === current ? styles.tabActive : ''].join(' ')}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
