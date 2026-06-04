# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Статус проекта

Это **скелет монорепозитория без установленных зависимостей**. В `package.json` всех воркспейсов поля `dependencies`/`devDependencies` пустые, версии библиотек ещё не зафиксированы. Команды `npm run dev:*`, `lint`, `build` не заработают, пока не выполнен `npm install` и не добавлены зависимости (Next.js, Nest.js, Prisma и т.д.). Целевые версии указаны в `README.md` (Node 20 LTS, Next 16, Tailwind 4, Nest 11, Prisma 6).

## Архитектура

npm workspaces монорепозиторий — трекер расходов. Корневой `package.json` объявляет воркспейсы `apps/*` и `packages/*`; команды запускаются из корня и делегируются через `--workspace`/`--workspaces`.

- `apps/frontend` (`@my-pocket/frontend`) — Next.js (App Router, TypeScript), Tailwind v4 + shadcn/ui.
- `apps/backend` (`@my-pocket/backend`) — Nest.js + Prisma. Слушает порт из `process.env.PORT` (по умолчанию **3001**). Prisma-схема в `apps/backend/prisma/schema.prisma`, клиент генерируется здесь же.
- `packages/shared-types` (`@my-pocket/shared-types`) — общие TS-типы и контракты API между фронтом и бэком. Импортируется из исходников напрямую (`main`/`types` → `./src/index.ts`, без сборки). **Типы API должны зеркалить Prisma-модели**: `Decimal` в Prisma представляется как `string` в TS-типах (см. `Expense.amount`).
- `packages/config` — общие базовые конфиги.

Базовый `tsconfig.base.json` в корне задаёт строгий режим (`strict`, `noUnusedLocals`, `noUnusedParameters`), `target ES2022`, `moduleResolution: Bundler`. Воркспейсы наследуют его через свои `tsconfig.json`.

**Линтинг (ESLint 9, flat config).** Общий базовый конфиг — `packages/config/eslint.base.mjs` (экспортируется как `@my-pocket/config/eslint.base.mjs`). Каждое приложение имеет свой `eslint.config.mjs`, который импортирует базу и добавляет специфику: бэкенд отключает шумные для Nest правила и ставит `sourceType: commonjs`; фронтенд добавляет `next/core-web-vitals` + `next/typescript` через `FlatCompat`. `next lint` не используется (удалён в Next 16) — оба приложения линтятся прямым вызовом `eslint .`. Нужные пакеты пока не установлены (см. список в `README.md`).

## Команды

```bash
npm install                 # установить зависимости всех воркспейсов
npm run db:up               # PostgreSQL через Docker Compose (фон)
npm run db:down             # остановить PostgreSQL
npm run db:reset            # остановить + удалить том с данными
npm run dev:frontend        # Next.js dev
npm run dev:backend         # Nest.js watch (start:dev)
npm run build               # сборка всех воркспейсов (--if-present)
npm run lint                # линт всех воркспейсов (--if-present)
```

Внутри `apps/backend`:

```bash
npm run prisma:generate     # prisma generate
npm run prisma:migrate      # prisma migrate dev
```

## База данных

PostgreSQL 16 поднимается через `docker-compose.yml` (контейнер `my-pocket-postgres`, порт 5432, креды `postgres:postgres`, БД `my_pocket`). Бэкенд ожидает `DATABASE_URL` в `apps/backend/.env` (шаблон — `.env.example`); дефолтное значение под compose:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/my_pocket?schema=public"
```

## Первичная настройка окружения

1. `npm install`
2. `npm run db:up`
3. Заполнить `apps/backend/.env` (`DATABASE_URL`)
4. `npm run prisma:generate` + первая миграция `npm run prisma:migrate` (в `apps/backend`)
5. Запустить dev-серверы
