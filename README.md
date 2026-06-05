# my-pocket

Трекер расходов. Монорепозиторий на **npm workspaces**.

## Стек

| Область | Технология |
|---|---|
| Менеджер пакетов / монорепо | npm workspaces |
| Фронтенд | Next.js (TypeScript, App Router) — `apps/frontend` |
| Стилизация | Tailwind CSS v4 + shadcn/ui |
| Бэкенд | Nest.js (TypeScript) — `apps/backend` |
| База данных | PostgreSQL (локально — через Docker Compose) |
| ORM | Prisma (схема и клиент в `apps/backend`) |
| Общий код | `packages/*` |

## Структура

```
my-pocket/
├─ apps/
│  ├─ frontend/   # Next.js
│  └─ backend/    # Nest.js + Prisma
└─ packages/
   ├─ shared-types/   # общие TS-типы / контракты API
   └─ config/         # общие базовые конфиги
```

## Статус

Зависимости **установлены** (`npm install` выполнен), проект собирается и линтуется.

Установленные версии:

- Node.js: 20 LTS — целевая среда (см. `.nvmrc`); поле `engines.node` → `>=20`
- Next.js: 16.x (App Router, Turbopack) + React 19.x
- Tailwind CSS: 4.x — подключён через `@tailwindcss/postcss` (`apps/frontend/postcss.config.mjs`), CSS-first конфигурация в `src/app/globals.css` (`@import "tailwindcss"` + токены в `@theme`)
- shadcn/ui: компоненты добавляются через `npx shadcn@latest add ...` (их рантайм-зависимости подтягиваются при добавлении)
- Nest.js: 11.x (+ `@nestjs/cli`, `@nestjs/schematics`)
- Prisma: 6.x (`prisma` + `@prisma/client`)
- ESLint: 9.x (flat config) — `eslint`, `@eslint/js`, `typescript-eslint` (база — в `@my-pocket/config`); во фронтенде `eslint-config-next` 16.x подключается **нативным flat-конфигом** (`eslint-config-next/core-web-vitals` + `/typescript`), без `FlatCompat`

## Команды

```bash
npm install                 # установить/обновить зависимости всех воркспейсов
npm run db:up               # поднять PostgreSQL (Docker Compose, в фоне)
npm run db:down             # остановить PostgreSQL
npm run db:reset            # остановить и удалить данные БД (том)
npm run dev:frontend        # запустить фронтенд (Next.js)
npm run dev:backend         # запустить бэкенд (Nest.js, watch-режим)
npm run build               # собрать все воркспейсы
npm run lint                # линт всех воркспейсов
```

## Запуск окружения

Зависимости уже установлены. Для локального запуска:

1. Поднять PostgreSQL: `npm run db:up` (см. `docker-compose.yml`)
2. Заполнить `apps/backend/.env` (`DATABASE_URL`). Под дефолтные креды compose:
   `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/my_pocket?schema=public"`
3. Сгенерировать клиент и применить миграции:
   `npm run prisma:generate --workspace @my-pocket/backend`,
   затем `npm run prisma:migrate --workspace @my-pocket/backend`
4. Запустить dev-серверы (`npm run dev:backend`, `npm run dev:frontend`)
