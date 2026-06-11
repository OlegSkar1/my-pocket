"use client";

import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useTransactionsSummary } from "@/entities/transaction";
import { useFiltersStore, useStatsFilters } from "@/features/transaction-filters";
import { cn, formatMoney } from "@/shared/lib";
import { Card, CardContent } from "@/shared/ui/card";
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
      icon: ArrowDownCircle,
      accent: "text-chart-expense",
    },
    {
      type: "INCOME" as const,
      title: "Доходы",
      amount: data?.totalIncome,
      icon: ArrowUpCircle,
      accent: "text-chart-income",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon;
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
              "cursor-pointer transition hover:border-ring",
              active && "border-ring ring-2 ring-ring",
            )}
          >
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                {isLoading ? (
                  <Skeleton className="mt-2 h-7 w-32" />
                ) : (
                  <p className="mt-1 text-2xl font-semibold">
                    {formatMoney(card.amount ?? "0")}
                  </p>
                )}
              </div>
              <Icon className={cn("h-8 w-8", card.accent)} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
