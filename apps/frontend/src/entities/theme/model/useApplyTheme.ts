import { useEffect } from "react";
import { systemTheme, useThemeStore } from "./store";

// Применяет класс `dark` к <html> и однократно гидрирует persisted-тему.
export function useApplyTheme(): void {
  const theme = useThemeStore((s) => s.theme);

  // Гидрация после монтирования (persist со skipHydration), чтобы первый
  // клиентский рендер совпал с серверным. Если в localStorage ничего нет —
  // берём системную тему.
  useEffect(() => {
    const hasStored = window.localStorage.getItem("theme") !== null;
    void useThemeStore.persist.rehydrate();
    if (!hasStored) {
      useThemeStore.getState().setTheme(systemTheme());
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
}
