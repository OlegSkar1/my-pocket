"use client";

import { useRouter } from "next/navigation";
import { useSessionStore } from "@/entities/session";
import { removeToken } from "@/shared/lib";
import { ROUTES } from "@/shared/config";
import { Button } from "@/shared/ui/button";

export default function HomePage() {
  const { user, clear } = useSessionStore();
  const router = useRouter();

  const handleLogout = () => {
    removeToken();
    clear();
    router.push(ROUTES.login);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">my-pocket</h1>
      {user && (
        <p className="text-muted-foreground">
          Добро пожаловать, <span className="font-medium text-foreground">{user.name}</span>!
        </p>
      )}
      <Button variant="outline" onClick={handleLogout}>
        Выйти
      </Button>
    </main>
  );
}
