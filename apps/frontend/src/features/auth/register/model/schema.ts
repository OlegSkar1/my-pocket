import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Введите имя"),
  email: z.string().email("Введите корректный email"),
  password: z.string().min(8, "Пароль — минимум 8 символов"),
  agreement: z
    .boolean()
    .refine((v) => v === true, "Необходимо принять условия соглашения"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
