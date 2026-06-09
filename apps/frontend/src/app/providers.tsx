"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSessionStore } from "@/entities/session";
import { isTokenExpired, removeToken } from "@/shared/lib";
import { ROUTES } from "@/shared/config";

function TokenGuard({ children }: { children: React.ReactNode }) {
  const clear = useSessionStore((s) => s.clear);
  const router = useRouter();

  useEffect(() => {
    if (isTokenExpired()) {
      removeToken();
      clear();
      router.replace(ROUTES.login);
    }
  }, [clear, router]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1 },
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TokenGuard>{children}</TokenGuard>
    </QueryClientProvider>
  );
}
