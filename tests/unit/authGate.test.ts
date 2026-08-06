import { describe, expect, it } from 'vitest';
import { resolveGateOutcome } from '../../src/auth/gate';

describe('resolveGateOutcome', () => {
  it('returns not-configured when Supabase is not configured, regardless of loading or user state', () => {
    expect(resolveGateOutcome({ isConfigured: false, isLoading: true, hasUser: true })).toBe('not-configured');
    expect(resolveGateOutcome({ isConfigured: false, isLoading: false, hasUser: false })).toBe('not-configured');
  });

  it('returns loading when configured but the session is still resolving', () => {
    expect(resolveGateOutcome({ isConfigured: true, isLoading: true, hasUser: false })).toBe('loading');
    expect(resolveGateOutcome({ isConfigured: true, isLoading: true, hasUser: true })).toBe('loading');
  });

  it('returns redirect when configured, resolved, and signed out', () => {
    expect(resolveGateOutcome({ isConfigured: true, isLoading: false, hasUser: false })).toBe('redirect');
  });

  it('returns allow only when configured, resolved, and signed in', () => {
    expect(resolveGateOutcome({ isConfigured: true, isLoading: false, hasUser: true })).toBe('allow');
  });
});
