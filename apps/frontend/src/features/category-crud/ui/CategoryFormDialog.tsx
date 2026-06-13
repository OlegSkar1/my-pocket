"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { EmojiPicker } from "frimousse";
import type { Category } from "@my-pocket/shared-types";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/shared/ui/responsive-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { useCreateCategory, useUpdateCategory } from "../model/mutations";
import { categorySchema, type CategoryFormValues } from "../model/schema";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

function toFormValues(category?: Category | null): CategoryFormValues {
  return {
    name: category?.name ?? "",
    color: category?.color ?? PRESET_COLORS[0],
    icon: category?.icon ?? "🛒",
  };
}

export function CategoryFormDialog({ open, onOpenChange, category }: Props) {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const isEdit = Boolean(category);

  const form = useForm<CategoryFormValues>({
    resolver: standardSchemaResolver(categorySchema),
    defaultValues: toFormValues(category),
  });

  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (open) form.reset(toFormValues(category));
  }, [open, category, form]);

  // Сброс пикера при закрытии (в обработчике, а не в эффекте).
  const handleOpenChange = (next: boolean) => {
    if (!next) setPickerOpen(false);
    onOpenChange(next);
  };

  const onSubmit = (values: CategoryFormValues) => {
    const onSuccess = () => onOpenChange(false);
    if (isEdit && category) {
      update.mutate({ id: category.id, dto: values }, { onSuccess });
    } else {
      create.mutate(values, { onSuccess });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <ResponsiveModal open={open} onOpenChange={handleOpenChange}>
      <ResponsiveModalContent>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {isEdit ? "Редактировать категорию" : "Новая категория"}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Название, эмодзи-иконка и цвет для категории.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 space-y-4 overflow-y-auto px-5">
              <div className="flex items-end gap-3">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Иконка</FormLabel>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-12 text-xl"
                          onClick={() => setPickerOpen((o) => !o)}
                        >
                          {field.value}
                        </Button>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Название</FormLabel>
                      <FormControl>
                        <Input placeholder="Например, Продукты" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Инлайновый эмодзи-пикер: внутри контента модалки, где скролл
                  колесом разрешён (Popover-портал блокировался react-remove-scroll). */}
              {pickerOpen && (
                <div className="overflow-hidden rounded-md border">
                  <EmojiPicker.Root
                    locale="ru"
                    onEmojiSelect={({ emoji }) => {
                      form.setValue("icon", emoji, { shouldValidate: true });
                      setPickerOpen(false);
                    }}
                    className="flex h-64 w-full flex-col bg-card"
                  >
                    <EmojiPicker.Search
                      placeholder="Поиск…"
                      className="m-2 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none"
                    />
                    <EmojiPicker.Viewport className="relative min-h-0 flex-1 overflow-y-auto">
                      <EmojiPicker.Loading className="p-2 text-sm text-muted-foreground">
                        Загрузка…
                      </EmojiPicker.Loading>
                      <EmojiPicker.Empty className="p-2 text-sm text-muted-foreground">
                        Не найдено
                      </EmojiPicker.Empty>
                      <EmojiPicker.List className="pb-2" />
                    </EmojiPicker.Viewport>
                  </EmojiPicker.Root>
                </div>
              )}

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Цвет</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          style={{ backgroundColor: color }}
                          className={cn(
                            "h-8 w-8 rounded-full border-2 transition",
                            field.value === color
                              ? "border-foreground"
                              : "border-transparent",
                          )}
                          aria-label={color}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <ResponsiveModalFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </ResponsiveModalFooter>
          </form>
        </Form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
