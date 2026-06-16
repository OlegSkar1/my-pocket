# Правила код-ревью — my-pocket

Чеклист для проверки PR перед мержем в `main`.

---

## Общее

- [ ] Ветка создана от актуального `main`, название соответствует шаблону `<prefix>/<kebab-name>` (`feat/`, `fix/`, `refactor/`, `docs/`, `chore/`).
- [ ] Все коммиты следуют Conventional Commits: `<type>(<scope>): описание на русском`.
- [ ] Один PR — одна логическая единица изменений.
- [ ] PR-заголовок по Conventional Commits; body содержит **Что реализовано**, **Новые API-эндпоинты** (если есть), **Тест-план**.
- [ ] `npm run lint` проходит без ошибок во всех воркспейсах.
- [ ] `npm run build` проходит во всех воркспейсах.

---

## TypeScript

- [ ] Нет `any` без обоснования; нет отключённых правил `eslint-disable` без комментария с причиной.
- [ ] Включены `strict`, `noUnusedLocals`, `noUnusedParameters` — нет подавленных ошибок.
- [ ] Нет дублирования типов: если тип уже есть в `@my-pocket/shared-types` — используем его.
- [ ] `Decimal`-поля Prisma (например, `Transaction.amount`) представлены как `string` в shared-types и не кастуются к `number` без `parseFloat`/`formatMoney`.

---

## Shared-types (`packages/shared-types`)

- [ ] При изменении API-контракта правки внесены **одновременно** в бэк, фронт и `shared-types` в одном PR.
- [ ] Нет локального дублирования DTO/типов на фронте — только импорт из `@my-pocket/shared-types`.

---

## Backend (Nest.js + CQRS + Prisma)

### Архитектура

- [ ] Контроллер тонкий: только `@UseGuards(JwtAuthGuard)` + `@CurrentUser` + `commandBus.execute`/`queryBus.execute`. Бизнес-логика — в handler/service.
- [ ] Каждое действие — отдельный command/query + handler. Нет смешивания чтений и записей.
- [ ] Прямые вызовы `PrismaService` — только в `*.repository.ts`. Хендлеры и сервисы через репозиторий.
- [ ] Новый модуль зарегистрирован в `AppModule`.

### Безопасность

- [ ] **Все** доменные запросы к БД скоупированы по `userId`. Нет запросов без фильтра по владельцу — иначе утечка данных между пользователями.
- [ ] Роуты `summary`/`monthly` и другие именованные sub-path объявлены **до** `:id`, чтобы не захватывались параметром.
- [ ] Пароли хешируются через `bcrypt` (rounds = 10), не хранятся в открытом виде.
- [ ] `JWT_SECRET` не хардкодится; в проде — обязательно переопределён.

### DTO и валидация

- [ ] DTO описаны с `class-validator`; не используется `ValidationPipe` в обход глобального.
- [ ] Глобальный `ValidationPipe({ whitelist: true, transform: true })` активен — лишние поля срезаются автоматически.

### Обработка ошибок

- [ ] Используются стандартные Nest-исключения (`NotFoundException`, `ConflictException` и т. д.).
- [ ] Сообщения пользователю — на **русском языке**.
- [ ] `P2002` (Prisma unique violation) → `ConflictException`, не падает с 500.

### Prisma / миграции

- [ ] После изменения `schema.prisma` — создана миграция (`prisma:migrate`), `prisma:generate` выполнен.
- [ ] Нет `migrate reset` в CI или скриптах — только локально.

---

## Frontend (Next.js + FSD + TanStack Query)

### Feature-Sliced Design

- [ ] Импорты строго по правилу слоёв: `app → views → widgets → features → entities → shared`. Нет импортов из слоя выше.
- [ ] Импорты — только через публичный API среза (`index.ts`), не вглубь в файлы.
- [ ] `model/` содержит хуки, стор, типы, Zod-схемы. `ui/` — только компоненты.

### Окружение и конфиг

- [ ] `process.env.NEXT_PUBLIC_*` нигде не используется напрямую — только через `env` из `shared/config/env.ts`.
- [ ] `ROUTES` из `shared/config` использованы для путей; нет хардкодных строк роутов.

### TanStack Query

- [ ] Query keys экспортируются из `entities/<name>/model` — нет локально объявленных дублирующих ключей.
- [ ] После мутаций (create/update/delete транзакций) инвалидируются связанные query: транзакции + `summary` + `monthly`.
- [ ] Нет `useQuery` с прямым `fetch` в компоненте в обход `apiClient`.

### API-клиент

- [ ] Все запросы идут через `apiClient` из `shared/api` — Bearer-токен подставляется автоматически.
- [ ] Нет ручного `fetch`/`axios` в компонентах или фичах.
- [ ] `204 No Content` и пустые ответы не вызывают `Unexpected end of JSON input`.

### Аутентификация

- [ ] Токен читается/пишется через `getToken`/`setToken`/`removeToken` из `shared/lib`, не через `document.cookie` напрямую.
- [ ] На 401 не нужна дополнительная обработка в компонентах — `apiClient` сам вызывает `removeToken()`.

### UI / компоненты

- [ ] Используются shadcn/ui-компоненты из `shared/ui`; нет дублирующих кастомных аналогов Button, Input, Dialog и т. д.
- [ ] `cn()` (clsx + tailwind-merge) для условных классов; нет конкатенации строк с классами через `+`.
- [ ] `formatMoney` для форматирования сумм; нет самодельных форматтеров.
- [ ] `ResponsiveModal` (`Dialog` на desktop / `Drawer` на мобиле) для модальных форм вместо отдельных Dialog + Drawer.
- [ ] Tailwind-классы без `tailwind.config.*` — только через `@theme` в `globals.css`.

### Обработка ошибок

- [ ] Ошибки мутаций не ловятся вручную в компоненте — глобальный `MutationCache` в `providers.tsx` показывает тост автоматически.
- [ ] Нет дублирующих `toast.error(...)` в `onError` там, где глобальный обработчик уже сработает.

---

## Ручное тестирование перед PR

- [ ] `npm run dev:backend` + `npm run dev:frontend` запущены.
- [ ] Золотой путь: логин → создать категорию → добавить транзакцию → проверить дашборд.
- [ ] Как минимум один edge-case: просроченный токен **или** валидация формы **или** удаление с подтверждением.
- [ ] Нет регрессий в уже работавших фичах (навигация, тема, фильтры транзакций).

## Пропускать при ревью

- Файлы миграций Prisma (`prisma/migrations/**`)
- `package-lock.json` и другие lock-файлы
- `*.log` файлы
