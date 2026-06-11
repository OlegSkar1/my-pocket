"use client";

import { create } from "zustand";
import { endOfMonth, format, startOfMonth } from "date-fns";
import type { TransactionType } from "@my-pocket/shared-types";

// Drill-down: либо клик по категории, либо по карточке Расходы/Доходы.
export type Selection =
  | { kind: "category"; categoryId: string }
  | { kind: "card"; type: TransactionType }
  | null;

export interface FiltersState {
  dateFrom: string; // yyyy-MM-dd
  dateTo: string; // yyyy-MM-dd
  categoryIds: string[]; // мультивыбор
  selection: Selection;
  setPeriod: (from: string, to: string) => void;
  setCategoryIds: (ids: string[]) => void;
  selectCategory: (categoryId: string) => void;
  selectCard: (type: TransactionType) => void;
  clearSelection: () => void;
}

const now = new Date();
const defaultFrom = format(startOfMonth(now), "yyyy-MM-dd");
const defaultTo = format(endOfMonth(now), "yyyy-MM-dd");

export const useFiltersStore = create<FiltersState>((set, get) => ({
  dateFrom: defaultFrom,
  dateTo: defaultTo,
  categoryIds: [],
  selection: null,
  // Смена периода/фильтра категорий сбрасывает drill-down.
  setPeriod: (from, to) => set({ dateFrom: from, dateTo: to, selection: null }),
  setCategoryIds: (ids) => set({ categoryIds: ids, selection: null }),
  selectCategory: (categoryId) => {
    const cur = get().selection;
    // Повторный клик по той же категории — снять выбор.
    if (cur?.kind === "category" && cur.categoryId === categoryId) {
      set({ selection: null });
    } else {
      set({ selection: { kind: "category", categoryId } });
    }
  },
  selectCard: (type) => {
    const cur = get().selection;
    if (cur?.kind === "card" && cur.type === type) {
      set({ selection: null });
    } else {
      set({ selection: { kind: "card", type } });
    }
  },
  clearSelection: () => set({ selection: null }),
}));
