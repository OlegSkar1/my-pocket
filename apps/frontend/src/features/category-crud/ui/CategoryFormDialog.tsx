"use client";

import { useEffect } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
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

  useEffect(() => {
    if (open) form.reset(toFormValues(category));
  }, [open, category, form]);

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
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 w-12 text-xl"
                            >
                              {field.value}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <EmojiPicker.Root
                            onEmojiSelect={({ emoji }) => field.onChange(emoji)}
                            className="h-72 w-72"
                          >
                            <EmojiPicker.Search className="m-2 rounded-md border border-input bg-background px-2 py-1 text-sm" />
                            <EmojiPicker.Viewport className="relative flex-1 overflow-y-auto">
                              <EmojiPicker.Loading className="p-2 text-sm text-muted-foreground">
                                Загрузка…
                              </EmojiPicker.Loading>
                              <EmojiPicker.Empty className="p-2 text-sm text-muted-foreground">
                                Не найдено
                              </EmojiPicker.Empty>
                              <EmojiPicker.List />
                            </EmojiPicker.Viewport>
                          </EmojiPicker.Root>
                        </PopoverContent>
                      </Popover>
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
