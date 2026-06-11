import Image from "next/image";
import { Wallet } from "lucide-react";
import { cn } from "@/shared/lib";

interface LogoProps {
  withText?: boolean;
  className?: string;
}

export function Logo({ withText = true, className }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-expense text-white shadow-sm">
        <Wallet className="h-[18px] w-[18px]" />
      </span>
      {withText && (
        <span className="text-lg font-extrabold tracking-tight">
          my-pocket
        </span>
      )}
    </span>
  );
}

// Полноценный логотип-изображение с тег-лайном. Светлая/тёмная версии
// переключаются по классу .dark (ставится анти-FOUC скриптом до отрисовки).
export function LogoImage({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex overflow-hidden rounded-2xl", className)}>
      <Image
        src="/logo-light.png"
        alt="my-pocket — учёт доходов и расходов"
        width={1536}
        height={1024}
        priority
        className="block h-auto w-80 dark:hidden"
      />
      <Image
        src="/logo-dark.png"
        alt="my-pocket — учёт доходов и расходов"
        width={1536}
        height={1024}
        priority
        className="hidden h-auto w-80 dark:block"
      />
    </span>
  );
}
