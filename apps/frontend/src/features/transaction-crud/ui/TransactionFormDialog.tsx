"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { Transaction } from "@my-pocket/shared-types";
import { useCategories } from "@/entities/category";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Calendar } from "@/shared/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerNested,
  DrawerTitle,
} from "@/shared/ui/drawer";
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

export function TransactionFormDialog({ open, onOpenChange, transaction }: Props) {
  const { data: categories } = useCategories();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const remove = useDeleteTransaction();
  const isEdit = Boolean(transaction);
  const [dateOpen, setDateOpen] = useState(false);

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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {isEdit ? "Редактировать транзакцию" : "Новая транзакция"}
          </DrawerTitle>
          <DrawerDescription>
            Заполните сумму, тип, дату и категорию.
          </DrawerDescription>
        </DrawerHeader>

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
                    {/* Календарь — вложенный дровер. Его свайп/закрытие
                        не закрывает родительский дровер транзакции. */}
                    <DrawerNested open={dateOpen} onOpenChange={setDateOpen}>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start gap-2 font-normal"
                          onClick={() => setDateOpen(true)}
                        >
                          <CalendarIcon className="h-4 w-4" />
                          {format(parseISO(field.value), "d MMMM yyyy", {
                            locale: ru,
                          })}
                        </Button>
                      </FormControl>
                      <DrawerContent>
                        <DrawerHeader>
                          <DrawerTitle>Выберите дату</DrawerTitle>
                        </DrawerHeader>
                        <div className="flex justify-center px-5 pb-6">
                          <Calendar
                            mode="single"
                            selected={parseISO(field.value)}
                            defaultMonth={parseISO(field.value)}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(format(date, "yyyy-MM-dd"));
                                setDateOpen(false);
                              }
                            }}
                          />
                        </div>
                      </DrawerContent>
                    </DrawerNested>
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

            <DrawerFooter>
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
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
