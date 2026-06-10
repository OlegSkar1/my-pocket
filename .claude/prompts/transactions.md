# Новая функциональность

Создать модуль транзакций

## Контекст (что уже есть)

- NestJS + Next.js + PostgreSQL + Prisma
- Авторизация (JWT), модуль категорий
- frontend авторизация

## Задача

Создай TransactionsModule - центральный модуль приложения для учета расходов и доходов

## Модель данных

Добавь модель Transaction в schema.prisma:

- id (String, uuid, @default(uuid()))
- amount (Decimal)
- type (Enum: INCOME, EXPENSE)
- description (String, nullable)
- date (DateTime)
- categoryId (String, связь с Category)
- userId (String, связь с User)
- createdAt (DateTime, @default(now()))

Обнови модели User и Category - добавь обратные связи transactons Transaction[]

После изменения схемы создай и примени миграцию

## Контроллер и эндпоинты

- POST /transactions: создать транзакцию
- GET /transactions: список с query параметрами dateFrom, dateTo, type, categoryId (по пользователю)
- GET /transactions/summary: агрегация
- GET /transactions/:id одна транзакция
- PATCH /transactions/:id обновить
- DELETE /transactions/:id удалить

## Паттерн

- для бекенда следуй структуре модуля из @apps/backend/src/categories/ как образец структуры
- Взаимодействие через CQRS

## Ограничения

- При составлении плана сделать чек-лист для выполнения задачи по шагам и сохраняй план в папку @.claude/plans
- Не добавлять зависимости без указания
- class-validator для DTO
- После реализации запустить сборку и провести end to end тесты
