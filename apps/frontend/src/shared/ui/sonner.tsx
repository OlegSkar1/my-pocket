"use client";

import { Toaster as Sonner } from "sonner";
import { useThemeStore } from "@/entities/theme";
import { useIsMobile } from "@/shared/lib";

type ToasterProps = React.ComponentProps<typeof Sonner>;

function Toaster(props: ToasterProps) {
  const theme = useThemeStore((s) => s.theme);
  const isMobile = useIsMobile();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      richColors
      // На мобиле — сверху, на десктопе — снизу справа (чтобы не перекрывать
      // кнопку «Добавить» в правом верхнем углу).
      position={isMobile ? "top-center" : "bottom-right"}
      {...props}
    />
  );
}

export { Toaster };
