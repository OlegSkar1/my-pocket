# План: фронтенд страниц логина и регистрации (Feature-Sliced Design)

## Context

В проекте **my-pocket** готов backend-модуль авторизации (Nest.js + JWT), но фронтенд (`apps/frontend`) пуст — голый Next.js 16 App Router с одной заглушкой `page.tsx`. Нужно реализовать страницы **входа** и **регистрации**, которые работают с готовым API, и заложить масштабируемую фронт-архитектуру по **Feature-Sliced Design (FSD)**, на которую дальше лягут категории и расходы.

Цель: пользователь может зарегистрироваться и войти; токен сохраняется; приватные роуты защищены; код организован по слоям FSD.

### Готовый API (из разведки)

| Эндпоинт | Метод | Тело запроса | Ответ |
|---|---|---|---|
| `/auth/register` | POST | `{ name, email, password }` | `{ accessToken, user: { id, name, email } }` |
| `/auth/login` | POST | `{ email, password }` | `200 + { accessToken, user: { id, name, email } }` |

- Валидация бэка: `name` — непустая строка; `email` — формат email; `password` — мин. 8 символов. Ошибка логина — `401 "Неверный email или пароль"`.
- Токен — **только access** (JWT, TTL 15 мин), refresh нет. Заголовок: `Authorization: Bearer <token>`.
- `/auth/me` **отсутствует** → текущего пользователя берём из ответа login/register и кешируем на клиенте.
- Глобального префикса нет; порт **3001**. CORS в `main.ts` **не настроен** — потребуется включить.
- Готовые типы в `packages/shared-types/src/index.ts`: `User`, `RegisterDto`, `LoginDto`, `AuthResponse`. **Переиспользуем их**, не дублируем.

## Принятые решения (значения по умолчанию, можно изменить)

1. **Хранение токена / защита роутов:** токен в cookie (`js-cookie`) + Next `middleware.ts` редиректит неавторизованных с приватных роутов на `/login`, а авторизованных — с `/login` и `/register` на `/`.
2. **Стек:** `react-hook-form` + `zod` + `@hookform/resolvers` (схемы валидации зеркалят бэкенд), `@tanstack/react-query` для мутаций, `zustand` (с `persist`) для стора сессии (user + флаг авторизации).
3. **UI:** `shadcn/ui` (radix + `cva` + `cn`) — компоненты в `shared/ui`. Согласуется с CLAUDE.md.
4. **FSD-слой `pages` переименован в `views`** — иначе конфликт с зарезервированной Next-папкой `pages/` (Pages Router).

## Целевая структура FSD (под `apps/frontend/src/`)

`app/` остаётся каталогом маршрутизации Next и одновременно несёт ответственность FSD-слоя **app** (провайдеры, глобальные стили). Маршруты — тонкие, переадресуют рендер на слой `views`.

```
src/
  app/                                  # Next App Router + FSD app-layer
    layout.tsx                          # root layout, монтирует <Providers>
    providers.tsx                       # 'use client': QueryClientProvider (+ инициализация сессии)
    globals.css                         # уже есть; дополнить токенами темы shadcn
    page.tsx                            # домашняя (приватная) страница
    (auth)/
      login/page.tsx                    # тонкий: рендерит <LoginPage> из views
      register/page.tsx                 # тонкий: рендерит <RegisterPage> из views
  views/                                # FSD "pages" слой (переименован)
    login/{ui/LoginPage.tsx, index.ts}
    register/{ui/RegisterPage.tsx, index.ts}
  features/
    auth/
      login/   { ui/LoginForm.tsx, model/useLogin.ts, model/schema.ts, index.ts }
      register/{ ui/RegisterForm.tsx, model/useRegister.ts, model/schema.ts, index.ts }
  entities/
    session/ { model/store.ts (zustand: user, isAuthenticated, setSession, clear),
               model/types.ts, index.ts }
  shared/
    api/    { client.ts (fetch-обёртка: base URL + Bearer + обработка 401), index.ts }
    config/ { env.ts (NEXT_PUBLIC_API_URL), routes.ts (пути роутов), index.ts }
    lib/    { token.ts (get/set/remove cookie через js-cookie), cn.ts, index.ts }
    ui/     { button.tsx, input.tsx, label.tsx, card.tsx, form.tsx }  # shadcn
```

**Правило импортов FSD:** слой импортит только из слоёв строго ниже (`app → views → features → entities → shared`). Импорты — через публичный API среза (`index.ts`), не вглубь.

## Ключевые детали реализации

- **`shared/api/client.ts`** — единая обёртка над `fetch`: подставляет `NEXT_PUBLIC_API_URL`, добавляет `Authorization: Bearer` из cookie, парсит JSON, нормализует ошибки Nest (`{ message }`, где message бывает строкой или массивом). На `401` — чистит сессию/cookie. Все запросы идут через неё.
- **`features/auth/*/model/schema.ts`** — zod-схемы: login (`email`, `password` непустой), register (`name` непустой, `email`, `password` min 8) — точно повторяют валидацию бэка.
- **`features/auth/*/model/use*.ts`** — `useMutation` (TanStack Query): зовёт `client`, при успехе пишет токен в cookie (`shared/lib/token`), кладёт `user` в `session`-стор, `router.push('/')`. При ошибке возвращает сообщение для формы.
- **`features/auth/*/ui/*Form.tsx`** — `'use client'`, RHF + `zodResolver`, поля на `shared/ui` (Input/Label/Button), вывод серверной ошибки, ссылка-переход между login/register.
- **`entities/session/model/store.ts`** — zustand с `persist` (хранит `user`); токен живёт в cookie (нужен middleware). Флаг `isAuthenticated` выводится из наличия токена/user.
- **`middleware.ts`** (в `apps/frontend/`, рядом с `src/`) — читает cookie с токеном; приватные пути без токена → `/login`; `/login`,`/register` с токеном → `/`.

## Изменяемые / создаваемые файлы

- **Зависимости** `apps/frontend/package.json`: добавить `react-hook-form`, `zod`, `@hookform/resolvers`, `@tanstack/react-query`, `zustand`, `js-cookie` (+ `@types/js-cookie`), и shadcn-набор (`class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tailwindcss-animate`, `@radix-ui/react-label`, `@radix-ui/react-slot`).
- **Создать** дерево `src/` по структуре выше + `apps/frontend/middleware.ts`, `apps/frontend/components.json` (shadcn).
- **Изменить**: `src/app/layout.tsx` (подключить `<Providers>`), `src/app/globals.css` (токены темы shadcn), `src/app/page.tsx` (приватная домашняя с приветствием/выходом).
- **Backend (минимально, пререкизит):** `apps/backend/src/main.ts` — `app.enableCors({ origin: 'http://localhost:3000', credentials: true })`, иначе браузерные запросы с фронта блокируются CORS.
- **`apps/frontend/.env`**: создать из `.env.example` (`NEXT_PUBLIC_API_URL=http://localhost:3001`).
- **CLAUDE.md**: добавить раздел про фронт-архитектуру FSD (слои, переименование `pages`→`views`, правило импортов).

## Чек-лист выполнения

### 0. Пререкизиты
- [x] Backend: включить CORS в `apps/backend/src/main.ts` (`origin: http://localhost:3000`, `credentials: true`).
- [x] Создать `apps/frontend/.env` из `.env.example`.

### 1. Зависимости и базовый каркас
- [x] Установить зависимости форм/валидации/запросов/стора/cookie (см. список выше) в воркспейс `@my-pocket/frontend`. Итог: zod v4, `@hookform/resolvers` v4 (совместимы), TanStack Query, zustand, js-cookie и др.
- [x] Компоненты shadcn написаны вручную в `shared/ui` (button, input, label, card, form) — без CLI, для надёжности с Tailwind v4.
- [x] Дополнить `src/app/globals.css` дизайн-токенами shadcn; убедиться, что `npm run lint`/`build` фронта проходят.

### 2. Слой `shared`
- [x] `shared/config/env.ts` — чтение `NEXT_PUBLIC_API_URL`; `shared/config/routes.ts` — константы путей.
- [x] `shared/lib/token.ts` — get/set/remove токена в cookie (js-cookie); `shared/lib/cn.ts`.
- [x] `shared/api/client.ts` — fetch-обёртка (base URL + Bearer + парсинг ошибок Nest + обработка 401).
- [x] Публичные `index.ts` для каждого среза shared.

### 3. Слой `entities/session`
- [x] `model/types.ts` — на базе `User`/`AuthResponse` из `@my-pocket/shared-types`.
- [x] `model/store.ts` — zustand `persist`: `user`, `isAuthenticated`, `setSession(authResponse)`, `clear()`.
- [x] `index.ts` — публичный API.

### 4. Слой `features/auth`
- [x] `login/model/schema.ts` и `register/model/schema.ts` — zod-схемы под валидацию бэка.
- [x] `login/model/useLogin.ts`, `register/model/useRegister.ts` — `useMutation` → `client` → токен в cookie + `session.setSession` + редирект.
- [x] `login/ui/LoginForm.tsx`, `register/ui/RegisterForm.tsx` — RHF + zodResolver + shared/ui, вывод серверной ошибки, перекрёстные ссылки.
- [x] Публичные `index.ts`.

### 5. Слой `views` и маршруты `app`
- [x] `views/login` и `views/register` — компоновка страницы (Card + форма + заголовок).
- [x] `src/app/providers.tsx` — `QueryClientProvider`.
- [x] `src/app/layout.tsx` — обернуть `children` в `<Providers>`.
- [x] `src/app/(auth)/login/page.tsx` и `.../register/page.tsx` — тонкие обёртки над `views`.
- [x] `src/app/page.tsx` — приватная домашняя (приветствие по `user`, кнопка «Выйти» → `clear()` + редирект).

### 6. Защита роутов
- [x] `apps/frontend/middleware.ts` — редиректы по наличию токена в cookie (приватные → `/login`; `/login`,`/register` при наличии токена → `/`).

### 7. Документация
- [x] Добавить в `CLAUDE.md` раздел «Фронт-архитектура (FSD)»: слои, `pages→views`, правило импортов «только вниз», публичные API срезов.

### 8. Проверка
- [x] `npm run lint` и `npm run build` проходят во фронтенде. Production build показывает `ƒ Proxy (Middleware)` и все 3 роута.
- [x] Сквозной прогон выполнен (см. ниже).

### Замечания по итогам прогона
- Next.js 16 переименовал `middleware.ts` → `src/proxy.ts` с экспортом `proxy` (новая конвенция). Обновлено.
- Backend не валидирует пустое `name` в RegisterDto (отсутствует `@IsNotEmpty`). Фронтенд защищён zod-схемой `min(1)`. При необходимости добавить на бэке.
- CORS работает: `Access-Control-Allow-Origin: http://localhost:3000` + `credentials: true`.

## Верификация (end-to-end)

1. Поднять БД и бэкенд: `npm run db:up`, заполнить `apps/backend/.env`, `prisma generate` + миграция, `npm run dev:backend`.
2. `npm run dev:frontend`, открыть `http://localhost:3000`.
3. **Регистрация:** перейти на `/register`, отправить `{name,email,password>=8}` → успешный редирект на `/`, видно имя пользователя.
4. **Валидация:** отправить короткий пароль/невалидный email → ошибки формы от zod до запроса.
5. **Логин:** «Выйти», на `/login` ввести верные данные → редирект на `/`; неверные → серверная ошибка «Неверный email или пароль».
6. **Защита:** без токена открыть `/` → редирект на `/login`; с токеном открыть `/login` → редирект на `/`.
7. Проверить, что токен лежит в cookie и уходит в `Authorization: Bearer` (DevTools → Network).
8. Перезагрузить страницу авторизованным — сессия сохраняется (persist + cookie).

## Открытые вопросы / на будущее
- Рекомендуется добавить на бэке `GET /auth/me` (защищённый) — тогда сессию можно восстанавливать из токена без хранения `user` на клиенте.
- ~~Нет refresh-токена: по истечении 15 мин любой защищённый запрос вернёт 401 → клиент чистит сессию и редиректит на `/login` (graceful, но без авто-продления).~~ **Реализовано (вариант Б):** `TokenGuard` в `providers.tsx` декодирует `exp` из JWT при каждом старте приложения. Если токен истёк — `removeToken()` + `clear()` + `router.replace('/login')`. Логика в `shared/lib/token.ts` (`isTokenExpired`). Коммит `2de6dc5`.
