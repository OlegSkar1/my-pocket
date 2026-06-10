# План: авторизация в API (модуль User + модуль Auth с JWT)

## Контекст

Бэкенд `apps/backend` сейчас не имеет понятия «пользователь» и не защищает эндпоинты. Нужно добавить авторизацию, чтобы API могло идентифицировать клиента и в дальнейшем привязывать к нему расходы.

Реализуем два модуля:
- **UsersModule** — модель `User` в Prisma + репозиторий + сервис работы с пользователями.
- **AuthModule** — регистрация и логин с выдачей **JWT (access-token)** через **Passport + passport-jwt**; пароли хешируются **bcrypt**.

**Взаимодействие между модулями — через CQRS** (`@nestjs/cqrs`): AuthModule не вызывает `UsersService` напрямую, а отправляет команды/запросы (`CommandBus`/`QueryBus`), которые обрабатывает UsersModule. Это развязывает модули — Auth зависит только от классов команд/запросов, а не от реализации Users.

Решения подтверждены пользователем: JWT только access-token; стек Passport + passport-jwt; хеш bcrypt; межмодульное взаимодействие через CQRS.

Текущее состояние (из исследования): `PrismaModule` глобальный и готов; в схеме только `Expense`; миграций ещё не было; нет `ValidationPipe`, `@nestjs/config`, JWT/passport/bcrypt/class-validator.

## Зависимости (apps/backend)

Добавить в `apps/backend/package.json` и установить:
- `@nestjs/cqrs` — шина команд/запросов для межмодульного взаимодействия
- `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`
- `@nestjs/config`
- `bcrypt`, `class-validator`, `class-transformer`
- dev: `@types/passport-jwt`, `@types/bcrypt`

## 1. Prisma: модель User

`apps/backend/prisma/schema.prisma` — добавить модель:

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

Поля: `name`, `email` (уникальный), `passwordHash` + служебные `id`, `createdAt`, `updatedAt`.

Затем: `npm run prisma:generate` и первая миграция `npm run prisma:migrate` (требует поднятой БД `npm run db:up` и заполненного `apps/backend/.env`).

## 2. Конфигурация и глобальные настройки

- `apps/backend/src/main.ts`: включить глобальный `ValidationPipe({ whitelist: true, transform: true })`.
- `apps/backend/src/app.module.ts`: подключить `ConfigModule.forRoot({ isGlobal: true })`, `UsersModule`, `AuthModule`. `CqrsModule` импортируется внутри каждого модуля (Users и Auth), которому нужны шины.
- `apps/backend/.env.example` (+ локальный `.env`): добавить `JWT_SECRET`, `JWT_EXPIRES_IN` (напр. `15m`).

## 3. UsersModule (CQRS — сторона обработчиков)

Каталог `apps/backend/src/users/`:
- `users.repository.ts` — `UsersRepository`, инкапсулирует доступ к `PrismaService` (методы: `findByEmail`, `findById`, `create`). Изолирует Prisma от обработчиков.
- `users.service.ts` — `UsersService`: бизнес-логика поверх репозитория (`findByEmail`, `findById`, `create({ name, email, passwordHash })`). Проверка уникальности email перед созданием (`ConflictException`). Сервис остаётся тонким — это реализация, к которой обращаются хендлеры.
- **Команды** `commands/`:
  - `create-user.command.ts` — `CreateUserCommand({ name, email, passwordHash })`.
  - `handlers/create-user.handler.ts` — `@CommandHandler(CreateUserCommand)`, вызывает `UsersService.create`, возвращает созданного `User`.
- **Запросы** `queries/`:
  - `get-user-by-email.query.ts` — `GetUserByEmailQuery(email)`; хендлер возвращает `User | null` (с `passwordHash` — нужен Auth для сверки).
  - `get-user-by-id.query.ts` — `GetUserByIdQuery(id)`; хендлер возвращает `User | null`.
  - `handlers/` — соответствующие `@QueryHandler`.
- `users.module.ts` — `UsersModule`: `imports: [CqrsModule]`, регистрирует `UsersService`, `UsersRepository` и массивы `CommandHandlers`/`QueryHandlers` в провайдерах. **Экспортировать `UsersService` не требуется** — наружу модуль доступен только через шину CQRS.

`PrismaService` доступен глобально через `@Global() PrismaModule` — отдельный импорт не нужен.

## 4. AuthModule (JWT, Passport, CQRS — сторона отправителя)

Каталог `apps/backend/src/auth/`:
- `dto/register.dto.ts` — `RegisterDto` (`name`, `email` `@IsEmail`, `password` `@MinLength`), с декораторами class-validator.
- `dto/login.dto.ts` — `LoginDto` (`email`, `password`).
- `auth.service.ts` — `AuthService` (инжектит `CommandBus`, `QueryBus`, `JwtService`):
  - `register(dto)`: `QueryBus.execute(GetUserByEmailQuery)` для проверки занятости email → `bcrypt.hash` → `CommandBus.execute(CreateUserCommand)` → `signToken`. (Проверка уникальности дублируется и в `UsersService` как страховка на уровне БД/гонок.)
  - `login(dto)`: `QueryBus.execute(GetUserByEmailQuery)` → `bcrypt.compare` → при неуспехе `UnauthorizedException` → `signToken`.
  - `signToken(user)`: `JwtService.sign({ sub: user.id, email })`.
- `strategies/jwt.strategy.ts` — `JwtStrategy extends PassportStrategy(Strategy)`: извлечение токена из `Authorization: Bearer`, секрет из `ConfigService`, `validate(payload)` → `{ userId, email }` (при необходимости проверка существования через `GetUserByIdQuery`).
- `guards/jwt-auth.guard.ts` — `JwtAuthGuard extends AuthGuard('jwt')` для защиты эндпоинтов (применим к расходам позже).
- `auth.controller.ts` — `AuthController`: `POST /auth/register`, `POST /auth/login`, возвращают `AuthResponse`.
- `auth.module.ts` — `imports: [CqrsModule, UsersModule, PassportModule, JwtModule.registerAsync(...)]` (секрет/срок из `ConfigService`); провайдеры `AuthService`, `JwtStrategy`. Импорт `UsersModule` нужен, чтобы его хендлеры были зарегистрированы в общей шине; сам `UsersService` Auth не инжектит.

Команды/запросы — это контракт между модулями. Ответы login/register не должны содержать `passwordHash` — `AuthService` мапит результат в `{ accessToken, user: { id, name, email } }`.

## 5. Общие типы (shared-types)

`packages/shared-types/src/index.ts` — добавить контракты (зеркалят модель, без `passwordHash`):

```ts
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}
export interface RegisterDto { name: string; email: string; password: string; }
export interface LoginDto { email: string; password: string; }
export interface AuthResponse { accessToken: string; user: Pick<User, "id" | "name" | "email">; }
```

DTO-классы в Nest реализуют эти интерфейсы (декораторы валидации остаются на классах).

## Критические файлы

- `apps/backend/prisma/schema.prisma` (модель User)
- `apps/backend/src/app.module.ts`, `apps/backend/src/main.ts`
- `apps/backend/src/users/*` (новый: repository, service, commands/, queries/, handlers, module)
- `apps/backend/src/auth/*` (новый: dto, service с CommandBus/QueryBus, strategy, guard, controller, module)
- `apps/backend/.env.example`
- `packages/shared-types/src/index.ts`
- `apps/backend/package.json`

## Проверка (end-to-end)

1. `npm run db:up`, заполнить `apps/backend/.env` (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`).
2. `npm run prisma:generate` + `npm run prisma:migrate` (в `apps/backend`) — создаётся таблица `User`.
3. `npm run lint` и `npm run build` — должны пройти во всех воркспейсах.
4. `npm run dev:backend`, затем проверить через HTTP-клиент:
   - `POST /auth/register` `{name,email,password}` → `201`, `{ accessToken, user }`.
   - повтор того же email → `409 Conflict`.
   - `POST /auth/login` верные креды → `200/201`, токен; неверные → `401`.
   - декодировать JWT (jwt.io) — в payload `sub`/`email`, подпись валидна.
