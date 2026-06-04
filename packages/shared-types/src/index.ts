// Общие типы и контракты API между фронтендом и бэкендом.
// Расширяется по мере разработки.

export interface Expense {
  id: string;
  title: string;
  amount: string;
  category: string | null;
  spentAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseDto {
  title: string;
  amount: string;
  category?: string;
  spentAt?: string;
}
