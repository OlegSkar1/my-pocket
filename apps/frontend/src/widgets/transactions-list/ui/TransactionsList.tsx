"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Category, Transaction } from "@my-pocket/shared-types";
import { useCategories } from "@/entities/category";
import { useTransactions } from "@/entities/transaction";
import { useListFilters } from "@/features/transaction-filters";
import { TransactionFormDialog } from "@/features/transaction-crud";
import { cn, formatMoney } from "@/shared/lib";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export function TransactionsList() {
  const filters = useListFilters();
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useTransactions(filters);
  const { data: categories } = useCategories();

  const [editing, setEditing] = useState<Transaction | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories?.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  // Бесконечная подгрузка через IntersectionObserver на маркере в конце списка.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const openEdit = (transaction: Transaction) => {
    setEditing(transaction);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Транзакции</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Нет транзакций за выбранный период
          </p>
        ) : (
          <>
            {items.map((transaction) => {
              const category = categoryMap.get(transaction.categoryId);
              const isExpense = transaction.type === "EXPENSE";
              return (
                <button
                  key={transaction.id}
                  onClick={() => openEdit(transaction)}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition hover:bg-accent"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
                    style={{ backgroundColor: `${category?.color ?? "#888"}33` }}
                  >
                    {category?.icon ?? "💸"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {transaction.description || category?.name || "Без названия"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(transaction.date), "d MMMM yyyy", {
                        locale: ru,
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 font-semibold",
                      isExpense ? "text-chart-expense" : "text-chart-income",
                    )}
                  >
                    {isExpense ? "−" : "+"}
                    {formatMoney(transaction.amount)}
                  </span>
                </button>
              );
            })}

            <div ref={sentinelRef} />
            {isFetchingNextPage && <Skeleton className="h-14 w-full" />}
            {!hasNextPage && (
              <p className="py-3 text-center text-xs text-muted-foreground">
                Больше нет транзакций
              </p>
            )}
          </>
        )}
      </CardContent>

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editing}
      />
    </Card>
  );
}
