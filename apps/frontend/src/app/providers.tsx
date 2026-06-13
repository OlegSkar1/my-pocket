"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useSessionStore } from "@/entities/session";
import { useApplyTheme } from "@/entities/theme";
import { isTokenExpired, removeToken } from "@/shared/lib";
import { ROUTES } from "@/shared/config";
import { Toaster } from "@/shared/ui";

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
  useApplyTheme();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        // Централизованные тосты на любые ошибки запросов/мутаций.
        // ApiError.message уже человекочитаем.
        queryCache: new QueryCache({
          onError: (error) => toast.error(error.message),
        }),
        mutationCache: new MutationCache({
          onError: (error) => toast.error(error.message),
        }),
        defaultOptions: {
          queries: { retry: 1 },
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* Обёртка для vaul: масштабирование фона при выезде дровера снизу. */}
      <div data-vaul-drawer-wrapper="" className="min-h-svh bg-background">
        <TokenGuard>{children}</TokenGuard>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
