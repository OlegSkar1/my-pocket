# Backend — `@my-pocket/backend`

Nest.js 11 + Prisma 6 + PostgreSQL 16. CQRS (`@nestjs/cqrs`), JWT-аутентификация (Passport). Слушает порт из `process.env.PORT`, по умолчанию **3001**.

Общая информация о проекте — в корневом [CLAUDE.md](../../CLAUDE.md).

## Технологический стек

- **Nest.js 11** (`@nestjs/common`, `@nestjs/core`, `@nestjs/config`, `@nestjs/platform-express`).
- **`@nestjs/cqrs`** — `CommandBus` / `QueryBus`, разделение записи и чтения.
- **Prisma 6** — ORM, схема в `prisma/schema.prisma`, клиент `@prisma/client` генерируется сюда же.
- **`@nestjs/jwt` + `@nestjs/passport` + `passport-jwt`** — JWT auth.
- **`bcrypt`** — хеширование паролей (rounds = 10).
- **`class-validator` + `class-transformer`** — валидация DTO через глобальный `ValidationPipe({ whitelist: true, transform: true })`.

## Команды

```bash
npm run start:dev          # nest start --watch (порт 3001)
npm run start              # nest start
npm run start:prod         # node dist/main
npm run build              # nest build
npm run lint               # eslint .
npm run prisma:generate    # prisma generate
npm run prisma:migrate     # prisma migrate dev
```

Из корня монорепо: `npm run dev:backend`.

## Переменные окружения

`apps/backend/.env` (шаблон — `.env.example`):

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/my_pocket?schema=public"
JWT_SECRET="…"               # обязательно в проде; в dev дефолт "change-me-in-production"
JWT_EXPIRES_IN="15m"         # формат ms / @nestjs/jwt
PORT=3001                    # опционально
FRONTEND_URL=http://localhost:3000   # для CORS
```

## Точка входа (`src/main.ts`)

- `app.enableCors({ origin: FRONTEND_URL ?? "http://localhost:3000", credentials: true })`.
- Глобальный `ValidationPipe({ whitelist: true, transform: true })` — лишние поля DTO срезаются, примитивы кастуются (например, query-string `take`/`skip` в `number`).
- Порт из `PORT` (дефолт 3001).
- Swagger UI доступен по `/api/docs` (настраивается через `DocumentBuilder` + `SwaggerModule.setup`).

## Линтинг

`eslint.config.mjs` импортирует базу `@my-pocket/config/eslint.base.mjs`, отключает шумные для Nest правила и ставит `sourceType: commonjs` (Nest по умолчанию CJS).

## Архитектура (CQRS-модули)

```
src/
├── app.module.ts            # корневой модуль
├── main.ts
├── prisma/                  # PrismaModule + PrismaService (DI-обёртка над PrismaClient)
├── auth/                    # регистрация/логин, JWT, guards, decorators
├── users/                   # CRUD пользователей (CQRS-only, без контроллера)
├── categories/              # категории расходов
└── transactions/            # доходы/расходы, сводка, месячная статистика
```

Каждый ресурсный модуль (`categories`, `transactions`, `users`) следует шаблону:

```
<module>/
├── <module>.module.ts
├── <module>.controller.ts   # HTTP — только commandBus.execute / queryBus.execute
├── <module>.service.ts      # доменные операции (для тонких модулей может отсутствовать)
├── <module>.repository.ts   # инкапсулирует Prisma-вызовы
├── dto/                     # class-validator DTO
├── commands/                # *.command.ts + handlers/*.handler.ts
└── queries/                 # *.query.ts + handlers/*.handler.ts
```

### Поток запроса

1. Контроллер принимает HTTP, валидирует DTO глобальным `ValidationPipe`.
2. `JwtAuthGuard` (на уровне контроллера) проверяет Bearer-токен, кладёт payload в `request.user`.
3. Декоратор `@CurrentUser("userId")` достаёт `userId` (= `sub` из JWT) для `userId`-скоупа.
4. Контроллер диспатчит **Command** (запись) или **Query** (чтение) на шину.
5. Handler в `commands/handlers` или `queries/handlers` вызывает соответствующий `*.repository.ts`.
6. Репозиторий — единственное место, где живёт `PrismaService`. Сервисы и хендлеры через него.

### Шаблон для новой ресурсной фичи

1. Заведи модуль `src/<feature>/<feature>.module.ts` — зарегистрируй `CqrsModule`, репозиторий, провайдеры из `commands/handlers/*` и `queries/handlers/*`.
2. Добавь его в `imports` корневого `AppModule`.
3. Опиши DTO в `dto/` с `class-validator`.
4. Контроллер — тонкий: только `@UseGuards(JwtAuthGuard)` + `@CurrentUser` + `commandBus.execute`/`queryBus.execute`.
5. На каждое действие — отдельный command/query + handler. Никаких прямых Prisma-вызовов вне репозитория.
6. Если контракт публичный — продублируй тип в `@my-pocket/shared-types` и используй его в сигнатуре контроллера.
7. На каждый новый эндпоинт добавь JSDoc и Swagger-декораторы (см. ниже).

## API-эндпоинты

Все ресурсные роуты под `@UseGuards(JwtAuthGuard)`.

### `POST /auth/register` / `POST /auth/login`
Тело — `RegisterDto` / `LoginDto`. Ответ — `AuthResponse` (`{ accessToken, user }`). Логин возвращает 200 (явный `@HttpCode`).

### Categories — `/categories`
- `POST /` — `CreateCategoryDto` → `Category`
- `GET /` — список категорий пользователя
- `GET /:id` — одна категория (с проверкой владения)
- `PATCH /:id` — `UpdateCategoryDto`
- `DELETE /:id` — `204 No Content`

### Transactions — `/transactions`
- `POST /` — `CreateTransactionDto` → `Transaction`
- `GET /` — `QueryTransactionsDto` (фильтры: `dateFrom`, `dateTo`, `type`, `categoryIds[]`, `take`, `skip`) → `PaginatedResult<Transaction>`
- `GET /summary` — `TransactionsSummary` (доходы/расходы/баланс)
- `GET /monthly` — `MonthlyStats` (помесячные агрегаты)
- `GET /:id` / `PATCH /:id` / `DELETE /:id` (`204`)

**Важно:** `summary` и `monthly` объявлены **до** `:id`, иначе строковые суффиксы попадают в параметр `id`.

## Аутентификация и авторизация

- **`AuthModule`** — `JwtModule.registerAsync` берёт `JWT_SECRET` и `JWT_EXPIRES_IN` из `ConfigService`. В dev дефолтный секрет `"change-me-in-production"` — для прода переопределить.
- **`JwtStrategy`** (`auth/strategies/jwt.strategy.ts`) — извлекает Bearer-токен, валидирует подпись, возвращает `{ userId, email }` (мапится из `sub` / `email`).
- **`JwtAuthGuard`** (`auth/guards/jwt-auth.guard.ts`) — обёртка над `AuthGuard("jwt")`. Применяется на ресурсных контроллерах.
- **`@CurrentUser(field?)`** (`auth/decorators/current-user.decorator.ts`) — параметр-декоратор для контроллера: с аргументом `"userId"` отдаёт сам id, без — весь payload.
- Все доменные запросы **обязательно** скоупятся по `userId`. Никаких запросов без него — иначе утечка между пользователями.
- Пароли — `bcrypt.hash(pwd, 10)`. Сравнение через `bcrypt.compare`. Неверные креды → `UnauthorizedException("Неверный email или пароль")`.

## Prisma и БД

Контейнер `my-pocket-postgres` (PostgreSQL 16) поднимается из корня: `npm run db:up`. Креды и порт — в корневом [CLAUDE.md](../../CLAUDE.md).

### Схема (`prisma/schema.prisma`)

- **`User`** — id, email (unique), name, passwordHash; каскад на `Category` и `Transaction`.
- **`Category`** — id, name, color, icon, `@@unique([userId, name])`; каскад от User; `Restrict` со стороны Transaction (нельзя удалить категорию, на которую есть транзакции).
- **`Transaction`** — `Decimal(12, 2)`, `TransactionType` (`INCOME` | `EXPENSE`), `description?`, `date`, FK на `Category` и `User`, индексы по `userId` и `categoryId`.
- **`Expense`** — legacy/учебная модель; в продуктовых сценариях используется `Transaction`.

> При изменении `Decimal`-полей синхронизируй `@my-pocket/shared-types`: `Decimal` в API сериализуется как **`string`** (см. `Expense.amount`, `Transaction.amount`).

### Миграции

```bash
# создать миграцию из изменений schema.prisma
npm run prisma:migrate -- --name <kebab-name>

# применить накатанные миграции (например, после pull)
npm run prisma:migrate

# полный сброс БД (только локально)
npx prisma migrate reset
```

После любого изменения `schema.prisma` — `npm run prisma:generate` (выполняется автоматически при `migrate dev`).

### `PrismaService`

`src/prisma/prisma.service.ts` наследует `PrismaClient` и подключается в `onModuleInit`. Экспортируется через `PrismaModule` (`@Global` — или импортируется в каждом ресурсном модуле, см. конкретный модуль).

## Обработка ошибок

- Все исключения Nest (`BadRequestException`, `UnauthorizedException`, `NotFoundException`, `ConflictException`) автоматически отдают `{ statusCode, message, error }`. Фронт парсит `message` (или `message[0]` для массивов от `class-validator`) и показывает в тосте.
- Сообщения пользователю — **на русском** (как в `AuthService.login`: `"Неверный email или пароль"`).
- Для гонок и дубликатов используйте `P2002` (unique violation) → `ConflictException`.

## Документация API (JSDoc + Swagger)

### Правило

**При любом изменении эндпоинта** — добавлении, удалении или модификации маршрута, параметров, тела запроса, возвращаемого типа или кодов ответа — нужно синхронно обновить:

1. **JSDoc** на методе контроллера (`@param`, `@returns`, `@throws`).
2. **Swagger-декораторы** на методе контроллера (`@ApiOperation`, `@ApiResponse`, `@ApiParam` / `@ApiQuery` при необходимости).

Устаревшая документация хуже её отсутствия — она вводит в заблуждение.

### Набор декораторов на контроллере

```typescript
// На классе контроллера:
@ApiTags("resource-name")   // группирует эндпоинты в Swagger UI
@ApiBearerAuth()            // помечает все маршруты как JWT-защищённые

// На каждом методе:
@ApiOperation({ summary: "Краткое описание" })
@ApiParam({ name: "id", description: "UUID ресурса" })   // для параметров пути
@ApiQuery({ name: "page", required: false })             // для query-параметров (если не покрываются DTO)
@ApiResponse({ status: 200, description: "Успех" })
@ApiResponse({ status: 400, description: "Невалидные данные" })
@ApiResponse({ status: 401, description: "Не авторизован" })
@ApiResponse({ status: 404, description: "Не найдено" })
```

Все декораторы импортируются из `@nestjs/swagger`.

### JSDoc на методе контроллера

```typescript
/**
 * Краткое описание того, что делает эндпоинт.
 * @param userId - id аутентифицированного пользователя из JWT
 * @param dto - тело запроса / фильтры
 * @returns описание возвращаемого значения
 * @throws {NotFoundException} при каком условии
 * @throws {BadRequestException} при каком условии
 */
```

### JSDoc на методах сервиса и репозитория

При изменении сигнатуры метода сервиса или репозитория обновляй JSDoc там же: `@param`, `@returns`, `@throws`.

## Тестирование

Тестов сейчас нет. Ручная проверка — через фронт (см. `apps/frontend/CLAUDE.md`) либо `curl`/REST-клиент с предварительно полученным JWT из `/auth/login`.
