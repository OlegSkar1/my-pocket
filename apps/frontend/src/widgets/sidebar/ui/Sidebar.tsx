"use client";

import { SidebarNav } from "./SidebarNav";

// Десктопный сайдбар. На мобиле скрыт — там используется Sheet (mobile-header).
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card p-4 md:block">
      <SidebarNav />
    </aside>
  );
}
