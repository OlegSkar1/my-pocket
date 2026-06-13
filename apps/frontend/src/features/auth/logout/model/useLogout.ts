"use client";

import { useRouter } from "next/navigation";
import { useSessionStore } from "@/entities/session";
import { removeToken } from "@/shared/lib";
import { ROUTES } from "@/shared/config";

export function useLogout() {
  const clear = useSessionStore((s) => s.clear);
  const router = useRouter();

  return () => {
    removeToken();
    clear();
    router.push(ROUTES.login);
  };
}
