"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parse } from "date-fns";
import { ru } from "date-fns/locale";
import { useMonthlyStats } from "@/entities/transaction";
import { useStatsFilters } from "@/features/transaction-filters";
import { formatMoney } from "@/shared/lib";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

// "YYYY-MM" → "июн 2026"
function monthLabel(month: string): string {
  return format(parse(month, "yyyy-MM", new Date()), "LLL yyyy", { locale: ru });
}

export function MonthlyChart() {
  const filters = useStatsFilters();
  const { data, isLoading } = useMonthlyStats(filters);

  const chartData = useMemo(
    () =>
      (data ?? []).map((stat) => ({
        month: monthLabel(stat.month),
        expense: Number(stat.expense),
        income: Number(stat.income),
      })),
    [data],
  );

  const hasData = chartData.some((d) => d.expense > 0 || d.income > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Динамика по месяцам</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : !hasData ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Нет данных за выбранный период
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={288}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                className="capitalize"
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                width={48}
              />
              <Tooltip
                formatter={(value) => formatMoney(Number(value))}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--card-foreground)",
                }}
              />
              <Bar
                dataKey="expense"
                name="Расход"
                fill="var(--chart-expense)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="income"
                name="Доход"
                fill="var(--chart-income)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
