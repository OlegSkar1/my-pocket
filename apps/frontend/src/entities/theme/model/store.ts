import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

export interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

// Системная тема — используется как дефолт, если в localStorage пусто.
export function systemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Детерминированный дефолт: и сервер, и первый клиентский рендер дают
      // "light" — иначе hydration mismatch. Реальная тема подхватывается из
      // localStorage в эффекте (skipHydration), а визуально её до гидрации
      // уже применяет анти-FOUC инлайн-скрипт в <head>.
      theme: "light",
      setTheme: (theme) => set({ theme }),
      toggle: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
    }),
    { name: "theme", skipHydration: true },
  ),
);
