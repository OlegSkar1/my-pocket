"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import type { Category } from "@my-pocket/shared-types";
import { useCategories } from "@/entities/category";
import { useTransactionsSummary } from "@/entities/transaction";
import {
  useFiltersStore,
  useStatsFilters,
} from "@/features/transaction-filters";
import { CategoryFormDialog } from "@/features/category-crud";
import { cn, formatMoney, percent } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export function CategoriesPanel() {
  const filters = useStatsFilters();
  const { data: summary, isLoading } = useTransactionsSummary(filters);
  const { data: categories } = useCategories();
  const selection = useFiltersStore((s) => s.selection);
  const selectCategory = useFiltersStore((s) => s.selectCategory);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories?.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const rows = useMemo(() => {
    if (!summary) return [];
    return summary.byCategory
      .map((row) => {
        const category = categoryMap.get(row.categoryId);
        const total = Number(row.totalExpense) + Number(row.totalIncome);
        return { ...row, category, total };
      })
      .sort((a, b) => b.total - a.total);
  }, [summary, categoryMap]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (category: Category) => {
    setEditing(category);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Категории</CardTitle>
        <Button variant="ghost" size="icon" onClick={openCreate} aria-label="Добавить категорию">
          <Plus className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Нет операций за период
          </p>
        ) : (
          rows.map((row) => {
            const share = percent(row.total, Number(summary?.totalExpense ?? 0) + Number(summary?.totalIncome ?? 0));
            const active =
              selection?.kind === "category" &&
              selection.categoryId === row.categoryId;
            return (
              <div
                key={row.categoryId}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-2 py-2 transition hover:bg-accent",
                  active && "bg-accent",
                )}
              >
                <button
                  onClick={() => selectCategory(row.categoryId)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
                    style={{ backgroundColor: `${row.category?.color ?? "#888"}33` }}
                  >
                    {row.category?.icon ?? "📦"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {row.category?.name ?? "Без категории"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.transactionCount} оп. · {share.toFixed(0)}%
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium">
                    {formatMoney(row.total)}
                  </span>
                </button>
                {row.category && (
                  <button
                    onClick={() => openEdit(row.category!)}
                    className="shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100"
                    aria-label="Редактировать категорию"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </CardContent>

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
      />
    </Card>
  );
}
