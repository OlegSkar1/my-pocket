"use client";

import { useEffect, useState } from "react";

// true при ширине < breakpoint (по умолчанию md = 768px).
// Дефолт false (десктоп) совпадает с SSR; корректируется после монтирования.
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isMobile;
}
