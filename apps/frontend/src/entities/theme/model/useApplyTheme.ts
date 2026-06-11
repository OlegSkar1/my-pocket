import { useEffect } from "react";
import { useThemeStore } from "./store";

// Применяет класс `dark` к <html> при каждой смене темы.
export function useApplyTheme(): void {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);
}
