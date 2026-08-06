import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../src/auth/AuthContext';

afterEach(() => {
  cleanup();
});

// This test environment never sets VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, so
// isSupabaseConfigured is genuinely false here — no mocking needed to exercise the
// "no Supabase project" path, which is also the state every reviewer of this phase sees.
function Probe() {
  const { isConfigured, isLoading, user, signIn, signOut } = useAuth();
  return (
    <div>
      <span data-testid="configured">{String(isConfigured)}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <button
        onClick={() => {
          signIn('a@b.com', 'x').then((result) => {
            document.getElementById('result')!.textContent = result.error ?? 'ok';
          });
        }}
      >
        sign in
      </button>
      <button onClick={() => signOut()}>sign out</button>
      <div id="result" data-testid="result" />
    </div>
  );
}

describe('AuthContext without a configured Supabase project', () => {
  it('reports isConfigured=false, isLoading=false, and no user', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByTestId('configured').textContent).toBe('false');
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('signIn resolves with a clear "not configured" error instead of throwing', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    fireEvent.click(screen.getByText('sign in'));
    await screen.findByText('Supabase is not configured for this deployment.');
  });

  it('signOut resolves without throwing when there is nothing to sign out of', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(() => fireEvent.click(screen.getByText('sign out'))).not.toThrow();
  });

  it('throws when useAuth is called outside an AuthProvider', () => {
    function Bare() {
      useAuth();
      return null;
    }
    expect(() => render(<Bare />)).toThrow('useAuth must be used within an AuthProvider');
  });
});
