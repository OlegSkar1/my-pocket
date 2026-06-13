"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type {
  MonthlyStats,
  PaginatedResult,
  Transaction,
  TransactionsSummary,
} from "@my-pocket/shared-types";
import { apiClient } from "@/shared/api";
import { buildQuery } from "@/shared/lib";
import {
  transactionKeys,
  type StatsFilters,
  type TransactionListFilters,
} from "./keys";

const DEFAULT_LIMIT = 10;

// Список транзакций с бесконечной подгрузкой (offset-пагинация на бэке).
export function useTransactions(filters: TransactionListFilters) {
  const limit = filters.limit ?? DEFAULT_LIMIT;

  return useInfiniteQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<PaginatedResult<Transaction>>(
        `/transactions${buildQuery({
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          type: filters.type,
          categoryIds: filters.categoryIds,
          page: pageParam,
          limit,
        })}`,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
  });
}

export function useTransactionsSummary(filters: StatsFilters) {
  return useQuery({
    queryKey: transactionKeys.summary(filters),
    queryFn: () =>
      apiClient.get<TransactionsSummary>(
        `/transactions/summary${buildQuery({
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          categoryIds: filters.categoryIds,
        })}`,
      ),
  });
}

export function useMonthlyStats(filters: StatsFilters) {
  return useQuery({
    queryKey: transactionKeys.monthly(filters),
    queryFn: () =>
      apiClient.get<MonthlyStats>(
        `/transactions/monthly${buildQuery({
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          categoryIds: filters.categoryIds,
        })}`,
      ),
  });
}
