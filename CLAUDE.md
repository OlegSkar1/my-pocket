# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## О проекте

**my-pocket** — трекер личных расходов: записывать траты, относить их по категориям и видеть, куда уходят деньги. Учебный пет-проект на современном клиент-серверном стеке (Next.js + Nest.js + Prisma/PostgreSQL).

## Статус проекта

Зависимости **установлены** (`npm install` выполнен); `npm run lint` и `npm run build` проходят во всех воркспейсах. Установленные версии: Node 20 LTS (целевая среда, локально может быть новее), Next 16 + React 19, Tailwind 4, Nest 11, Prisma 6, ESLint 9 (flat config), TypeScript 5.9. Точный перечень — в `README.md` и `package.json` воркспейсов.

Для запуска бэкенда нужна БД: `npm run db:up`, заполнить `apps/backend/.env` (`DATABASE_URL`), затем `prisma generate` + миграция (см. [apps/backend/CLAUDE.md](apps/backend/CLAUDE.md)).

## Структура монорепозитория

npm workspaces — корневой `package.json` объявляет воркспейсы `apps/*` и `packages/*`; команды запускаются из корня и делегируются через `--workspace`/`--workspaces`.

| Воркспейс               | Имя                       | Назначение                                     | Документация                                       |
| ----------------------- | ------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| `apps/frontend`         | `@my-pocket/frontend`     | Next.js (App Router) + Tailwind v4 + shadcn/ui | [apps/frontend/CLAUDE.md](apps/frontend/CLAUDE.md) |
| `apps/backend`          | `@my-pocket/backend`      | Nest.js + Prisma + PostgreSQL                  | [apps/backend/CLAUDE.md](apps/backend/CLAUDE.md)   |
| `packages/shared-types` | `@my-pocket/shared-types` | Общие TS-типы и контракты API                  | —                                                  |
| `packages/config`       | `@my-pocket/config`       | Общие базовые конфиги (ESLint base)            | —                                                  |

### `packages/shared-types`

Общие TS-типы и контракты API между фронтом и бэком. Импортируется из исходников напрямую (`main`/`types` → `./src/index.ts`, без сборки). **Типы API должны зеркалить Prisma-модели**: `Decimal` в Prisma представляется как `string` в TS-типах (см. `Expense.amount`). При добавлении/изменении контракта правьте оба берега и `shared-types` в одном PR.

### Базовая конфигурация

- `tsconfig.base.json` в корне задаёт строгий режим (`strict`, `noUnusedLocals`, `noUnusedParameters`), `target ES2022`, `moduleResolution: Bundler`. Воркспейсы наследуют его через свои `tsconfig.json`.
- **ESLint 9 (flat config).** Общий базовый конфиг — `packages/config/eslint.base.mjs` (экспортируется как `@my-pocket/config/eslint.base.mjs`), тянет `@eslint/js` и `typescript-eslint` (они в `dependencies` пакета `@my-pocket/config`). Специфика — в `eslint.config.mjs` каждого приложения.

## Команды (корень)

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

Команды конкретных приложений — в их CLAUDE.md.

## База данных

PostgreSQL 16 поднимается через `docker-compose.yml` (контейнер `my-pocket-postgres`, порт 5432, креды `postgres:postgres`, БД `my_pocket`). Бэкенд ожидает `DATABASE_URL` в `apps/backend/.env` (шаблон — `.env.example`); дефолт под compose:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/my_pocket?schema=public"
```

## Первичная настройка окружения

1. `npm install`
2. `npm run db:up`
3. Заполнить `apps/backend/.env` (`DATABASE_URL`, `JWT_SECRET`)
4. В `apps/backend`: `npm run prisma:generate` + первая миграция `npm run prisma:migrate`
5. Создать `apps/frontend/.env` из `.env.example` (`NEXT_PUBLIC_API_URL=http://localhost:3001`)
6. Запустить dev-серверы: `npm run dev:backend` и `npm run dev:frontend`

## Рабочий процесс с ветками (GitHub Flow)

Проект следует **GitHub Flow**: `main` всегда стабилен и деплоабелен; любая работа ведётся в отдельной ветке.

### Правила

- Ветка создаётся от актуального `main` (`git checkout -b <name>`).
- Название — строчными буквами, слова через дефис, с префиксом типа:

| Префикс     | Когда использовать                   |
| ----------- | ------------------------------------ |
| `feat/`     | новая функциональность               |
| `fix/`      | исправление бага                     |
| `refactor/` | рефакторинг                          |
| `docs/`     | только документация                  |
| `chore/`    | конфиги, зависимости, инфраструктура |

- Пример: `feat/dashboard`, `fix/auth-token-refresh`, `docs/readme-setup`.
- Коммиты на `main` напрямую **запрещены** — только через Pull Request.
- PR создаётся как только есть что обсудить или проверить (можно черновой).
- Ветка удаляется после мержа.

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

## Документация

При добавлении функционала проверяй .claude/docs/\*.
Актуализируй файлы при изменении архитектуры или API.
