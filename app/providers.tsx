"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createSentryQueryClient } from "@/cache/query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createSentryQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
