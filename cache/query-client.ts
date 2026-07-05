import { QueryClient } from "@tanstack/react-query";

export function createSentryQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        retry: 2,
        staleTime: 1000 * 45
      }
    }
  });
}
