"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/entities/theme";
import { Button } from "@/shared/ui/button";

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Переключить тему"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
