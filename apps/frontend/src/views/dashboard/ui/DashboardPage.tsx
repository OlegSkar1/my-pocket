"use client";

import { useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import {
  CategoryFilter,
  PeriodFilter,
  useFiltersStore,
} from "@/features/transaction-filters";
import { TransactionFormDialog } from "@/features/transaction-crud";
import { Sidebar } from "@/widgets/sidebar";
import { MobileHeader } from "@/widgets/mobile-header";
import { StatsCards } from "@/widgets/stats-cards";
import { MonthlyChart } from "@/widgets/monthly-chart";
import { TransactionsList } from "@/widgets/transactions-list";
import { CategoriesPanel } from "@/widgets/categories-panel";
import { Button } from "@/shared/ui/button";

export function DashboardPage() {
  const selection = useFiltersStore((s) => s.selection);
  const resetFilters = useFiltersStore((s) => s.resetFilters);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />

        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <PeriodFilter />
            <CategoryFilter />
            <Button
              variant="ghost"
              className="gap-2 text-muted-foreground"
              onClick={resetFilters}
            >
              <RotateCcw className="h-4 w-4" />
              Сбросить
            </Button>
            <Button className="ml-auto gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Добавить
            </Button>
          </div>

          <StatsCards />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Гистограмма — пока не выбрана карточка/категория. */}
              {selection === null && <MonthlyChart />}
              <TransactionsList />
            </div>
            <div className="lg:col-span-1">
              <CategoriesPanel />
            </div>
          </div>
        </main>
      </div>

      <TransactionFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
