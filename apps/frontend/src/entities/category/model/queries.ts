"use client";

import { useQuery } from "@tanstack/react-query";
import type { Category } from "@my-pocket/shared-types";
import { apiClient } from "@/shared/api";

export const categoryKeys = {
  all: ["categories"] as const,
  list: () => [...categoryKeys.all, "list"] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => apiClient.get<Category[]>("/categories"),
  });
}
