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

// --- Expenses ---

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
