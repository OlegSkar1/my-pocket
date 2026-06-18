"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
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
  return format(parse(month, "yyyy-MM", new Date()), "LLL", { locale: ru });
}

// Маркер-точка с подписью для легенды.
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
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
  // Самый свежий месяц выделяем насыщенным цветом, прочие — пастелью.
  const lastIndex = chartData.length - 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Динамика по месяцам</CardTitle>
        <div className="flex items-center gap-4">
          <LegendDot color="var(--chart-expense)" label="Расход" />
          <LegendDot color="var(--chart-income)" label="Доход" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !hasData ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Нет данных за выбранный период
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={chartData} barGap={4} barCategoryGap="28%">
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                dy={6}
                className="capitalize"
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", radius: 12 }}
                formatter={(value) => formatMoney(Number(value))}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  boxShadow: "0 8px 24px -12px rgba(16,18,40,0.25)",
                  color: "var(--card-foreground)",
                }}
                labelStyle={{ color: "var(--muted-foreground)", textTransform: "capitalize" }}
              />
              <Bar dataKey="expense" name="Расход" radius={[6, 6, 0, 0]} maxBarSize={28}>
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      i === lastIndex
                        ? "var(--chart-expense)"
                        : "var(--chart-expense-soft)"
                    }
                  />
                ))}
              </Bar>
              <Bar dataKey="income" name="Доход" radius={[6, 6, 0, 0]} maxBarSize={28}>
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      i === lastIndex
                        ? "var(--chart-income)"
                        : "var(--chart-income-soft)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
