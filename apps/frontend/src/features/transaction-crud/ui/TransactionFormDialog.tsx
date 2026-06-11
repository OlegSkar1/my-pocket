"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { format } from "date-fns";
import type { Transaction } from "@my-pocket/shared-types";
import { useCategories } from "@/entities/category";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
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

  const form = useForm<TransactionFormValues>({
    resolver: standardSchemaResolver(transactionSchema),
    defaultValues: toFormValues(transaction),
  });

  // При открытии/смене редактируемой транзакции — перезаполнить форму.
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Редактировать транзакцию" : "Новая транзакция"}
          </DialogTitle>
          <DialogDescription>
            Заполните сумму, тип, дату и категорию.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input
                      inputMode="decimal"
                      placeholder="0.00"
                      {...field}
                    />
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
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
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

            <DialogFooter>
              {isEdit && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isPending}
                  onClick={handleDelete}
                  className="sm:mr-auto"
                >
                  Удалить
                </Button>
              )}
              <Button type="submit" disabled={isPending}>
                {isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
