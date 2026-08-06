import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SearchPalette } from '@/components/search/SearchPalette';
import styles from './AppShell.module.css';

const NAV_ITEMS: ReadonlyArray<{ to: string; label: string }> = [
  { to: '/architecture', label: 'Architecture' },
  { to: '/systems', label: 'Systems' },
  { to: '/suppliers', label: 'Suppliers' },
  { to: '/evidence', label: 'Evidence' },
  { to: '/to-find', label: 'TO FIND' },
];

export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={styles.content}>
      <div className={styles.bar}>
        <div className={styles.brand}>
          <span className={styles.brandName}>ACTION</span>
          <span className={styles.brandSub}>Architecture Workbench</span>
        </div>
        <nav className={styles.nav} aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => [styles.navLink, isActive ? styles.navLinkActive : ''].join(' ')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className={styles.searchButton} onClick={() => setSearchOpen(true)}>
          Search
          <span className={styles.kbd}>⌘K</span>
        </button>
      </div>
      <div className={styles.outletWrapper}>
        <Outlet />
      </div>
      {searchOpen ? <SearchPalette onClose={() => setSearchOpen(false)} /> : null}
    </div>
  );
}
