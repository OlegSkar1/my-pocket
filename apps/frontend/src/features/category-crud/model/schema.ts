import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Укажите название").max(50, "Не более 50 символов"),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Цвет в формате #RRGGBB"),
  icon: z.string().min(1, "Выберите эмодзи"),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
