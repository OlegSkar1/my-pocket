# Архитектура my-pocket

## Структура монорепозитория

npm workspaces — единая `node_modules` в корне, зависимости между пакетами через `*`.

```
my-pocket/
├─ apps/
│  ├─ frontend/        # Next.js 16 (App Router) — порт 3000
│  └─ backend/         # Nest.js 11 — порт 3001
└─ packages/
   ├─ shared-types/    # общие TS-типы и контракты API (без сборки, src напрямую)
   └─ config/          # общий ESLint base config
```

---

## Бэкенд (`apps/backend`)

### Слои и поток запроса

```
HTTP-запрос
  → Controller         # принимает HTTP, валидирует DTO, достаёт userId из JWT
  → JwtAuthGuard       # проверяет Bearer-токен, кладёт payload в request.user
  → CommandBus/QueryBus
  → Handler            # единственная задача — вызвать сервис
  → Service            # доменная логика, маппинг ошибок Prisma
  → Repository         # все Prisma-запросы, только здесь
  → PrismaService
  → PostgreSQL
```

Контроллер **не содержит логики** — только роутинг, guard, декоратор `@CurrentUser` и вызов шины. Логика — в сервисе. Prisma — только в репозитории.

### CQRS

Используется `@nestjs/cqrs`. Разделение:

| Тип | Когда | Файлы |
|---|---|---|
| **Command** | запись (create, update, delete) | `commands/*.command.ts` + `commands/handlers/*.handler.ts` |
| **Query** | чтение | `queries/*.query.ts` + `queries/handlers/*.handler.ts` |

Команды и запросы — простые классы-контейнеры данных. Хендлер реализует `ICommandHandler` / `IQueryHandler` и делегирует в сервис.

### Структура модуля

```
<module>/
├─ <module>.module.ts       # регистрирует CqrsModule, провайдеры, контроллер
├─ <module>.controller.ts   # HTTP — только шина
├─ <module>.service.ts      # доменная логика
├─ <module>.repository.ts   # Prisma-вызовы
├─ dto/
│  ├─ create-*.dto.ts
│  ├─ update-*.dto.ts
│  └─ query-*.dto.ts
├─ commands/
│  ├─ *.command.ts
│  └─ handlers/*.handler.ts
└─ queries/
   ├─ *.query.ts
   └─ handlers/*.handler.ts
```

### Модули

| Модуль | Назначение |
|---|---|
| `PrismaModule` | глобальная обёртка над `PrismaClient`, подключается в `onModuleInit` |
| `UsersModule` | CRUD пользователей, только CQRS — контроллера нет |
| `AuthModule` | регистрация/логин, JWT-стратегия, `JwtAuthGuard`, `@CurrentUser` |
| `CategoriesModule` | категории расходов |
| `TransactionsModule` | транзакции, сводка, месячная статистика |

### Аутентификация

- `JwtStrategy` — `passport-jwt`, Bearer-токен из заголовка `Authorization`.  
  Payload: `{ sub: userId, email }`. После валидации кладёт `{ userId, email }` в `request.user`.
- `JwtAuthGuard` — обёртка над `AuthGuard("jwt")`. Ставится на класс контроллера.
- `@CurrentUser("userId")` — параметр-декоратор, достаёт поле из `request.user`.
- Все доменные запросы **обязательно** скоупятся по `userId` — никаких запросов без него.

### Глобальные настройки (`main.ts`)

- `ValidationPipe({ whitelist: true, transform: true })` — обрезает лишние поля, кастует query-string в числа.
- CORS: origin из `FRONTEND_URL` (дефолт `http://localhost:3000`), `credentials: true`.
- Swagger UI: `DocumentBuilder` + `SwaggerModule.setup("api/docs", ...)`.

### Обработка ошибок Prisma

| Код Prisma | Значение | Что бросаем |
|---|---|---|
| `P2002` | unique violation | `ConflictException` |
| `P2003` | foreign key violation | `BadRequestException` или `ConflictException` (зависит от контекста) |

---

## Фронтенд (`apps/frontend`)

### Feature-Sliced Design (FSD)

Правило импортов: каждый слой импортирует только из слоёв **строго ниже**.

```
app → views → widgets → features → entities → shared
```

| Слой | Путь | Назначение |
|---|---|---|
| **app** | `src/app/` | Next.js App Router (роуты, layout), провайдеры, глобальные стили |
| **views** | `src/views/` | Компоновка страниц (аналог FSD `pages`) |
| **widgets** | `src/widgets/` | Самостоятельные блоки: sidebar, stats-cards, transactions-list, monthly-chart, categories-panel |
| **features** | `src/features/` | Бизнес-фичи: auth/login, auth/register, auth/logout, category-crud, transaction-crud, transaction-filters, theme-toggle |
| **entities** | `src/entities/` | Бизнес-сущности: session, category, transaction, theme (zustand-сторы, query keys, типы) |
| **shared** | `src/shared/` | Переиспользуемое без бизнес-специфики |

### Сегменты `shared`

- **`api`** — `apiClient` (fetch-обёртка: Bearer из cookie, парсинг ошибок Nest, редирект на `/login` при 401, корректный 204).
- **`config`** — `env`, `ROUTES`, `TOKEN_COOKIE`, `AUTH_PATHS`.
- **`lib`** — `cn`, `getToken/setToken/removeToken/isTokenExpired`, `buildQuery`, `formatMoney`, `percent`, `useIsMobile`.
- **`ui`** — shadcn/ui-компоненты: Button, Input, Card, Dialog, Drawer, Form, Select, Calendar, Skeleton, Toaster, ResponsiveModal и др.

### Стейт-менеджмент

| Тип стейта | Инструмент | Где |
|---|---|---|
| Серверный (кэш) | TanStack Query | `entities/*/model`, `features/*-crud/model` |
| Клиентский (сессия, тема) | Zustand | `entities/session/model`, `entities/theme/model` |

Query keys — константы/фабрики из `entities/<name>/model`. После мутаций инвалидируются затронутые ключи.

### Аутентификация

- JWT хранится в cookie `access_token` (не httpOnly — нужен в JS).
- `getToken()` достаёт токен; `apiClient` подставляет его в `Authorization: Bearer`.
- На 401 `apiClient` сам вызывает `removeToken()`.
- `proxy.ts` (Edge middleware) — редирект неаутентифицированных на `/login` и обратно.
- `<TokenGuard>` в `providers.tsx` — проверяет `isTokenExpired()` при монтировании.

### Провайдеры (`src/app/providers.tsx`)

`QueryClientProvider` → глобальная обработка ошибок через `QueryCache`/`MutationCache` (тост на любую ошибку) → `<TokenGuard>` → `useApplyTheme()` → `<Toaster>`.

---

## Shared packages

### `@my-pocket/shared-types`

Интерфейсы и типы, общие для фронта и бэка. Импортируется из исходников напрямую (без сборки).

- `Decimal` из Prisma сериализуется как **`string`** в API — фронт получает строку, форматирует через `formatMoney`.
- При изменении контракта API правятся оба берега и `shared-types` в одном PR.

### `@my-pocket/config`

Базовый ESLint flat-конфиг (`eslint.base.mjs`). Тянет `@eslint/js` и `typescript-eslint`.
