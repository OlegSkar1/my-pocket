"use client";

import { ChevronDown, ListFilter } from "lucide-react";
import { useCategories } from "@/entities/category";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { useFiltersStore } from "../model/store";

export function CategoryFilter() {
  const { data: categories } = useCategories();
  const categoryIds = useFiltersStore((s) => s.categoryIds);
  const setCategoryIds = useFiltersStore((s) => s.setCategoryIds);

  const toggle = (id: string) => {
    setCategoryIds(
      categoryIds.includes(id)
        ? categoryIds.filter((c) => c !== id)
        : [...categoryIds, id],
    );
  };

  const label = categoryIds.length
    ? `Категории: ${categoryIds.length}`
    : "Все категории";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start gap-2 font-normal">
          <ListFilter className="h-4 w-4 text-muted-foreground" />
          {label}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-80 overflow-y-auto">
        {!categories?.length ? (
          <p className="text-sm text-muted-foreground">Категорий пока нет</p>
        ) : (
          <div className="flex flex-col gap-2">
            {categoryIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => setCategoryIds([])}
              >
                Сбросить
              </Button>
            )}
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 hover:bg-accent"
              >
                <Checkbox
                  checked={categoryIds.includes(category.id)}
                  onCheckedChange={() => toggle(category.id)}
                />
                <span className="text-base">{category.icon}</span>
                <Label className="cursor-pointer font-normal">
                  {category.name}
                </Label>
              </label>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
