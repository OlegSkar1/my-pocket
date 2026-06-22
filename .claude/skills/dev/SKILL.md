---
name: dev
description: Поднять окружение разработки — Docker с БД, бэкенд и фронтенд. Проверяет .env, запускает сервисы, дожидается готовности и сообщает об итоге.
allowed-tools: Bash(docker compose *) Bash(docker ps *) Bash(npm run *) Bash(curl *) Bash(ls *) Bash(cat *) Read
model: sonnet
argument-hint: [backend|frontend|db]
---

## Аргументы

- Без аргументов — поднять всё: DB + backend + frontend.
- `db` — только Docker с PostgreSQL.
- `backend` — DB + backend (без фронтенда).
- `frontend` — только фронтенд (предполагает, что DB и backend уже работают).

## Шаг 1 — проверить .env

Если будет запускаться бэкенд (аргумент не `frontend`):

Проверь, что файл `apps/backend/.env` существует и содержит `DATABASE_URL`.

```bash
ls apps/backend/.env
cat apps/backend/.env
```

Если файл отсутствует или `DATABASE_URL` не задан — сообщи пользователю:

```
⚠️  Отсутствует apps/backend/.env с DATABASE_URL.
Создай файл по шаблону apps/backend/.env.example:
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/my_pocket?schema=public"
  JWT_SECRET="dev-secret"
```

И прекрати выполнение.

## Шаг 2 — запустить Docker (DB)

Пропустить, если аргумент `frontend`.

```bash
npm run db:up
```

Подожди 2–3 секунды и проверь, что контейнер поднялся:

```bash
docker ps --filter name=my-pocket-postgres --format "{{.Status}}"
```

Если контейнер не в статусе `Up` — сообщи об ошибке и прекрати выполнение.

## Шаг 3 — запустить бэкенд

Пропустить, если аргумент `db` или `frontend`.

Запусти в фоне:

```bash
npm run dev:backend > /tmp/my-pocket-backend.log 2>&1 &
echo $!
```

Сохрани PID. Подожди до 15 секунд, периодически проверяя, что порт 3001 отвечает:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null
```

Если за 15 секунд бэкенд не ответил — выведи последние строки лога:

```bash
tail -20 /tmp/my-pocket-backend.log
```

И предупреди, что бэкенд ещё стартует (не прерывай выполнение).

## Шаг 4 — запустить фронтенд

Пропустить, если аргумент `db` или `backend`.

Запусти в фоне:

```bash
npm run dev:frontend > /tmp/my-pocket-frontend.log 2>&1 &
echo $!
```

Подожди до 15 секунд, проверяя порт 3000:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null
```

Если за 15 секунд фронтенд не ответил — выведи хвост лога:

```bash
tail -20 /tmp/my-pocket-frontend.log
```

И предупреди, что фронтенд ещё компилируется (не прерывай выполнение).

## Шаг 5 — итоговый отчёт

Выведи таблицу статусов:

```
## Окружение разработки

| Сервис     | Статус | URL / Детали                         |
|------------|--------|--------------------------------------|
| PostgreSQL | ✅ Up  | localhost:5432 (my_pocket)           |
| Backend    | ✅ Up  | http://localhost:3001                 |
|            |        | Swagger: http://localhost:3001/api/docs |
| Frontend   | ✅ Up  | http://localhost:3000                 |
```

Если сервис не запускался (пропущен по аргументу) — не включай его в таблицу.
Если сервис не ответил вовремя — ставь `⏳ Starting` вместо `✅ Up`.

Логи процессов:

- Backend: `/tmp/my-pocket-backend.log`
- Frontend: `/tmp/my-pocket-frontend.log`
