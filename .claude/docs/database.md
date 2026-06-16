# База данных

PostgreSQL 16. Схема — `apps/backend/prisma/schema.prisma`. ORM — Prisma 6.

Контейнер поднимается командой `npm run db:up` (`docker-compose.yml` в корне проекта).

```
host:     localhost:5432
database: my_pocket
user:     postgres
password: postgres
```

---

## Модели

### `User`

Пользователь системы.

| Поле | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | `String` | PK, `uuid()` | Идентификатор |
| `email` | `String` | `@unique` | Email, используется для входа |
| `name` | `String` | — | Отображаемое имя |
| `passwordHash` | `String` | — | bcrypt-хеш пароля (rounds = 10) |
| `createdAt` | `DateTime` | `@default(now())` | Дата регистрации |
| `updatedAt` | `DateTime` | `@updatedAt` | Дата последнего обновления |

**Связи:**
- `categories Category[]` — каскадное удаление (`onDelete: Cascade`)
- `transactions Transaction[]` — каскадное удаление (`onDelete: Cascade`)

---

### `Category`

Категория транзакций, принадлежащая конкретному пользователю.

| Поле | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | `String` | PK, `uuid()` | Идентификатор |
| `name` | `String` | — | Название (уникально в рамках пользователя) |
| `color` | `String` | — | HEX-цвет (`#RRGGBB`), используется в UI |
| `icon` | `String` | — | Название иконки (строка-идентификатор) |
| `userId` | `String` | FK → `User.id` | Владелец |
| `createdAt` | `DateTime` | `@default(now())` | Дата создания |
| `updatedAt` | `DateTime` | `@updatedAt` | Дата обновления |

**Ограничения:**
- `@@unique([userId, name])` — имя уникально в рамках одного пользователя (ошибка Prisma `P2002`)

**Связи:**
- `user User` — `onDelete: Cascade` (удаление пользователя удаляет его категории)
- `transactions Transaction[]` — `onDelete: Restrict` (нельзя удалить категорию, пока есть транзакции; ошибка `P2003`)

---

### `Transaction`

Финансовая транзакция (доход или расход).

| Поле | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | `String` | PK, `uuid()` | Идентификатор |
| `amount` | `Decimal` | `@db.Decimal(12, 2)` | Сумма. В API приходит как **`string`** |
| `type` | `TransactionType` | — | `INCOME` или `EXPENSE` |
| `description` | `String?` | nullable | Описание (до 255 символов) |
| `date` | `DateTime` | — | Дата транзакции (хранится в UTC) |
| `categoryId` | `String` | FK → `Category.id` | Категория |
| `userId` | `String` | FK → `User.id` | Владелец |
| `createdAt` | `DateTime` | `@default(now())` | Дата создания записи |

> `updatedAt` у `Transaction` **отсутствует** — транзакции редактируются через `update`, но момент изменения не отслеживается.

**Индексы:**
- `@@index([userId])` — ускоряет выборку по пользователю
- `@@index([categoryId])` — ускоряет выборку по категории

**Связи:**
- `user User` — `onDelete: Cascade`
- `category Category` — `onDelete: Restrict` (нельзя удалить категорию, пока есть транзакции)

---

### `Expense` (legacy)

Учебная модель из ранней итерации проекта. В продуктовых сценариях **не используется** — заменена моделью `Transaction`.

| Поле | Тип | Описание |
|---|---|---|
| `id` | `String` | PK |
| `title` | `String` | Название расхода |
| `amount` | `Decimal(12,2)` | Сумма |
| `categoryId` | `String?` | FK → `Category.id`, nullable, `onDelete: SetNull` |
| `spentAt` | `DateTime` | Дата расхода |
| `createdAt` | `DateTime` | — |
| `updatedAt` | `DateTime` | — |

---

## Перечисления

### `TransactionType`

```
INCOME   — доход
EXPENSE  — расход
```

---

## Дата и время

- Все поля `DateTime` хранятся в **UTC**.
- Фильтрация по дате в API использует **полуоткрытый интервал**: `dateFrom` → `[00:00 UTC]`, `dateTo` → `< 00:00 UTC следующего дня`.
- Поле `date` у транзакции хранит полный `DateTime`, но клиент передаёт только `YYYY-MM-DD`.

---

## Decimal и API

Поле `amount` в Prisma имеет тип `Decimal`. При сериализации в JSON Prisma отдаёт его как **строку** (например, `"1500.00"`). В `@my-pocket/shared-types` `amount` описан как `string`. Фронт форматирует его через `formatMoney`.

---

## Команды Prisma

```bash
# из apps/backend или через --workspace из корня
npm run prisma:generate          # сгенерировать клиент после изменений схемы
npm run prisma:migrate           # применить/создать миграции (migrate dev)

# разовые операции
npx prisma migrate reset         # сброс БД (только локально)
npx prisma studio                # GUI для просмотра данных
```

Файлы миграций находятся в `apps/backend/prisma/migrations/`.
