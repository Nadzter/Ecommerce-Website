import { QueryClient } from "@tanstack/react-query";

/**
 * Build a fresh React Query client. Each browser tab gets its own
 * instance, mirrored once into the SSR cache so hydration matches.
 */
export function buildQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
