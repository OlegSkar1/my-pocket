# План: модуль транзакций (TransactionsModule)

## Context

В `my-pocket` уже есть авторизация (JWT) и модуль категорий, но нет центральной сущности — **транзакций** (доходы/расходы). Этот модуль — ядро приложения: записывать траты/доходы, фильтровать по дате/типу/категории и видеть агрегаты.

Реализуем backend по образцу `apps/backend/src/categories/` (полный CQRS: Controller → Command/Query Bus → Handler → Service → Repository → Prisma), добавим модель `Transaction` в Prisma, миграцию и общие типы в `@my-pocket/shared-types`. Frontend в задаче не затрагивается.

**Решения (подтверждены пользователем):**
- `GET /transactions/summary` → `{ totalIncome, totalExpense, balance, byCategory[] }`, учитывает те же query-фильтры.
- `categoryId` — **обязателен**, связь с `onDelete: Restrict` (категорию с транзакциями удалить нельзя).

---

## Модель данных

### 1. `apps/backend/prisma/schema.prisma`

Добавить enum и модель:

```prisma
enum TransactionType {
  INCOME
  EXPENSE
}

model Transaction {
  id          String          @id @default(uuid())
  amount      Decimal         @db.Decimal(12, 2)
  type        TransactionType
  description String?
  date        DateTime
  categoryId  String
  category    Category        @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  userId      String
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime        @default(now())

  @@index([userId])
  @@index([categoryId])
}
```

Обратные связи (имя поля — `transactions`, как в задаче):
- В `model User` добавить `transactions Transaction[]`
- В `model Category` добавить `transactions Transaction[]`

> Примечание: в задаче поле названо `transactons` (опечатка) — используем корректное `transactions`.

### 2. Миграция

В `apps/backend`: `npm run prisma:migrate` (имя, например, `add_transactions`) → `npm run prisma:generate`. Требуется поднятая БД (`npm run db:up`).

---

## Backend-модуль (зеркалим `categories/`)

Новый каталог `apps/backend/src/transactions/`:

```
transactions/
├── transactions.module.ts
├── transactions.controller.ts
├── transactions.service.ts
├── transactions.repository.ts
├── commands/
│   ├── create-transaction.command.ts
│   ├── update-transaction.command.ts
│   ├── delete-transaction.command.ts
│   └── handlers/{create,update,delete}-transaction.handler.ts
├── queries/
│   ├── get-transactions.query.ts        # + фильтры
│   ├── get-transaction-by-id.query.ts
│   ├── get-transactions-summary.query.ts
│   └── handlers/{get-transactions,get-transaction-by-id,get-transactions-summary}.handler.ts
└── dto/
    ├── create-transaction.dto.ts
    ├── update-transaction.dto.ts
    └── query-transactions.dto.ts        # dateFrom, dateTo, type, categoryId
```

### Controller (`transactions.controller.ts`)
`@Controller("transactions")` + `@UseGuards(JwtAuthGuard)`, `userId` через `@CurrentUser("userId")` (как в `categories.controller.ts`).

- `POST /transactions` → `CreateTransactionCommand(userId, dto)`
- `GET /transactions` → `GetTransactionsQuery(userId, queryDto)` (`@Query() QueryTransactionsDto`)
- `GET /transactions/summary` → `GetTransactionsSummaryQuery(userId, queryDto)` — **объявить ДО `:id`**, иначе `summary` попадёт в `:id`
- `GET /transactions/:id` → `GetTransactionByIdQuery(id, userId)`
- `PATCH /transactions/:id` → `UpdateTransactionCommand(id, userId, dto)`
- `DELETE /transactions/:id` → `DeleteTransactionCommand(id, userId)`, `@HttpCode(NO_CONTENT)`

### DTO (class-validator)
- `CreateTransactionDto`: `amount` — `@IsNumberString()` или `@IsDecimal()` (хранится как `string`, зеркалит `Expense.amount`); `type` — `@IsEnum(TransactionType)`; `description?` — `@IsOptional() @IsString() @MaxLength(...)`; `date` — `@IsDateString()`; `categoryId` — `@IsString() @IsNotEmpty()` (UUID).
- `UpdateTransactionDto`: те же поля с `@IsOptional()` (паттерн `update-category.dto.ts`).
- `QueryTransactionsDto`: `dateFrom?` `@IsDateString()`, `dateTo?` `@IsDateString()`, `type?` `@IsEnum(TransactionType)`, `categoryId?` `@IsString()`. `ValidationPipe({transform:true})` уже глобально включён.

### Repository (`transactions.repository.ts`)
Инжект `PrismaService`. Методы: `create`, `findManyByUser(userId, filters)` (собирает `where` из фильтров + `orderBy: { date: "desc" }`), `findByIdForUser`, `update`, `delete`, и `aggregateSummary(userId, filters)` — через `prisma.transaction.groupBy({ by: ["type"] / ["categoryId","type"], _sum: { amount } })` для totals и разбивки по категориям.

### Service (`transactions.service.ts`)
Обработка ошибок как в `categories.service.ts`:
- `findByIdForUser` → `NotFoundException` если не найдено.
- `update`/`delete` — предварительная проверка через `findByIdForUser`.
- Перехват `Prisma.PrismaClientKnownRequestError`: `P2003` (FK — несуществующий `categoryId`) → `BadRequestException`; при `delete` категории это отрабатывает CategoriesService, не здесь.
- `summary` — преобразовать `Decimal` суммы в `string`, посчитать `balance = totalIncome - totalExpense`.

### Module (`transactions.module.ts`)
`imports: [CqrsModule]`, `controllers: [TransactionsController]`, `providers: [TransactionsRepository, TransactionsService, ...CommandHandlers, ...QueryHandlers]` — копия структуры `categories.module.ts`.

### Регистрация
В `apps/backend/src/app.module.ts` добавить `TransactionsModule` в `imports`.

---

## Shared-types

`packages/shared-types/src/index.ts` — добавить секцию `--- Transactions ---`:

```ts
export type TransactionType = "INCOME" | "EXPENSE";

export interface Transaction {
  id: string;
  amount: string;            // Decimal → string
  type: TransactionType;
  description: string | null;
  date: string;              // ISO
  categoryId: string;
  userId: string;
  createdAt: string;
}

export interface CreateTransactionDto {
  amount: string;
  type: TransactionType;
  description?: string;
  date: string;
  categoryId: string;
}

export interface UpdateTransactionDto {
  amount?: string;
  type?: TransactionType;
  description?: string;
  date?: string;
  categoryId?: string;
}

export interface TransactionsQuery {
  dateFrom?: string;
  dateTo?: string;
  type?: TransactionType;
  categoryId?: string;
}

export interface TransactionsSummary {
  totalIncome: string;
  totalExpense: string;
  balance: string;
  byCategory: { categoryId: string; totalIncome: string; totalExpense: string }[];
}
```

---

## Чек-лист выполнения

- [x] 1. Добавить `enum TransactionType` + `model Transaction` в `schema.prisma`
- [x] 2. Добавить обратные связи `transactions Transaction[]` в `User` и `Category`
- [x] 3. `npm run db:up` (если БД не поднята), затем `npm run prisma:migrate` + `prisma:generate` в `apps/backend` (миграция `20260610081443_add_transactions`)
- [x] 4. DTO: `create-`, `update-`, `query-transactions.dto.ts` (class-validator)
- [x] 5. `transactions.repository.ts` (CRUD + фильтры + groupBy для summary)
- [x] 6. `transactions.service.ts` (бизнес-логика + ошибки NotFound/BadRequest)
- [x] 7. Commands + handlers (create/update/delete)
- [x] 8. Queries + handlers (get-list / get-by-id / summary)
- [x] 9. `transactions.controller.ts` (6 эндпоинтов, `summary` до `:id`)
- [x] 10. `transactions.module.ts` + регистрация в `app.module.ts`
- [x] 11. Добавить типы в `packages/shared-types/src/index.ts`
- [x] 12. `npm run lint` + `npm run build` (зелёные)
- [x] 13. End-to-end проверка (26 проверок пройдены)

---

## Верификация (end-to-end)

1. `npm run db:up`, миграция применена, `npm run dev:backend`.
2. Получить JWT: зарегистрироваться/залогиниться (`POST /auth/...`), создать категорию (`POST /categories`) — запомнить `categoryId`.
3. С `Authorization: Bearer <token>` прогнать:
   - `POST /transactions` (INCOME и EXPENSE) → 201, `amount` строкой.
   - `GET /transactions` без фильтров и с `?type=EXPENSE&dateFrom=...&categoryId=...` → корректная фильтрация.
   - `GET /transactions/summary` → верные `totalIncome/totalExpense/balance` + `byCategory`.
   - `GET /transactions/:id` (свой / чужой/несуществующий → 404).
   - `PATCH /transactions/:id` → обновление полей.
   - `DELETE /transactions/:id` → 204; повторный GET → 404.
   - Попытка `DELETE /categories/:id` с транзакциями → ошибка FK (Restrict).
4. `npm run build` во всех воркспейсах — зелёный.
