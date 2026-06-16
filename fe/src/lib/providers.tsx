'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, createContext, useContext, useCallback } from 'react';

interface ClearCacheContextType {
  clearAllCache: () => void;
}

const ClearCacheContext = createContext<ClearCacheContextType>({
  clearAllCache: () => {},
});

export function useClearCache() {
  return useContext(ClearCacheContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  );

  const clearAllCache = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  return (
    <ClearCacheContext.Provider value={{ clearAllCache }}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ClearCacheContext.Provider>
  );
}