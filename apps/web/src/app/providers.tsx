/**
 * App Providers
 *
 * Wraps the application with necessary context providers:
 * - React Query: Data fetching, caching, synchronization
 * - Nuqs: URL state management for shareable links
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/ssr
 * @see https://nuqs.47ng.com/docs/adapters
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState, type ReactNode } from "react";

/**
 * Create QueryClient provider with default options
 *
 * Configuration:
 * - staleTime: 5 minutes (data considered fresh)
 * - gcTime: 10 minutes (cache garbage collection)
 * - retry: 2 attempts on failure
 * - refetchOnWindowFocus: false (avoid unnecessary refetches)
 */
export function Providers({ children }: { children: ReactNode }) {
  // Create QueryClient inside component to ensure one instance per request
  // in RSC (React Server Components) environment
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Consider data fresh for 5 minutes
            staleTime: 5 * 60 * 1000,

            // Keep unused data in cache for 10 minutes before garbage collection
            gcTime: 10 * 60 * 1000,

            // Retry failed requests 2 times
            retry: 2,

            // Don't refetch on window focus (can be overwhelming for users)
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </QueryClientProvider>
  );
}
