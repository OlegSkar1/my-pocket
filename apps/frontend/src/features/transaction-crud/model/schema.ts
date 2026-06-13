import { z } from "zod";

// Денежная строка: положительное число, до 2 знаков после точки.
const moneyRegex = /^\d+([.,]\d{1,2})?$/;

export const transactionSchema = z.object({
  amount: z
    .string()
    .min(1, "Укажите сумму")
    .refine(
      (v) => moneyRegex.test(v) && Number(v.replace(",", ".")) > 0,
      "Введите корректную сумму больше нуля",
    ),
  type: z.enum(["INCOME", "EXPENSE"]),
  date: z.string().min(1, "Укажите дату"),
  categoryId: z.string().min(1, "Выберите категорию"),
  description: z
    .string()
    .max(255, "Не более 255 символов")
    .optional()
    .or(z.literal("")),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
