"use client";

import Link from "next/link";
import { ROUTES } from "@/shared/config";
import { Button } from "@/shared/ui/button";

export default function SupportPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Поддержка</h1>
      <p className="text-muted-foreground">Раздел в разработке.</p>
      <Button asChild variant="outline">
        <Link href={ROUTES.home}>На главную</Link>
      </Button>
    </main>
  );
}
