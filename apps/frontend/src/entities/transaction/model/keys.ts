import type { TransactionType } from "@my-pocket/shared-types";

// Фильтры, влияющие на выборку (без page — он идёт в pageParam infinite-query).
export interface TransactionListFilters {
  dateFrom?: string;
  dateTo?: string;
  type?: TransactionType;
  categoryIds?: string[];
  limit?: number;
}

export interface StatsFilters {
  dateFrom?: string;
  dateTo?: string;
  categoryIds?: string[];
}

// Префикс ["transactions"] покрывает все списки/summary/monthly при инвалидации.
export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: TransactionListFilters) =>
    [...transactionKeys.all, "list", filters] as const,
  summary: (filters: StatsFilters) =>
    [...transactionKeys.all, "summary", filters] as const,
  monthly: (filters: StatsFilters) =>
    [...transactionKeys.all, "monthly", filters] as const,
};
