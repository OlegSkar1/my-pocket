import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
  agreement: z
    .boolean()
    .refine((v) => v === true, "Необходимо принять условия соглашения"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
