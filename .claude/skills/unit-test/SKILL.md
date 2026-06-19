---
name: unit-test
description: Сгенерировать unit-тесты для NestJS-файла по переданному пути. Определяет тип артефакта (service / handler / controller / repository), читает зависимости и создаёт рядом `.spec.ts`.
allowed-tools: Read Glob Grep Write Bash(npm install *) Bash(npx jest *) Bash(cat *) Bash(ls *)
model: sonnet
argument-hint: <path-to-file>
---

## Аргумент

`$0` — путь к файлу относительно корня репозитория (например, `apps/backend/src/categories/categories.service.ts`).

Если аргумент не передан — попроси пользователя указать путь и прекрати выполнение.

## Шаг 1 — проверить Jest

Проверь, настроен ли Jest в `apps/backend/package.json` (ищи поле `"jest"` или скрипт `"test"`).

Если Jest **не настроен**:

1. Добавь скрипт `"test": "jest"` и `"test:watch": "jest --watch"` в `apps/backend/package.json`.
2. Добавь секцию `"jest"` в `apps/backend/package.json`:

```json
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

3. Установи dev-зависимости (если отсутствуют в `apps/backend/package.json`):

```bash
npm install --save-dev @nestjs/testing jest @types/jest ts-jest --workspace @my-pocket/backend
```

Сообщи пользователю, что настройка Jest выполнена.

## Шаг 2 — прочитать целевой файл

Прочитай файл по пути `$0`. Определи тип артефакта по суффиксу и содержимому:

| Суффикс / признак                                                   | Тип            |
| ------------------------------------------------------------------- | -------------- |
| `*.service.ts` / `@Injectable` + методы логики                      | **service**    |
| `*.handler.ts` / `implements ICommandHandler` или `IQueryHandler`   | **handler**    |
| `*.controller.ts` / `@Controller`                                   | **controller** |
| `*.repository.ts` / `@Injectable` + `PrismaService`                 | **repository** |

## Шаг 3 — прочитать зависимости

Прочитай файлы, которые импортирует целевой файл (только из `src/` этого же воркспейса — пропускай `@nestjs/*`, `@prisma/*`, внешние пакеты).

## Шаг 4 — сгенерировать `.spec.ts`

Создай файл рядом с целевым: тот же путь, расширение `.spec.ts`.

Паттерны для каждого типа — в [reference.md](reference.md).

## Шаг 5 — сообщить пользователю

После записи файла сообщи:
- путь к созданному `.spec.ts`
- как запустить: `npx jest <relative-spec-path> --testPathPattern` из `apps/backend`
