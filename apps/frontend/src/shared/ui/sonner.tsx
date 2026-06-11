"use client";

import { Toaster as Sonner } from "sonner";
import { useThemeStore } from "@/entities/theme";

type ToasterProps = React.ComponentProps<typeof Sonner>;

function Toaster(props: ToasterProps) {
  const theme = useThemeStore((s) => s.theme);

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      richColors
      position="top-right"
      {...props}
    />
  );
}

export { Toaster };
