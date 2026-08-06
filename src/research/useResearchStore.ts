// React bindings for src/research/store.ts. A single subscription point so every component
// that reads merged data re-renders when any mutation commits, without prop-drilling a store.
import { useSyncExternalStore } from 'react';
import { subscribe, getSnapshot } from './store';

/** Re-renders the calling component on every research-store mutation. Read selectors (mergedSources, mergedGap, ...) stay plain functions — call them after this hook to get fresh data on each render. */
export function useResearchStoreVersion(): unknown {
  return useSyncExternalStore(subscribe, getSnapshot);
}
