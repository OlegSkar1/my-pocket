"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "@my-pocket/shared-types";
import { apiClient } from "@/shared/api";
import { categoryKeys } from "@/entities/category";
import { transactionKeys } from "@/entities/transaction";

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    // Транзакции показывают иконку/имя категории — обновим и их.
    queryClient.invalidateQueries({ queryKey: transactionKeys.all });
  };
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (dto: CreateCategoryDto) =>
      apiClient.post<Category>("/categories", dto),
    onSuccess: () => {
      invalidate();
      toast.success("Категория создана");
    },
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCategoryDto }) =>
      apiClient.patch<Category>(`/categories/${id}`, dto),
    onSuccess: () => {
      invalidate();
      toast.success("Категория обновлена");
    },
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/categories/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Категория удалена");
    },
  });
}
