// Pure decision logic behind ProtectedRoute.tsx, split out so the gating rules are
// unit-testable without rendering React, mocking Supabase, or driving a router.
export type GateOutcome = 'not-configured' | 'loading' | 'redirect' | 'allow';

export interface GateState {
  readonly isConfigured: boolean;
  readonly isLoading: boolean;
  readonly hasUser: boolean;
}

/**
 * Order matters: an unconfigured project always wins (there's nothing to sign in to, so a
 * loading/redirect state would be misleading), then a still-resolving session, then the actual
 * sign-in check.
 */
export function resolveGateOutcome(state: GateState): GateOutcome {
  if (!state.isConfigured) return 'not-configured';
  if (state.isLoading) return 'loading';
  if (!state.hasUser) return 'redirect';
  return 'allow';
}
