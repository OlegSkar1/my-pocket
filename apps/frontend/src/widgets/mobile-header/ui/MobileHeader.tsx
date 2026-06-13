"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeadphonesIcon,
  Home,
  LogOut,
  Moon,
  Settings,
  Sun,
  User,
} from "lucide-react";
import { useSessionStore } from "@/entities/session";
import { useThemeStore } from "@/entities/theme";
import { useLogout } from "@/features/auth/logout";
import { ROUTES } from "@/shared/config";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

const NAV = [
  { href: ROUTES.home, label: "Главная", icon: Home },
  { href: ROUTES.settings, label: "Настройки", icon: Settings },
  { href: ROUTES.support, label: "Поддержка", icon: HeadphonesIcon },
];

export function MobileHeader() {
  const user = useSessionStore((s) => s.user);
  const logout = useLogout();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
      <Logo />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Меню профиля">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {user && (
            <>
              <DropdownMenuLabel>
                <p className="truncate">{user.name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}

          {NAV.map(({ href, label, icon: Icon }) => (
            <DropdownMenuItem key={href} asChild>
              <Link href={href} data-active={pathname === href}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {/* Тема переключается без закрытия меню. */}
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={logout}>
            <LogOut className="h-4 w-4" />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
