import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate, type Location } from 'react-router-dom';
import { useAuth } from './AuthContext';
import forms from '@/components/forms/forms.module.css';
import styles from './auth.module.css';

export function SignInPage() {
  const { isConfigured, isLoading, user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: Location } | null)?.from;
  const redirectTo = from ? `${from.pathname}${from.search ?? ''}` : '/stakeholders';

  if (!isConfigured) {
    return (
      <div className={styles.notice}>
        <h2 className={styles.noticeTitle}>Persistence is not configured</h2>
        <p className={styles.noticeBody}>
          Sign-in requires a live Supabase project. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>{' '}
          — see the README's &quot;Setting up Supabase&quot; section — then reload.
        </p>
      </div>
    );
  }

  if (!isLoading && user) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className={styles.signInWrapper}>
      <form className={`${forms.panel} ${styles.signInCard}`} onSubmit={handleSubmit}>
        <h2 className={styles.signInTitle}>Sign in</h2>
        <p className={forms.helpText}>Access to stakeholder, ownership and backup data requires an authenticated account.</p>
        <div className={forms.field}>
          <label className={forms.label} htmlFor="signin-email">
            Email
          </label>
          <input
            id="signin-email"
            className={forms.input}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className={`${forms.field} ${styles.spacedTop}`}>
          <label className={forms.label} htmlFor="signin-password">
            Password
          </label>
          <input
            id="signin-password"
            className={forms.input}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error ? (
          <ul className={forms.errorList}>
            <li className={forms.errorItem}>{error}</li>
          </ul>
        ) : null}
        <div className={forms.actions}>
          <button type="submit" className={forms.primaryButton} disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
}
