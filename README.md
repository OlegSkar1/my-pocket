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

На текущем этапе создан только **скелет проекта без установки зависимостей**.
Версии библиотек ещё не зафиксированы — устанавливаются на следующем этапе.

Рекомендуемые версии для установки (следующий этап):

- Node.js: 20 LTS (см. `.nvmrc`)
- Next.js: 16.x (App Router)
- Tailwind CSS: 4.x (`@tailwindcss/postcss`)
- shadcn/ui: компоненты добавляются через `npx shadcn@latest add ...`
- Nest.js: 11.x
- Prisma: 6.x
- ESLint: 9.x (flat config) — конфиги уже добавлены, нужны пакеты:
  - в корне (devDependencies): `eslint`, `@eslint/js`, `typescript-eslint`, `@eslint/eslintrc`
  - во фронтенде: `eslint-config-next`

## Команды (после установки зависимостей)

```bash
npm install                 # установить зависимости всех воркспейсов
npm run db:up               # поднять PostgreSQL (Docker Compose, в фоне)
npm run db:down             # остановить PostgreSQL
npm run db:reset            # остановить и удалить данные БД (том)
npm run dev:frontend        # запустить фронтенд (Next.js)
npm run dev:backend         # запустить бэкенд (Nest.js, watch-режим)
npm run build               # собрать все воркспейсы
```

## Следующий этап

1. `npm install`
2. Поднять PostgreSQL: `npm run db:up` (см. `docker-compose.yml`)
3. Заполнить `apps/backend/.env` (`DATABASE_URL`). Под дефолтные креды compose:
   `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/my_pocket?schema=public"`
4. `npx prisma generate` и первая миграция (`npx prisma migrate dev`)
5. Запустить dev-серверы
