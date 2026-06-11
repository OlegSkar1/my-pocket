import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse } from "@my-pocket/shared-types";
import type { SessionState } from "./types";

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setSession: (response: AuthResponse) =>
        set({ user: response.user, isAuthenticated: true }),
      clear: () => {
        // Тема — личная настройка; забываем её вместе с сессией.
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("theme");
        }
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: "session" },
  ),
);
