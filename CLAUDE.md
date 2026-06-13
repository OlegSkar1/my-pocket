# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## О проекте

**my-pocket** — трекер личных расходов: записывать траты, относить их по категориям и видеть, куда уходят деньги. Учебный пет-проект на современном клиент-серверном стеке (Next.js + Nest.js + Prisma/PostgreSQL).

## Статус проекта

Зависимости **установлены** (`npm install` выполнен); `npm run lint` и `npm run build` проходят во всех воркспейсах. Установленные версии: Node 20 LTS (целевая среда, локально может быть новее), Next 16 + React 19, Tailwind 4, Nest 11, Prisma 6, ESLint 9 (flat config), TypeScript 5.9. Точный перечень — в `README.md` и `package.json` воркспейсов.

Для запуска бэкенда нужна БД: `npm run db:up`, заполнить `apps/backend/.env` (`DATABASE_URL`), затем `prisma generate` + миграция (см. ниже).

## Архитектура

npm workspaces монорепозиторий — трекер расходов. Корневой `package.json` объявляет воркспейсы `apps/*` и `packages/*`; команды запускаются из корня и делегируются через `--workspace`/`--workspaces`.

- `apps/frontend` (`@my-pocket/frontend`) — Next.js (App Router, TypeScript), Tailwind v4 + shadcn/ui. Tailwind подключён через `@tailwindcss/postcss` в `postcss.config.mjs`; CSS-first конфигурация в `src/app/globals.css` (`@import "tailwindcss"`, дизайн-токены в `@theme`). `globals.css` импортируется в `src/app/layout.tsx`.
- `apps/backend` (`@my-pocket/backend`) — Nest.js + Prisma. Слушает порт из `process.env.PORT` (по умолчанию **3001**). Prisma-схема в `apps/backend/prisma/schema.prisma`, клиент генерируется здесь же.
- `packages/shared-types` (`@my-pocket/shared-types`) — общие TS-типы и контракты API между фронтом и бэком. Импортируется из исходников напрямую (`main`/`types` → `./src/index.ts`, без сборки). **Типы API должны зеркалить Prisma-модели**: `Decimal` в Prisma представляется как `string` в TS-типах (см. `Expense.amount`).
- `packages/config` — общие базовые конфиги.

Базовый `tsconfig.base.json` в корне задаёт строгий режим (`strict`, `noUnusedLocals`, `noUnusedParameters`), `target ES2022`, `moduleResolution: Bundler`. Воркспейсы наследуют его через свои `tsconfig.json`.

**Линтинг (ESLint 9, flat config).** Общий базовый конфиг — `packages/config/eslint.base.mjs` (экспортируется как `@my-pocket/config/eslint.base.mjs`), тянет `@eslint/js` и `typescript-eslint` (они в `dependencies` пакета `@my-pocket/config`). Каждое приложение имеет свой `eslint.config.mjs`, который импортирует базу и добавляет специфику: бэкенд отключает шумные для Nest правила и ставит `sourceType: commonjs`; фронтенд подключает нативные flat-конфиги `eslint-config-next/core-web-vitals` и `eslint-config-next/typescript` (в v16 это готовые flat-массивы — `FlatCompat` не используется). `next lint` не используется (удалён в Next 16) — оба приложения линтятся прямым вызовом `eslint .`.

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
5. Создать `apps/frontend/.env` из `.env.example` (`NEXT_PUBLIC_API_URL=http://localhost:3001`)
6. Запустить dev-серверы

## Фронт-архитектура (Feature-Sliced Design)

Фронтенд в `apps/frontend/src` организован по **Feature-Sliced Design**. Правило импортов: каждый слой импортирует только из слоёв **строго ниже**. Импорты — только через публичный API среза (`index.ts`), не вглубь в файлы.

```
app → views → features → entities → shared
```

### Слои

| Слой | Путь | Назначение |
|---|---|---|
| **app** | `src/app/` | Next.js App Router + провайдеры (`providers.tsx`), глобальные стили |
| **views** | `src/views/` | Компоновка страниц (аналог FSD `pages`; переименован — Next резервирует `pages/`) |
| **features** | `src/features/` | Бизнес-фичи: `auth/login`, `auth/register` |
| **entities** | `src/entities/` | Бизнес-сущности: `session` (zustand-стор + типы) |
| **shared** | `src/shared/` | Переиспользуемое без бизнес-специфики |

### Сегменты `shared`

- `shared/api` — `apiClient` (fetch-обёртка: Bearer-токен, парсинг ошибок Nest, обработка 401)
- `shared/config` — `env` (переменные окружения), `ROUTES` (константы путей)
- `shared/lib` — `cn` (clsx + tailwind-merge), `getToken/setToken/removeToken` (js-cookie)
- `shared/ui` — shadcn/ui-компоненты (Button, Input, Label, Card, Form)

### Защита роутов

`apps/frontend/middleware.ts` — Edge middleware: читает cookie `access_token`. Неавторизованный на приватном роуте → редирект `/login`; авторизованный на `/login` или `/register` → редирект `/`.

## Рабочий процесс с ветками (GitHub Flow)

Проект следует **GitHub Flow**: `main` всегда стабилен и деплоабелен; любая работа ведётся в отдельной ветке.

### Правила

- Ветка создаётся от актуального `main` (`git checkout -b <name>`).
- Название — строчными буквами, слова через дефис, с префиксом типа:

| Префикс | Когда использовать |
|---|---|
| `feat/` | новая функциональность |
| `fix/` | исправление бага |
| `refactor/` | рефакторинг |
| `docs/` | только документация |
| `chore/` | конфиги, зависимости, инфраструктура |

- Пример: `feat/dashboard`, `fix/auth-token-refresh`, `docs/readme-setup`.
- Коммиты на `main` напрямую **запрещены** — только через Pull Request.
- PR создаётся как только есть что обсудить или проверить (можно черновой).
- Ветка удаляется после мержа.

## Соглашение о коммитах

Проект следует **Conventional Commits**. Формат:

```
<type>(<scope>): <описание на русском языке>
```

### Типы

| Тип | Когда использовать |
|---|---|
| `feat` | новая функциональность |
| `fix` | исправление бага |
| `refactor` | рефакторинг без изменения поведения |
| `docs` | изменения только в документации |
| `chore` | настройка инструментов, зависимостей, конфигов |
| `test` | добавление или исправление тестов |
| `style` | форматирование, пробелы (без логических изменений) |

### Скоупы

Используй скоуп, соответствующий затронутой области:

- `frontend` — `apps/frontend`
- `backend` — `apps/backend`
- `shared` — `packages/shared-types`
- `auth`, `categories`, `transactions` — конкретный модуль, если изменения в нём
- скоуп можно опустить для изменений, затрагивающих весь репозиторий

### Правила

- Описание — на **русском языке**, строчными буквами, без точки в конце.
- Одна логическая единица изменений — один коммит.
- Breaking change: добавить `!` после типа/скоупа (`feat(auth)!:`) и описать в теле коммита.

**Примеры:**

```
feat(transactions): добавить фильтрацию по дате
fix(auth): исправить ошибку истечения токена при рефреше
refactor(frontend): вынести константы роутов в shared/config
docs: обновить README — инструкция по первичной настройке
chore: обновить зависимости до актуальных версий
```

## Создание Pull Request

Перед созданием PR изучить изменения ветки относительно `main`:

```bash
git log main..HEAD --oneline          # коммиты ветки
git diff main --stat                  # затронутые файлы
git diff main -- <файл>               # детали конкретного файла
```

**Title** — по Conventional Commits: `feat(scope): описание на русском`.
Scope выбирается по главной затронутой области (`frontend`, `backend`, `transactions` и т. д.);
если изменения охватывают несколько областей — выбрать наиболее значимую.

**Body** должен включать:
- `## Что реализовано` — список изменений по областям (backend / frontend);
- `## Новые API-эндпоинты` — только если добавлены (метод + путь + краткое назначение);
- `## Тест-план` — чеклист шагов для ручной проверки.

Создавать PR через `gh pr create`; тело передавать через heredoc:

```bash
gh pr create --title "..." --body "$(cat <<'EOF'
## Что реализовано
...
## Новые API-эндпоинты
...
## Тест-план
...
EOF
)"
```
