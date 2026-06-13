"use client";

import type {
  StatsFilters,
  TransactionListFilters,
} from "@/entities/transaction";
import { useFiltersStore } from "./store";

// Фильтры для карточек/гистограммы/категорий: период + мультивыбор категорий.
export function useStatsFilters(): StatsFilters {
  const dateFrom = useFiltersStore((s) => s.dateFrom);
  const dateTo = useFiltersStore((s) => s.dateTo);
  const categoryIds = useFiltersStore((s) => s.categoryIds);

  return {
    dateFrom,
    dateTo,
    categoryIds: categoryIds.length ? categoryIds : undefined,
  };
}

// Фильтры для списка: период + мультивыбор, поверх — drill-down.
// Выбор категории сужает до неё; выбор карточки добавляет фильтр по типу.
export function useListFilters(): TransactionListFilters {
  const dateFrom = useFiltersStore((s) => s.dateFrom);
  const dateTo = useFiltersStore((s) => s.dateTo);
  const categoryIds = useFiltersStore((s) => s.categoryIds);
  const selection = useFiltersStore((s) => s.selection);

  const filters: TransactionListFilters = { dateFrom, dateTo };

  if (selection?.kind === "category") {
    filters.categoryIds = [selection.categoryId];
  } else {
    if (categoryIds.length) filters.categoryIds = categoryIds;
    if (selection?.kind === "card") filters.type = selection.type;
  }

  return filters;
}
