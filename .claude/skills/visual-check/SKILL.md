---
name: visual-check
description: Визуально проверить страницу приложения через Playwright MCP — скриншот, консоль, DOM-снапшот, обнаружение ошибок. ПРОАКТИВНО запускать после любых правок UI-компонентов (*.tsx, *.css, globals.css, Tailwind-токены) — не ждать явной просьбы пользователя. Проверять страницу, на которой живёт изменённый компонент; если страница неизвестна — главную (/).
allowed-tools: mcp__playwright__browser_resize mcp__playwright__browser_navigate mcp__playwright__browser_wait_for mcp__playwright__browser_take_screenshot mcp__playwright__browser_snapshot mcp__playwright__browser_console_messages mcp__playwright__browser_fill_form mcp__playwright__browser_click mcp__playwright__browser_hover mcp__playwright__browser_close Bash(find * -type f)
model: sonnet
argument-hint: [url] [viewport]
---

## Аргументы

- `$0` — URL страницы (необязателен). Полный (`http://localhost:3000/login`) или путь (`/login`). Без аргумента — проверить все страницы приложения.
- `$1` — вьюпорт (необязателен): `mobile` (390×844), `tablet` (768×1024), `desktop` (1280×800). Без аргумента — все три.

## Когда запускать проактивно

| Изменённый компонент                                                                                                       | Страница    |
| -------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `widgets/monthly-chart`, `widgets/stats-cards`, `widgets/transactions-list`, `widgets/categories-panel`, `views/dashboard` | `/`         |
| `views/login`                                                                                                              | `/login`    |
| `views/register`                                                                                                           | `/register` |
| Неизвестно                                                                                                                 | `/`         |

Вьюпорт по умолчанию при проактивном запуске — `desktop`.

---

## Шаг 1 — обнаружить страницы (если `$0` не передан)

```bash
find apps/frontend/src/app -name "page.tsx" -o -name "page.ts"
```

Преобразуй пути в маршруты: убери префикс `apps/frontend/src/app` и суффикс `/page.tsx`, `(группы)` → пустая строка, `[param]` → `1`. Добавь `/login`, `/register`, `/settings`, `/support`. Дедуплицируй.

## Шаг 2 — открыть страницу

```
browser_resize  → ширина × высота вьюпорта
browser_navigate → URL (добавь http://localhost:3000 если путь)
browser_wait_for → подождать загрузки (до 5 с)
```

**Авто-логин** — если после навигации URL содержит `/login`, а цель не была `/login`/`/register`:

```
browser_fill_form → Email: oleg@test.com  |  Пароль: password123
browser_click     → button[type=submit]
browser_wait_for  → редирект (до 5 с)
browser_navigate  → вернуться на исходный URL
```

Авто-логин — **один раз** за сессию.

## Шаг 3 — собрать артефакты (параллельно)

```
browser_take_screenshot   → визуальный снимок
browser_snapshot          → DOM-снапшот
browser_console_messages  → уровень "warning"
```

## Шаг 4 — проанализировать

| Статус            | Признак                                                                   |
| ----------------- | ------------------------------------------------------------------------- |
| 🔴 Ошибка         | JS-исключения в консоли; HTTP 4xx/5xx; белый экран; горизонтальный скролл |
| 🟡 Предупреждение | console.warn; битые изображения; нечитаемый контраст                      |
| 🟢 OK             | Страница загружена, контент отображается, ошибок нет                      |

## Шаг 5 — вывести отчёт

Формат — в [template.md](template.md). Пример хорошего отчёта — в [examples/good.check.md](examples/good.check.md).

После всех отчётов: `browser_close`.
