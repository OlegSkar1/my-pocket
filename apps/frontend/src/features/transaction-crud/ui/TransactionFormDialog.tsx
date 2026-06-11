"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { Transaction } from "@my-pocket/shared-types";
import { useCategories } from "@/entities/category";
import { useIsMobile } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  DrawerContent,
  DrawerHeader,
  DrawerNested,
  DrawerTitle,
} from "@/shared/ui/drawer";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
} from "../model/mutations";
import {
  transactionSchema,
  type TransactionFormValues,
} from "../model/schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
}

function toFormValues(transaction?: Transaction | null): TransactionFormValues {
  if (!transaction) {
    return {
      amount: "",
      type: "EXPENSE",
      date: format(new Date(), "yyyy-MM-dd"),
      categoryId: "",
      description: "",
    };
  }
  return {
    amount: transaction.amount,
    type: transaction.type,
    date: format(new Date(transaction.date), "yyyy-MM-dd"),
    categoryId: transaction.categoryId,
    description: transaction.description ?? "",
  };
}

// Выбор даты: на десктопе — Popover с календарём, на мобиле — вложенный
// Drawer (его свайп/закрытие не закрывает форму).
function DateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date | undefined>();

  const label = format(parseISO(value), "d MMMM yyyy", { locale: ru });
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
      setOpen(false);
    }
  };

  // Инициализация отображаемого месяца при открытии (без эффекта).
  const handleOpenChange = (next: boolean) => {
    if (next) setMonth(parseISO(value));
    setOpen(next);
  };

  const triggerButton = (onClick?: () => void) => (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-start gap-2 font-normal"
      onClick={onClick}
    >
      <CalendarIcon className="h-4 w-4" />
      {label}
    </Button>
  );

  if (isMobile) {
    return (
      <DrawerNested open={open} onOpenChange={setOpen}>
        <FormControl>{triggerButton(() => handleOpenChange(true))}</FormControl>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Выберите дату</DrawerTitle>
          </DrawerHeader>
          <div className="flex justify-center px-5 pb-6">
            <Calendar
              mode="single"
              month={month}
              onMonthChange={setMonth}
              selected={parseISO(value)}
              onSelect={handleSelect}
              disabled={{ after: new Date() }}
            />
          </div>
        </DrawerContent>
      </DrawerNested>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <FormControl>{triggerButton()}</FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parseISO(value)}
          defaultMonth={parseISO(value)}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

export function TransactionFormDialog({ open, onOpenChange, transaction }: Props) {
  const { data: categories } = useCategories();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const remove = useDeleteTransaction();
  const isEdit = Boolean(transaction);

  const form = useForm<TransactionFormValues>({
    resolver: standardSchemaResolver(transactionSchema),
    defaultValues: toFormValues(transaction),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(transaction));
  }, [open, transaction, form]);

  const onSubmit = (values: TransactionFormValues) => {
    const dto = {
      amount: values.amount.replace(",", "."),
      type: values.type,
      date: new Date(values.date).toISOString(),
      categoryId: values.categoryId,
      description: values.description || undefined,
    };

    const onSuccess = () => onOpenChange(false);

    if (isEdit && transaction) {
      update.mutate({ id: transaction.id, dto }, { onSuccess });
    } else {
      create.mutate(dto, { onSuccess });
    }
  };

  const handleDelete = () => {
    if (transaction) {
      remove.mutate(transaction.id, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = create.isPending || update.isPending || remove.isPending;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {isEdit ? "Редактировать транзакцию" : "Новая транзакция"}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Заполните сумму, тип, дату и категорию.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 space-y-4 overflow-y-auto px-5">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EXPENSE">Расход</SelectItem>
                        <SelectItem value="INCOME">Доход</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сумма</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата</FormLabel>
                    <DateField value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Категория</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Назначение</FormLabel>
                    <FormControl>
                      <Input placeholder="Например, продукты" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <ResponsiveModalFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Сохранение..." : "Сохранить"}
              </Button>
              {isEdit && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isPending}
                  onClick={handleDelete}
                >
                  Удалить
                </Button>
              )}
            </ResponsiveModalFooter>
          </form>
        </Form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
