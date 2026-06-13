# Frontend — `@my-pocket/frontend`

Next.js (App Router, TypeScript), Tailwind v4, shadcn/ui, TanStack Query, Zustand. Слушает порт **3000**.

Общая информация о проекте — в корневом [CLAUDE.md](../../CLAUDE.md).

## Технологический стек

- **Next.js 16** (App Router) + **React 19**.
- **Tailwind v4** через `@tailwindcss/postcss` в `postcss.config.mjs`. CSS-first: дизайн-токены и `@import "tailwindcss"` в `src/app/globals.css`, импортируется в `src/app/layout.tsx`. Конфига `tailwind.config.*` нет — всё через `@theme` в CSS.
- **shadcn/ui** — компоненты в `src/shared/ui` (Radix-примитивы + tailwind-варианты через `class-variance-authority`).
- **TanStack Query** — сервер-стейт, кэш, мутации.
- **Zustand** — клиент-стейт (сессия, тема).
- **React Hook Form + Zod** — формы и валидация.
- **recharts** — графики (месячная статистика).
- **vaul** — мобильные дровера; **sonner** — тосты; **lucide-react** — иконки.
- **date-fns** — даты; **js-cookie** — JWT в cookie.

## Команды

```bash
npm run dev      # next dev (порт 3000)
npm run build    # next build
npm run start    # next start (прод-сервер)
npm run lint     # eslint .
```

Запускаются из корня монорепо: `npm run dev:frontend`.

## Переменные окружения

`apps/frontend/.env` (шаблон — `.env.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Доступ — только через `src/shared/config/env.ts` (объект `env`); напрямую `process.env.NEXT_PUBLIC_*` в коде не использовать.

## Линтинг

`eslint.config.mjs` импортирует базовый `@my-pocket/config/eslint.base.mjs` и добавляет flat-конфиги `eslint-config-next/core-web-vitals` и `eslint-config-next/typescript` (в Next 16 это уже flat-массивы, `FlatCompat` не нужен). `next lint` удалён в Next 16 — используется прямой вызов `eslint .`.

## Архитектура (Feature-Sliced Design)

`src/` организован по **FSD**. Правило импортов: каждый слой импортирует только из слоёв **строго ниже**. Импорты — через публичный API среза (`index.ts`), не вглубь в файлы.

```
app → views → widgets → features → entities → shared
```

| Слой | Путь | Назначение |
|---|---|---|
| **app** | `src/app/` | Next.js App Router (роуты, layout) + провайдеры (`providers.tsx`), глобальные стили |
| **views** | `src/views/` | Компоновка страниц (аналог FSD `pages`; переименован — Next резервирует `pages/`) |
| **widgets** | `src/widgets/` | Самостоятельные блоки страниц (sidebar, mobile-header, stats-cards, transactions-list, monthly-chart, categories-panel) |
| **features** | `src/features/` | Бизнес-фичи: `auth/login`, `auth/register`, `auth/logout`, `category-crud`, `transaction-crud`, `transaction-filters`, `theme-toggle` |
| **entities** | `src/entities/` | Бизнес-сущности: `session`, `category`, `transaction`, `theme` (zustand-сторы, типы, query keys) |
| **shared** | `src/shared/` | Переиспользуемое без бизнес-специфики |

### Внутренняя структура слайса

В фичах/энтити используется группировка по сегментам:

- `model/` — стор (zustand), хуки react-query, типы, схемы (Zod), query keys.
- `ui/` — React-компоненты.
- `index.ts` — публичный API.

### Сегменты `shared`

- **`shared/api`** — `apiClient` (`get/post/patch/delete`) + `ApiError`. Fetch-обёртка: Bearer-токен из cookie, парсинг сообщений ошибок Nest (`message` или `message[0]`), редирект на `/login` через `removeToken()` на 401, корректная обработка `204 No Content` и пустых тел (не падает с `Unexpected end of JSON input`).
- **`shared/config`** — `env`, `ROUTES` (константы путей), `TOKEN_COOKIE` (`access_token`), `AUTH_PATHS`.
- **`shared/lib`** — `cn` (clsx + tailwind-merge), `getToken/setToken/removeToken/isTokenExpired` (js-cookie + проверка `exp` из JWT), `buildQuery` (сериализация query-string), `formatMoney`, `percent`, `useIsMobile`.
- **`shared/ui`** — shadcn/ui-компоненты: Button, Input, Label, Card, Form, Dialog, Drawer, Dropdown, Select, Popover, Calendar, Checkbox, Sheet, Skeleton, Sonner (Toaster), Logo, ResponsiveModal (Dialog на desktop / Drawer на мобиле).

## Провайдеры (`src/app/providers.tsx`)

`<Providers>` оборачивает дерево в `src/app/layout.tsx` и подключает:

- **`QueryClientProvider`** — единый `QueryClient` с дефолтами: `queries.retry = 1`, `mutations.retry = 0`.
- **Глобальная обработка ошибок** через `QueryCache` и `MutationCache`: любая ошибка показывает тост `toast.error(error.message)`. `ApiError.message` уже человекочитаем, поэтому ловить ошибки в конкретных компонентах обычно не нужно.
- **`<TokenGuard>`** — при монтировании проверяет `isTokenExpired()`; если просрочен — `removeToken()`, чистит `useSessionStore` и редирект на `/login`.
- **`useApplyTheme()`** — применяет тему (`light`/`dark`/`system`) к `<html>` из `entities/theme`.
- **`<Toaster>`** (sonner) — глобальная точка показа тостов.
- Обёртка `data-vaul-drawer-wrapper` — нужна `vaul` для масштабирования фона при выезде дровера.

## Защита роутов (Edge proxy)

`apps/frontend/src/proxy.ts` — Edge middleware (в Next 16 файл может называться `proxy.ts`; экспортирует функцию `proxy` и `config.matcher`). Логика:

- Читает cookie `access_token` (имя — `TOKEN_COOKIE` из `shared/config`).
- Если токена нет и путь **не** в `AUTH_PATHS` (`/login`, `/register`) → редирект на `/login`.
- Если токен есть и путь в `AUTH_PATHS` → редирект на `/`.
- `matcher` исключает `_next/static`, `_next/image`, `favicon.ico` и статические файлы (`*.png`, `*.svg`, `*.woff2`, …), иначе картинки получали бы 307 на `/login`.

## Аутентификация

- JWT хранится в **httpOnly: false** cookie `access_token` (имя — `TOKEN_COOKIE`), читается из JS (`getToken()`) и подкладывается в `Authorization: Bearer …` через `apiClient`.
- На login/register бэк возвращает `{ accessToken, user }` → `setToken(accessToken)` + `useSessionStore.setState({ user })`.
- На 401 `apiClient` сам вызывает `removeToken()`. Дальше срабатывает либо `TokenGuard` (на следующем рендере), либо `proxy.ts` (на следующей навигации).

## Работа с сервером (TanStack Query)

- Хуки запросов/мутаций лежат в `model/` своего слайса (`entities/*/model` для чтений, `features/*-crud/model` для записей).
- **Query keys** — экспортируются константы/фабрики из `entities/<name>/model`, чтобы фичи и виджеты ссылались на один ключ.
- **Инвалидация** — после мутаций `queryClient.invalidateQueries({ queryKey: ... })`. После операций с транзакциями обычно инвалидируются и сами транзакции, и `summary`/`monthly`.
- **Декомпозиция дат**: бэк ожидает ISO; используем `date-fns` (`startOfMonth`, `endOfMonth`, `formatISO`).

## Дашборд и страницы

- `app/page.tsx` → `views/dashboard` (главная, защищена proxy.ts).
- `app/(auth)/login`, `app/(auth)/register` → `views/login`, `views/register`.
- `app/settings`, `app/support` — отдельные простые страницы.
- Виджеты дашборда: `sidebar` (desktop) / `mobile-header` + sheet (мобила), `stats-cards`, `monthly-chart` (recharts), `transactions-list`, `categories-panel`.

## Контракты с бэком

Все типы запрос/ответ — из `@my-pocket/shared-types`. Локально дублировать DTO **нельзя**. `Decimal` (Prisma) приходит как `string` — форматируется через `formatMoney`.

## Тестирование UI вручную

Перед PR: `npm run dev:backend` + `npm run dev:frontend`, пройти золотой путь (логин → создать категорию → добавить транзакцию → проверить дашборд) и хотя бы один edge-case (просроченный токен, валидация формы, удаление с подтверждением).
