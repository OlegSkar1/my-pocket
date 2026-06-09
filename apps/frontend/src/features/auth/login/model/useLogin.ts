"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { AuthResponse, LoginDto } from "@my-pocket/shared-types";
import { apiClient } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { setToken } from "@/shared/lib";
import { useSessionStore } from "@/entities/session";

export function useLogin() {
  const setSession = useSessionStore((s) => s.setSession);
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginDto) =>
      apiClient.post<AuthResponse>("/auth/login", data),
    onSuccess: (response) => {
      setToken(response.accessToken);
      setSession(response);
      router.push(ROUTES.home);
    },
  });
}
