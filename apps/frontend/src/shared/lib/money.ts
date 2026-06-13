// Денежные суммы приходят с бэка строкой (Prisma Decimal → string).

const moneyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 2,
});

// Форматирует денежную строку в "1 234,56 ₽".
export function formatMoney(amount: string | number): string {
  const value = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(value)) return moneyFormatter.format(0);
  return moneyFormatter.format(value);
}

// Доля part от total в процентах (0..100). Guard деления на ноль.
export function percent(part: string | number, total: string | number): number {
  const p = typeof part === "number" ? part : Number(part);
  const t = typeof total === "number" ? total : Number(total);
  if (!t || Number.isNaN(t) || Number.isNaN(p)) return 0;
  return (p / t) * 100;
}
