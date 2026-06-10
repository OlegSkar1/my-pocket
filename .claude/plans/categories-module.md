# План: модуль «Категории расходов» (backend)

## Context

Сейчас в трекере `my-pocket` категория расхода хранится как простая строка в поле `Expense.category`. Нужна полноценная сущность **Category**, привязанная к пользователю, чтобы каждый пользователь вёл свой набор категорий с названием, цветом и иконкой. Модуль должен предоставлять защищённый JWT-гардом CRUD API с валидацией входных данных через `class-validator` — по тем же паттернам, что уже использованы в `UsersModule`/`AuthModule` (NestJS + `@nestjs/cqrs` + Prisma).

Решения по уточнениям:
- **Связываем Expense с Category** — у `Expense` убираем строковое поле `category`, добавляем `categoryId` + relation на `Category`. Связь опциональная (`categoryId String?`), чтобы расход мог существовать без категории.
- **userId** достаём через новый переиспользуемый декоратор `@CurrentUser`.
- **Без тестов** — в репозитории их пока нет.

## Модель данных

Добавить в `apps/backend/prisma/schema.prisma` модель `Category`, обратную связь у `User` и связать `Expense` с `Category`:

```prisma
model Category {
  id        String    @id @default(uuid())
  name      String
  color     String
  icon      String
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expenses  Expense[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@unique([userId, name])
}
```

В модель `User` добавить поле связи: `categories Category[]`.

В модели `Expense` заменить строковое поле `category String?` на связь:

```prisma
model Expense {
  id         String    @id @default(uuid())
  title      String
  amount     Decimal   @db.Decimal(12, 2)
  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  spentAt    DateTime  @default(now())
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

- `color` — строка (hex, напр. `#FF8800`); `icon` — строка (эмодзи или название иконки).
- `@@unique([userId, name])` — у одного пользователя не должно быть двух категорий с одинаковым именем.
- `onDelete: Cascade` (Category→User) — категории удаляются вместе с пользователем.
- `categoryId String?` + `onDelete: SetNull` (Expense→Category) — расход может быть без категории; при удалении категории у связанных расходов `categoryId` обнуляется (расходы не теряются).

**Миграция данных.** Папки `migrations` ещё нет, реальных строк в `Expense.category` пока тоже нет — поэтому переход безопасен: достаточно `npm run prisma:migrate` (в `apps/backend`), которая дропнет старую строковую колонку и создаст `categoryId`. Если на момент внедрения в БД уже окажутся расходы со строковыми категориями, их значения миграцией не сохранятся (ручной перенос строк в записи `Category` — отдельная задача).

## Общие типы

В `packages/shared-types/src/index.ts` добавить (зеркалят Prisma, `DateTime` → `string`):

```typescript
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  color: string;
  icon: string;
}

export interface UpdateCategoryDto {
  name?: string;
  color?: string;
  icon?: string;
}
```

Там же обновить существующие типы расхода под новую связь:
- `Expense`: заменить `category: string | null` на `categoryId: string | null`.
- `CreateExpenseDto`: заменить `category?: string` на `categoryId?: string`.

## Структура модуля

Создать `apps/backend/src/categories/` по образцу `src/users/`:

```
categories/
├── categories.module.ts
├── categories.service.ts
├── categories.repository.ts
├── categories.controller.ts
├── dto/
│   ├── create-category.dto.ts
│   └── update-category.dto.ts
├── commands/
│   ├── create-category.command.ts
│   ├── update-category.command.ts
│   ├── delete-category.command.ts
│   └── handlers/
│       ├── create-category.handler.ts
│       ├── update-category.handler.ts
│       └── delete-category.handler.ts
└── queries/
    ├── get-categories.query.ts
    ├── get-category-by-id.query.ts
    └── handlers/
        ├── get-categories.handler.ts
        └── get-category-by-id.handler.ts
```

### Repository (`categories.repository.ts`)
Инжектит `PrismaService` (глобальный модуль уже доступен). Методы: `create`, `findManyByUser(userId)`, `findByIdForUser(id, userId)`, `update(id, userId, data)`, `delete(id, userId)`. **Все запросы фильтруют по `userId`** — изоляция данных между пользователями. Образец: `src/users/users.repository.ts`.

### Service (`categories.service.ts`)
Бизнес-логика поверх репозитория. При `findByIdForUser`/`update`/`delete`, если запись не найдена для данного userId → бросать `NotFoundException`. Обработка нарушения `@@unique` (P2002) при создании/обновлении → `ConflictException`.

### CQRS
- Команды: `CreateCategoryCommand(userId, dto)`, `UpdateCategoryCommand(id, userId, dto)`, `DeleteCategoryCommand(id, userId)`.
- Запросы: `GetCategoriesQuery(userId)`, `GetCategoryByIdQuery(id, userId)`.
- Хендлеры помечены `@CommandHandler` / `@QueryHandler`, делегируют в `CategoriesService`. Образец: `src/users/commands/handlers/create-user.handler.ts` и `src/users/queries/handlers/`.
- В `categories.module.ts` импортировать `CqrsModule`, зарегистрировать `CategoriesRepository`, `CategoriesService`, `...CommandHandlers`, `...QueryHandlers` (как в `src/users/users.module.ts`).

### Controller (`categories.controller.ts`)
Префикс `categories`, весь контроллер под `@UseGuards(JwtAuthGuard)` (`src/auth/guards/jwt-auth.guard.ts`). userId берём через `@CurrentUser`. Эндпоинты диспатчат команды/запросы через `CommandBus`/`QueryBus`:

| Метод | Путь | Действие |
|-------|------|----------|
| `POST` | `/categories` | создать (`CreateCategoryDto`) |
| `GET` | `/categories` | список категорий пользователя |
| `GET` | `/categories/:id` | одна категория |
| `PATCH` | `/categories/:id` | обновить (`UpdateCategoryDto`) |
| `DELETE` | `/categories/:id` | удалить |

### DTO (валидация через class-validator)
По образцу `src/auth/dto/register.dto.ts`:

```typescript
// create-category.dto.ts
export class CreateCategoryDto {
  @IsString() @IsNotEmpty() @MaxLength(50)
  name!: string;

  @IsString() @Matches(/^#([0-9a-fA-F]{6})$/) // hex-цвет
  color!: string;

  @IsString() @IsNotEmpty() @MaxLength(64)
  icon!: string;
}
```

`update-category.dto.ts` — те же поля, все опциональные (`@IsOptional()`), либо `extends PartialType(CreateCategoryDto)` через `@nestjs/mapped-types`. Глобальный `ValidationPipe({ whitelist: true, transform: true })` уже включён в `src/main.ts` — отдельная настройка не нужна.

## Новый декоратор @CurrentUser

Создать `apps/backend/src/auth/decorators/current-user.decorator.ts` — param-декоратор, достающий `request.user` (туда `JwtStrategy.validate` кладёт `{ userId, email }` — см. `src/auth/strategies/jwt.strategy.ts`):

```typescript
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user?.[data] : request.user;
  },
);
```

В контроллере: `@CurrentUser("userId") userId: string`. Тип `AuthenticatedUser` уже определён в auth-модуле.

## Регистрация модуля

В `apps/backend/src/app.module.ts` добавить `CategoriesModule` в `imports` (после `AuthModule`).

## Verification

1. `npm run db:up` (если БД не поднята), `.env` с `DATABASE_URL`.
2. В `apps/backend`: `npm run prisma:migrate` — миграция применяется без ошибок, клиент сгенерирован.
3. Из корня: `npm run lint` и `npm run build` — проходят во всех воркспейсах.
4. Запустить `npm run dev:backend`, получить токен через `POST /auth/register` или `/auth/login`.
5. Проверить CRUD с заголовком `Authorization: Bearer <token>`:
   - `POST /categories` с валидным телом → 201, объект с `id` и `userId`.
   - `POST` с невалидным `color` (не hex) → 400 от ValidationPipe.
   - Без токена → 401 (JwtAuthGuard).
   - `GET /categories` → только категории текущего пользователя.
   - `PATCH`/`DELETE /categories/:id` чужого/несуществующего id → 404.
   - Повторный `POST` с тем же `name` → 409 (Conflict).
   - Удаление категории, на которую ссылаются расходы → у этих `Expense` поле `categoryId` становится `null` (поведение `onDelete: SetNull`), сами расходы остаются.

## Чек-лист реализации

### Prisma — схема и миграция
- [x] Добавить модель `Category` в `apps/backend/prisma/schema.prisma`
- [x] Добавить `categories Category[]` в модель `User`
- [x] Заменить `category String?` на `categoryId String?` + relation в модели `Expense`
- [x] Выполнить `npm run prisma:migrate` в `apps/backend` — миграция проходит без ошибок

### Общие типы (`packages/shared-types/src/index.ts`)
- [x] Добавить интерфейс `Category`
- [x] Добавить интерфейс `CreateCategoryDto`
- [x] Добавить интерфейс `UpdateCategoryDto`
- [x] В `Expense`: заменить `category: string | null` на `categoryId: string | null`
- [x] В `CreateExpenseDto`: заменить `category?: string` на `categoryId?: string`

### Декоратор `@CurrentUser`
- [x] Создать `apps/backend/src/auth/decorators/current-user.decorator.ts`

### DTO
- [x] Создать `apps/backend/src/categories/dto/create-category.dto.ts`
- [x] Создать `apps/backend/src/categories/dto/update-category.dto.ts` _(исправлено: добавлен `@IsNotEmpty()` на поле `name`)_

### Repository
- [x] Создать `apps/backend/src/categories/categories.repository.ts` с методами `create`, `findManyByUser`, `findByIdForUser`, `update`, `delete`

### Service
- [x] Создать `apps/backend/src/categories/categories.service.ts` с `NotFoundException` при not found и `ConflictException` при P2002

### CQRS — команды
- [x] Создать `commands/create-category.command.ts`
- [x] Создать `commands/update-category.command.ts`
- [x] Создать `commands/delete-category.command.ts`
- [x] Создать `commands/handlers/create-category.handler.ts`
- [x] Создать `commands/handlers/update-category.handler.ts`
- [x] Создать `commands/handlers/delete-category.handler.ts`

### CQRS — запросы
- [x] Создать `queries/get-categories.query.ts`
- [x] Создать `queries/get-category-by-id.query.ts`
- [x] Создать `queries/handlers/get-categories.handler.ts`
- [x] Создать `queries/handlers/get-category-by-id.handler.ts`

### Controller
- [x] Создать `apps/backend/src/categories/categories.controller.ts` (5 эндпоинтов, `JwtAuthGuard`, `@CurrentUser`)

### Module
- [x] Создать `apps/backend/src/categories/categories.module.ts` (импорт `CqrsModule`, регистрация репозитория, сервиса, хендлеров)
- [x] Добавить `CategoriesModule` в `imports` в `apps/backend/src/app.module.ts`

### Финальная проверка
- [x] `npm run lint` — без ошибок во всех воркспейсах
- [x] `npm run build` — без ошибок во всех воркспейсах
- [x] `POST /categories` с валидным телом → 201
- [x] `POST /categories` с невалидным `color` → 400
- [x] Запрос без токена → 401
- [x] `GET /categories` → только свои категории
- [x] `PATCH`/`DELETE` чужого id → 404
- [x] Повторный `POST` с тем же `name` → 409
- [x] Удаление категории с расходами → расходы остаются, `categoryId` = `null`
