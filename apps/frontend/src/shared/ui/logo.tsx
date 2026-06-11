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
