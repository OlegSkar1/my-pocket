"use client";

import { ChevronRight } from "lucide-react";
import { useTransactionsSummary } from "@/entities/transaction";
import { useFiltersStore, useStatsFilters } from "@/features/transaction-filters";
import { cn, formatMoney } from "@/shared/lib";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export function StatsCards() {
  const filters = useStatsFilters();
  const { data, isLoading } = useTransactionsSummary(filters);
  const selection = useFiltersStore((s) => s.selection);
  const selectCard = useFiltersStore((s) => s.selectCard);

  const cards = [
    {
      type: "EXPENSE" as const,
      title: "Расходы",
      amount: data?.totalExpense,
      dot: "bg-chart-expense",
    },
    {
      type: "INCOME" as const,
      title: "Доходы",
      amount: data?.totalIncome,
      dot: "bg-chart-income",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {cards.map((card) => {
        const active =
          selection?.kind === "card" && selection.type === card.type;
        return (
          <Card
            key={card.type}
            role="button"
            tabIndex={0}
            onClick={() => selectCard(card.type)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") selectCard(card.type);
            }}
            className={cn(
              "group cursor-pointer p-5 transition hover:border-ring/40",
              active && "border-ring ring-2 ring-ring/60",
            )}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className={cn("h-2.5 w-2.5 rounded-full", card.dot)} />
              {card.title}
              <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-9 w-40" />
            ) : (
              <p className="tnum mt-2 text-3xl font-extrabold tracking-tight">
                {formatMoney(card.amount ?? "0")}
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
