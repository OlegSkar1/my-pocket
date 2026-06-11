"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CreateTransactionDto,
  Transaction,
  UpdateTransactionDto,
} from "@my-pocket/shared-types";
import { apiClient } from "@/shared/api";
import { transactionKeys } from "@/entities/transaction";

function useInvalidateTransactions() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: transactionKeys.all });
}

export function useCreateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: (dto: CreateTransactionDto) =>
      apiClient.post<Transaction>("/transactions", dto),
    onSuccess: () => {
      invalidate();
      toast.success("Транзакция добавлена");
    },
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTransactionDto }) =>
      apiClient.patch<Transaction>(`/transactions/${id}`, dto),
    onSuccess: () => {
      invalidate();
      toast.success("Транзакция обновлена");
    },
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/transactions/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Транзакция удалена");
    },
  });
}
