'use client';

import { QueryClient } from '@tanstack/react-query';

// A single module-level QueryClient that the whole app uses so we can
// clear its cache on logout / account switch.
let _queryClient: QueryClient | null = null;

export function setGlobalQueryClient(client: QueryClient) {
  _queryClient = client;
}

export function getGlobalQueryClient(): QueryClient | null {
  return _queryClient;
}

// Removes every cached query and mutation so the next account cannot
// see data fetched under a previous one.
export function clearQueryCache() {
  if (!_queryClient) return;
  _queryClient.removeQueries();
  _queryClient.cancelQueries();
  _queryClient.clear();
  _queryClient.resetQueries();
}
