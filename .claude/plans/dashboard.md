# План: Главный экран (дашборд)

## Контекст

Нужен главный экран трекера my-pocket в стиле дашборда Ozon-банка (тёмная/светлая тема): фильтры по периоду и категориям, две карточки «Расходы»/«Доходы» со статистикой за период, помесячная гистограмма (розовый = расход, синий = доход), drill-down в список транзакций по категории, CRUD транзакций и категорий с emoji-иконками. Бэкенд транзакций уже умеет фильтрацию и `summary`; не хватает помесячной агрегации, мультивыбора категорий и счётчиков операций. Фронтенд пока имеет только auth-страницы и базовый UI-кит — нужно нарастить инфраструктуру (тема, графики, календарь, тосты) и собрать сам дашборд по FSD.

Ветка: `feat/dashboard`. Работаем по GitHub Flow, коммиты — Conventional Commits.

**Решения (подтверждены пользователем):** emoji — готовая библиотека (frimousse); разделы «Настройки»/«Поддержка» — заглушки; набор библиотек — recharts, react-day-picker+date-fns, sonner, Radix (select/dialog/popover/dropdown-menu), своя тема на zustand+localStorage.

---

## Чек-лист реализации

### A. Контракты — `packages/shared-types/src/index.ts`
- [ ] `TransactionsQuery`: добавить `categoryIds?: string[]` (оставить `categoryId`), `page?: number`, `limit?: number`.
- [ ] `CategorySummary`: добавить `transactionCount: number`.
- [ ] `TransactionsSummary`: добавить `transactionCount: number`.
- [ ] Новые: `MonthlyStat { month: string /* "YYYY-MM" */; income: string; expense: string }`, `type MonthlyStats = MonthlyStat[]`.
- [ ] Новый дженерик `PaginatedResult<T> { items: T[]; total: number; page: number; limit: number }`. `GET /transactions` теперь возвращает `PaginatedResult<Transaction>` (раньше — `Transaction[]`).

### B. Бэкенд — расширяем модуль `transactions` (НЕ создаём `dashboard`)
- [ ] `dto/query-transactions.dto.ts`:
  - `categoryIds?` с `@IsOptional() @IsArray() @IsString({each:true})` и `@Transform` (нормализация одиночного значения в массив; `class-transformer` уже есть).
  - Пагинация: `page?` (`@IsOptional() @Type(() => Number) @IsInt() @Min(1)`, дефолт 1), `limit?` (`@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)`, дефолт 10). Дефолты — в DTO или в сервисе.
- [ ] `transactions.repository.ts`:
  - `buildWhere()`: ветка `if (filters.categoryIds?.length) where.categoryId = { in: filters.categoryIds }; else if (filters.categoryId) ...` — автоматически прокидывается в findMany/summary.
  - `findManyByUser()`: принимать `skip`/`take`, добавить в `findMany` (`orderBy: { date: "desc" }` сохранить); вернуть `{ items, total }` через `prisma.$transaction([findMany(...), count({ where })])` с тем же `buildWhere`.
  - `groupByType()` и `groupByCategoryAndType()`: добавить `_count: { _all: true }`.
  - Новый `groupByMonth(userId, filters)` — raw SQL через `prisma.$queryRaw` + `Prisma.sql`/`Prisma.join` для динамического WHERE (параметризовано, без `$queryRawUnsafe`): `date_trunc('month', "date" AT TIME ZONE 'UTC')`, `GROUP BY month, type`, `SUM(amount)`.
- [ ] `transactions.service.ts`:
  - `findManyByUser()`: вычислить `skip = (page-1)*limit`, собрать и вернуть `PaginatedResult<Transaction>`.
  - `summary()`: вести `count` в Map, отдавать `transactionCount` (глобальный и по категориям).
  - Новый `monthly(userId, filters): Promise<MonthlyStats>` — свести groupByMonth в Map по ключу `YYYY-MM`, **заполнить нулями все месяцы диапазона** dateFrom→dateTo, суммы через `Decimal.toFixed(2)`.
- [ ] CQRS: `queries/get-monthly-stats.query.ts` + `queries/handlers/get-monthly-stats.handler.ts` (зеркало `get-transactions-summary`), регистрация в `transactions.module.ts`. Query/handler `get-transactions` прокидывают `page`/`limit`, тип возврата — `PaginatedResult<Transaction>`.
- [ ] `transactions.controller.ts`: `@Get("monthly")` **строго до** `@Get(":id")`; `findAll()` → `Promise<PaginatedResult<Transaction>>`.
- [ ] Пагинация применяется **только к списку** (`findAll`). `summary`/`monthly` агрегируют по всему отфильтрованному диапазону — `page/limit` для них игнорируются.
- [ ] (Опц.) categories: мапить Prisma `P2003` при удалении категории с транзакциями в дружелюбную 400.
- Миграция Prisma НЕ нужна (схема не меняется).

### C. Фронт-инфраструктура — `apps/frontend`
- [ ] `npm i` (в воркспейсе фронта): `recharts`, `react-day-picker`, `date-fns`, `sonner`, `frimousse`, `@radix-ui/react-select`, `@radix-ui/react-dialog`, `@radix-ui/react-popover`, `@radix-ui/react-dropdown-menu`.
- [ ] Тема (переход с `@media` на class-стратегию):
  - `globals.css`: `@custom-variant dark (&:where(.dark, .dark *))`; светлые токены в `:root`, тёмные — в `.dark` (убрать `@media prefers-color-scheme`). Добавить keyframes для Radix `data-[state]`-анимаций.
  - `entities/theme/` (зеркало `entities/session`): `model/store.ts` (zustand + `persist({name:"theme"})`, дефолт из `matchMedia` при отсутствии persisted), `model/useApplyTheme.ts` (класс `dark` на `documentElement`), `index.ts`.
  - `entities/session` `clear()`: дополнительно сбрасывать тему (`localStorage.removeItem("theme")`) — «до разлогина».
  - `app/layout.tsx`: inline-скрипт в `<head>` для применения темы до гидрации (анти-FOUC).
  - `app/providers.tsx`: вызвать `useApplyTheme()`.
- [ ] `shared/ui` (shadcn-паттерн, экспорт в `index.ts`): `select`, `dialog`, `popover`, `dropdown-menu`, `calendar` (react-day-picker, `mode="range"`), `skeleton` (`animate-pulse bg-muted`), `sheet` (radix-dialog side), `sonner` (`<Toaster/>`).
- [ ] `shared/lib`: `buildQuery` (сериализация query-строки с массивом `categoryIds`); хелперы `formatMoney`/`percent` (парс string→число, guard деления на ноль).
- [ ] `app/providers.tsx`: смонтировать `<Toaster/>`; `QueryClient` с `QueryCache({onError})` и `MutationCache({onError})` → `toast.error(err.message)` (централизованные алерты ошибок; `ApiError.message` уже человекочитаем).

### D. entities → features → widgets → views
- [ ] `entities/transaction/`: `model/keys.ts` (query-ключи; для списка включают `limit` + фильтры, **без** `page` — он идёт в `pageParam`), `model/queries.ts` — `useTransactions` на **`useInfiniteQuery`**: `initialPageParam: 1`, `getNextPageParam: (last) => last.page * last.limit < last.total ? last.page + 1 : undefined`, каждая страница — `PaginatedResult<Transaction>`; `useTransactionsSummary`, `useMonthlyStats`; `index.ts`.
- [ ] `entities/category/`: `model/queries.ts` — `useCategories`; `index.ts`.
- [ ] `features/transaction-filters/`: `period-filter` (Popover+Calendar range, **выбор произвольного диапазона с точностью до дня** — `dateFrom`/`dateTo`, как «1–10 июня» на референсе), `category-filter` (Popover+Checkbox мультивыбор), `model/store.ts` (zustand: период, categoryIds, выбранная карточка/категория для drill-down; сброс выбора при смене периода).

  > **Фильтр всегда дневной** (`dateFrom`/`dateTo`) и применяется ко всему: карточки, список, summary. Помесячная группировка (`groupByMonth`) — только способ агрегации для гистограммы, а не ограничение фильтра.
- [ ] `features/transaction-crud/`: `model/schema.ts` (zod v4: amount-как-деньги, type, date, categoryId, description), `useCreate/Update/DeleteTransaction` (useMutation, инвалидация `["transactions"]` + toast), `ui/TransactionFormDialog.tsx` (Dialog + react-hook-form + standardSchemaResolver, как в auth).
- [ ] `features/category-crud/`: `model/schema.ts` (name, color, icon-emoji), `useCreate/Update/DeleteCategory` (инвалидация `["categories"]` + `["transactions"]`; `onError` 400 → toast про Restrict), `ui/CategoryFormDialog.tsx` (форма + frimousse emoji-picker + выбор цвета).
- [ ] `features/theme-toggle/ui/ThemeToggle.tsx` (Sun/Moon из lucide-react).
- [ ] `widgets/` (новый слой между features и views):
  - `sidebar` — скрывающийся сайдбар (профиль, настройки[заглушка], поддержка[заглушка], выход, навигация); на мобиле через `Sheet`.
  - `mobile-header` — профиль-дропдаун (DropdownMenu) справа сверху + кнопка открытия Sheet.
  - `stats-cards` — две карточки Расходы/Доходы (сумма за период + общая), кликабельны → drill-down.
  - `monthly-chart` — recharts BarChart с парными Bar (expense=розовый, income=синий); рендер, пока карточка/категория не выбрана.
  - `transactions-list` — единый список (дата, сумма, назначение); строки → редактирование в Dialog. По умолчанию (карточка/категория не выбрана) — последние транзакции **без** фильтра категории; при drill-down — с `categoryIds` выбранной категории. **Бесконечный скролл**: страницы из `useInfiniteQuery` склеиваются (`data.pages.flatMap(p => p.items)`), `limit = 10`; sentinel-элемент в конце + `IntersectionObserver` → `fetchNextPage()` при `hasNextPage && !isFetchingNextPage`; в конце списка — спиннер/скелетон. Смена фильтра/периода/типа меняет query-ключ → список начинается заново с первой страницы (сброс автоматический, отдельное состояние `page` не нужно).
  - `categories-panel` — категории с emoji, суммами, числом операций и процентами (из обогащённого summary).
- [ ] `views/dashboard/ui/DashboardPage.tsx` — компоновка; `app/page.tsx` рендерит `<DashboardPage/>`.
- [ ] Заглушки разделов: `app/settings/page.tsx`, `app/support/page.tsx` + `ROUTES.settings/support` в `shared/config/routes.ts` (proxy.ts защищает их автоматически).

### E. Скелетоны и анимации
- [ ] `Skeleton` в каждом виджете на время `isLoading`/`isPending`.
- [ ] Tailwind `transition`/`animate-*`; Radix `data-[state]`-анимации; встроенная анимация баров recharts.

---

## Edge-cases
- **Пустой период / нет данных**: summary даёт нули, `byCategory` пустой; monthly заполнен нулями по месяцам диапазона — гистограмма не падает, показываем «нет данных».
- **Деление на ноль в процентах**: `grandTotal === 0` → `0%` (guard на фронте).
- **Таймзоны**: `date_trunc(... AT TIME ZONE 'UTC')`, ключ `YYYY-MM` и подписи — в UTC (date-fns).
- **Мультивыбор в query**: `@Transform` нормализует одиночное значение; пустой массив = фильтр не применяется.
- **Удаление категории с транзакциями**: Prisma `P2003` → 400 → toast; в UI можно дизейблить удаление при `transactionCount > 0`.
- **Инвалидация react-query**: ключи в `entities/*/model/keys.ts`; транзакции CRUD → `["transactions"]` (префикс покрывает list/summary/monthly); категории delete → `["categories"]` + `["transactions"]`.
- **amount как string**: формы валидируют денежную строку (zod refine), на бэк уходит строкой.
- **FOUC темы**: inline-скрипт до гидрации.
- **Бесконечный скролл — конец списка**: `getNextPageParam` вернул `undefined` (`page*limit >= total`) → `hasNextPage = false`, sentinel перестаёт подгружать, показываем «больше нет».
- **Бесконечный скролл — пустой результат**: первая страница `items: []` → виджет показывает «нет данных», sentinel не триггерит подгрузку.
- **Бесконечный скролл — сброс**: смена периода/категорий/типа меняет query-ключ → `useInfiniteQuery` стартует с первой страницы (отдельное состояние `page` не храним).

---

## Критичные файлы
- `packages/shared-types/src/index.ts` — контракты (categoryIds, transactionCount, MonthlyStats).
- `apps/backend/src/transactions/transactions.repository.ts` — buildWhere + groupByMonth (raw SQL) + _count.
- `apps/backend/src/transactions/transactions.service.ts` — обогащение summary + monthly.
- `apps/frontend/src/app/globals.css` — class-стратегия темы.
- `apps/frontend/src/app/providers.tsx` — Toaster + QueryCache/MutationCache.onError + применение темы.

Опорные паттерны для зеркалирования: `transactions.controller.ts`, `transactions.module.ts`, `queries/handlers/get-transactions-summary.handler.ts`, `entities/session/model/store.ts`, `features/auth/login/model/useLogin.ts`, `shared/ui/index.ts`, `shared/api/client.ts`.

---

## Верификация (e2e ручной + сборка)
1. `npm run db:up`; бэк `.env`, `npm run prisma:migrate -w @my-pocket/backend` (новых миграций нет), `npm run dev:backend`.
2. Фронт `.env` (`NEXT_PUBLIC_API_URL`), `npm run dev:frontend`.
3. `npm run build` — type-check фронта/бэка/shared-types (совпадение контрактов).
4. Сценарий: логин → дашборд; создать категории (emoji+цвет) и >10 транзакций (разные месяцы/типы); карточки и гистограмма (парные столбцы, пустые месяцы = нули); фильтр периода (календарь-диапазон) и мультивыбор категорий; бесконечный скролл списка (первые 10, докрутка до конца подгружает следующие, в конце — «больше нет»; смена периода/категории перезапускает список с начала); drill-down → список (фильтр по категории + бесконечный скролл) → редактирование строки; удаление категории с транзакциями → toast-ошибка; переключатель темы (сохраняется после перезагрузки, забывается после logout, дефолт по ОС); мобильная ширина (нет сайдбара, профиль-дропдаун справа, навигация карточками); скелетоны при загрузке; тост при остановленном бэке.
