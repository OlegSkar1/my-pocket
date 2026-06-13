"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Category, Transaction } from "@my-pocket/shared-types";
import { useCategories } from "@/entities/category";
import { useTransactions } from "@/entities/transaction";
import { useListFilters } from "@/features/transaction-filters";
import { TransactionFormDialog } from "@/features/transaction-crud";
import { cn, formatMoney, useIsMobile } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export function TransactionsList() {
  const filters = useListFilters();
  const isMobile = useIsMobile();
  // Размер страницы = сколько показываем по умолчанию: 3 на мобиле, 10 на десктопе.
  const pageSize = isMobile ? 3 : 10;
  const [showAll, setShowAll] = useState(false);

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useTransactions({ ...filters, limit: pageSize });
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

  // По умолчанию показываем только первую страницу; «Показать все» разворачивает.
  const visibleItems = showAll ? items : items.slice(0, pageSize);

  // Бесконечная подгрузка только в развёрнутом режиме.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!showAll || !sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [showAll, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const openEdit = (transaction: Transaction) => {
    setEditing(transaction);
    setDialogOpen(true);
  };

  // Кнопка нужна, если есть что разворачивать: есть ещё страницы, уже развёрнуто,
  // либо уже загружено больше, чем показываем по умолчанию.
  const canToggle = showAll || hasNextPage || items.length > pageSize;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Транзакции</CardTitle>
        {canToggle && items.length > 0 && (
          <Button
            variant="link"
            className="h-auto p-0 text-sm"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Свернуть" : "Показать все"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Нет транзакций за выбранный период
          </p>
        ) : (
          <>
            {visibleItems.map((transaction) => {
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

            {showAll && (
              <>
                <div ref={sentinelRef} />
                {isFetchingNextPage && <Skeleton className="h-14 w-full" />}
                {!hasNextPage && (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    Больше нет транзакций
                  </p>
                )}
              </>
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
