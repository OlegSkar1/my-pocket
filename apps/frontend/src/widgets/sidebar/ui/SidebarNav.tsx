"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeadphonesIcon, Home, LogOut, Settings } from "lucide-react";
import { useSessionStore } from "@/entities/session";
import { useLogout } from "@/features/auth/logout";
import { ThemeToggle } from "@/features/theme-toggle";
import { ROUTES } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";

const NAV = [
  { href: ROUTES.home, label: "Главная", icon: Home },
  { href: ROUTES.settings, label: "Настройки", icon: Settings },
  { href: ROUTES.support, label: "Поддержка", icon: HeadphonesIcon },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const user = useSessionStore((s) => s.user);
  const logout = useLogout();
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-2 py-1">
        <Logo />
        <ThemeToggle />
      </div>

      {user && (
        <div className="mt-2 rounded-md bg-accent px-3 py-2">
          <p className="truncate font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      )}

      <nav className="mt-4 flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition hover:bg-accent",
                active && "bg-accent font-medium",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <Button
        variant="ghost"
        className="justify-start gap-3"
        onClick={() => {
          onNavigate?.();
          logout();
        }}
      >
        <LogOut className="h-4 w-4" />
        Выйти
      </Button>
    </div>
  );
}
