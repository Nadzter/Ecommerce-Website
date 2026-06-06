"use client";

import * as React from "react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";

import { buildQueryClient } from "@/lib/query-client";

/**
 * Wraps the tree in a React Query client. We build the client lazily so
 * that during SSR each request gets a fresh instance, and on the client
 * the same instance survives navigations.
 */
export function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [client] = React.useState<QueryClient>(() => buildQueryClient());
  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
