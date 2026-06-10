// Общие типы и контракты API между фронтендом и бэкендом.
// Расширяется по мере разработки.

// --- Auth ---

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: Pick<User, "id" | "name" | "email">;
}

// --- Categories ---

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  color: string;
  icon: string;
}

export interface UpdateCategoryDto {
  name?: string;
  color?: string;
  icon?: string;
}

// --- Expenses ---

export interface Expense {
  id: string;
  title: string;
  amount: string;
  categoryId: string | null;
  spentAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseDto {
  title: string;
  amount: string;
  categoryId?: string;
  spentAt?: string;
}

// --- Transactions ---

export type TransactionType = "INCOME" | "EXPENSE";

export interface Transaction {
  id: string;
  amount: string; // Decimal → string
  type: TransactionType;
  description: string | null;
  date: string; // ISO
  categoryId: string;
  userId: string;
  createdAt: string;
}

export interface CreateTransactionDto {
  amount: string;
  type: TransactionType;
  description?: string;
  date: string;
  categoryId: string;
}

export interface UpdateTransactionDto {
  amount?: string;
  type?: TransactionType;
  description?: string;
  date?: string;
  categoryId?: string;
}

export interface TransactionsQuery {
  dateFrom?: string;
  dateTo?: string;
  type?: TransactionType;
  categoryId?: string;
}

export interface CategorySummary {
  categoryId: string;
  totalIncome: string;
  totalExpense: string;
}

export interface TransactionsSummary {
  totalIncome: string;
  totalExpense: string;
  balance: string;
  byCategory: CategorySummary[];
}
