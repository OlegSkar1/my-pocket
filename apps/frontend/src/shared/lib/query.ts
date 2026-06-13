// Сериализация query-параметров в строку. Массивы (например categoryIds)
// разворачиваются в повторяющиеся ключи: ?categoryIds=a&categoryIds=b.
// undefined/null/"" пропускаются.
export function buildQuery(
  params: Record<string, string | number | boolean | string[] | undefined>,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, item);
    } else {
      search.append(key, String(value));
    }
  }

  const str = search.toString();
  return str ? `?${str}` : "";
}
