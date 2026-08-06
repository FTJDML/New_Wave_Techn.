import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { resolveGateOutcome } from './gate';
import styles from './auth.module.css';

/**
 * Gate for every route that reads private/restricted data (stakeholders, ownership, backup
 * export). See gate.ts's resolveGateOutcome for the decision rules.
 */
export function ProtectedRoute() {
  const { isConfigured, isLoading, user } = useAuth();
  const location = useLocation();
  const outcome = resolveGateOutcome({ isConfigured, isLoading, hasUser: Boolean(user) });

  switch (outcome) {
    case 'not-configured':
      return (
        <div className={styles.notice}>
          <h2 className={styles.noticeTitle}>Persistence is not configured</h2>
          <p className={styles.noticeBody}>
            This page requires a live Supabase project (private stakeholder and ownership data lives there, not in the local
            JSON bundle). Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> — see the README's
            &quot;Setting up Supabase&quot; section — then reload.
          </p>
        </div>
      );
    case 'loading':
      return <div className={styles.notice}>Checking your session…</div>;
    case 'redirect':
      return <Navigate to="/sign-in" replace state={{ from: location }} />;
    case 'allow':
      return <Outlet />;
  }
}
