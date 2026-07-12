# CODEX_HANDOFF — AAA CRM Premium

Технический паспорт проекта для проверки. Обновлён: 2026-07-12.

## 1. Архитектура

- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict).
- **UI:** Tailwind CSS v4 (токены в `app/globals.css`, `@theme inline`), shadcn/ui на Base UI (`components/ui/*`).
- **Клиентские данные:** SWR поверх `/api/*`; мутации — `apiFetch` (`lib/api.ts`, добавляет CSRF-заголовок) + `mutate()`.
- **Серверные данные:** Repository-абстракция (`lib/server/repository.ts`) с двумя реализациями:
  - `PgRepository` (`lib/server/pg-repo.ts`) — **PostgreSQL (Neon)**, включается при наличии `DATABASE_URL`;
  - `MemoryRepository` (`lib/server/memory-repo.ts`) — in-memory fallback для локального демо без БД.
  - Выбор — в `lib/server/store.ts` (`getRepo()`); сид применяется автоматически в обе реализации.
- **Схема БД:** `db/migrations/0001_init.sql` (tenants, users, sessions, contacts, client_companies, deals, tasks, conversations, messages, calls, assistants, knowledge, integrations, events, audit_log, integration_events). Все доменные таблицы имеют `company_id` + индексы; применяется `node scripts/migrate.mjs` (таблица `schema_migrations` защищает от повторного применения).
- **Auth/RBAC:** серверные сессии в БД (`sessions`, случайный 256-битный токен, TTL 7 дней, sliding refresh) + guard-функции (`lib/server/auth.ts`). Пароли — scrypt (`lib/server/passwords.ts`); сидовые пользователи входят по `DEMO_PASSWORD` (по умолчанию `demo1234`), самозарегистрированные — только по своему хешу. Каждый API-роут проверяет права на сервере.
- **CSRF:** double-submit cookie (`aaa_csrf`, читаемая) + заголовок `x-csrf-token` на всех мутациях; сверка в `assertCsrf`.
- **Rate limiting:** на вход/регистрацию (in-memory sliding window, `lib/server/security.ts`).
- **Валидация:** zod-схемы во всех мутирующих роутах.
- **Middleware:** `proxy.ts` — редирект неавторизованных на `/login?next=…` для всех страниц CRM.

### Структура каталогов

```
app/
  login/page.tsx          # Экран входа (демо-доступы гейтятся NEXT_PUBLIC_DEMO_MODE)
  (app)/                  # Авторизованная зона: layout с сайдбаром + guard
    page.tsx              # Обзор (дашборд)
    pipeline/ contacts/ companies/ tasks/ calendar/
    inbox/ calls/ ai/
    reports/ team/ ceo/ integrations/ knowledge/ settings/
  api/                    # Все API-роуты (см. раздел 3)
components/
  shell/                  # Сайдбар, топбар
  ui/                     # shadcn/ui-примитивы
  <feature>/              # По одному каталогу на страницу
lib/
  types.ts                # Все доменные типы (модели данных)
  demo.ts                 # Флаг демо-режима (NEXT_PUBLIC_DEMO_MODE)
  api.ts, format.ts, nav.ts, labels.ts
  server/
    seed.ts               # Сид: 2 тенанта, 5 пользователей, сделки/контакты/задачи/диалоги/звонки
    store.ts              # Repository-абстракция + in-memory singleton
    auth.ts               # Сессии, RBAC-guards, tenant isolation
hooks/                    # use-workspace (SWR), use-mobile
tests/                    # Vitest: RBAC, tenant isolation, целостность сида
```

## 2. Страницы и маршруты

| Маршрут         | Страница                     | Доступ            |
| --------------- | ---------------------------- | ----------------- |
| `/login`        | Вход                         | публичный         |
| `/`             | Обзор (KPI, воронка, графики)| все роли          |
| `/pipeline`     | Kanban + таблица сделок      | все (viewer — RO) |
| `/contacts`     | Контакты + карточка          | все (viewer — RO) |
| `/companies`    | Компании клиентов            | все (viewer — RO) |
| `/tasks`        | Задачи                       | все (viewer — RO) |
| `/calendar`     | Календарь задач              | все роли          |
| `/inbox`        | Омниканальные диалоги        | все (viewer — RO) |
| `/calls`        | Звонки + Voice AI            | все роли          |
| `/ai`           | AI-менеджеры                 | все (изменения — admin+) |
| `/reports`      | Отчёты                       | все роли          |
| `/team`         | Команда                      | admin, owner      |
| `/ceo`          | CEO Panel (все компании)     | только owner      |
| `/integrations` | Интеграции                   | admin, owner      |
| `/knowledge`    | База знаний                  | все роли          |
| `/settings`     | Настройки                    | все роли          |

Навигация фильтруется по роли в `lib/nav.ts`; серверные guard-функции дублируют проверку в API.

## 3. API

Все роуты: try/catch + `apiErrorResponse`; ошибки RBAC → 403, чужой тенант → 404.

| Роут | Методы | Описание |
| ---- | ------ | -------- |
| `/api/auth/login` | POST | Вход (email + DEMO_PASSWORD) |
| `/api/auth/logout` | POST | Выход |
| `/api/workspace` | GET | Все данные активной компании одним снапшотом (SWR-ключ) |
| `/api/company/switch` | POST | Смена активной компании (только owner) |
| `/api/deals` | GET, POST | Список/создание сделок |
| `/api/deals/[id]` | GET, PATCH, DELETE | Сделка: стадия, поля, удаление (admin+) |
| `/api/contacts` | GET, POST | Контакты |
| `/api/contacts/[id]` | GET, PATCH | Контакт |
| `/api/client-companies` | GET, POST | Компании клиентов |
| `/api/tasks` | GET, POST | Задачи |
| `/api/tasks/[id]` | PATCH, DELETE | Статус/правки задачи |
| `/api/conversations/[id]` | GET, PATCH | Диалог: сообщение, AI on/off, markRead |
| `/api/assistants/[id]` | PATCH | Настройки AI-менеджера (admin+) |
| `/api/users/[id]` | PATCH | Активация/роль пользователя (admin+) |

## 4. Роли

| Роль | Права |
| ---- | ----- |
| `owner` | Всё + CEO Panel + переключение компаний (cookie `aaa_company`) |
| `admin` | Полный доступ в своей компании: команда, интеграции, AI-настройки, удаление |
| `manager` | Создание/редактирование сделок, контактов, задач, ответы в inbox |
| `viewer` | Только чтение; любые записи через API → **403** |

Guards в `lib/server/auth.ts`: `assertCanWrite`, `assertAdmin`, `assertOwner`, `assertTenant`.

## 5. Multi-tenant модель

- Два тенанта в сиде: `t1` «Академия Успех», `t2` «СтройКомплект».
- **Каждая** сущность имеет `companyId`; все выборки в API фильтруются по `session.activeCompanyId`.
- `assertTenant` возвращает **404** (не 403) при обращении к чужой записи, чтобы не раскрывать её существование.
- Только owner может менять активную компанию; остальные жёстко привязаны к своей.
- Инварианты изоляции покрыты тестами (`tests/store-seed.test.ts`).

## 6. Хранение данных (важно)

- **PostgreSQL (Neon): используется**, когда задан `DATABASE_URL`. Все данные (тенанты, пользователи, сделки, диалоги, звонки, аудит) хранятся в БД и переживают рестарты и redeploy.
- **In-memory fallback:** без `DATABASE_URL` работает `MemoryRepository` (локальное демо без внешних сервисов) — данные живут до рестарта процесса.
- **localStorage: НЕ используется** (только httpOnly-cookie для сессии + читаемая CSRF-cookie).
- **Сессии:** серверные, в таблице `sessions`. Cookie `aaa_session` содержит только случайный токен (256 бит), не userId. HttpOnly, Secure (в production), SameSite=Lax. TTL 7 дней со sliding-продлением; logout удаляет запись в БД.
- **Пароли:** scrypt (N=16384, r=8, p=1, соль 16 байт, ключ 64 байта), формат `scrypt$N$r$p$salt$hash`. Тайминг-защита от перебора email (dummy verify).
- **Аудит:** таблица `audit_log` — все мутации (create/update/delete, вход/выход, вебхуки) с actor, entity, meta.

## 7. Что работает в demo / что является mock

**Реально работает (сквозная логика клиент → API → store):**
- Вход/выход, RBAC на сервере, tenant isolation
- CRUD сделок + drag-and-drop по стадиям kanban
- CRUD задач, отметка о выполнении, календарь
- Контакты и компании (создание, редактирование, карточка)
- Отправка сообщений в inbox, включение/выключение AI на диалоге
- Переключение компаний владельцем, CEO Panel
- Управление командой (роль/активность), настройки AI-менеджеров

**Mock (данные из сида, без реальных внешних вызовов):**
- Все «подключённые» интеграции (WhatsApp, Telegram, Instagram, Kaspi и т.д.) — статусы «Демо»/«Не подключено»
- Voice AI: звонки, транскрипты, AI-резюме — статические примеры
- AI-менеджеры: никаких реальных LLM-запросов; входящие сообщения клиентов не генерируются
- Статистика AI (конверсия, вклад в выручку) — из сида
- «Отправленные» сообщения никуда не доставляются — только пишутся в store

## 8. Известные ограничения

1. Rate limiting — in-memory (per-instance): при мультиинстансном деплое нужен Redis/Postgres-бекенд.
2. Сидовые пользователи входят по общему `DEMO_PASSWORD` — намеренно для демо; самозарегистрированные всегда со scrypt-хешем.
3. HMAC-секрет интеграционного API общий на инсталляцию (`INTEGRATION_WEBHOOK_SECRET`); per-tenant секреты — production follow-up.
4. Нет пагинации — все списки грузятся целиком (приемлемо для текущего объёма).
5. Нет E2E-тестов (проверки выполнялись вручную в браузере, см. VALIDATION_REPORT.md).
6. `/api/workspace` возвращает полный снапшот компании — при росте данных разбить на отдельные ресурсы.

## 9. Команды

```bash
pnpm install                # npm install тоже работает
node scripts/migrate.mjs    # применить миграции (нужен DATABASE_URL в env)
pnpm dev                    # дев-сервер http://localhost:3000
pnpm lint                   # ESLint (0 ошибок)
pnpm typecheck              # tsc --noEmit (0 ошибок)
pnpm test                   # vitest run — 29 тестов
pnpm build                  # next build — production-сборка
pnpm start                  # запуск production-сборки
```

## 10. Деплой

- Хостинг: Vercel + Neon PostgreSQL (интеграция v0, `DATABASE_URL` проставляется автоматически).
- Перед первым запуском на новой БД: `node scripts/migrate.mjs` (сид применится сам при первом обращении).
- Env-переменные: `DATABASE_URL` (Neon), опционально `NEXT_PUBLIC_DEMO_MODE=false`, `INTEGRATION_WEBHOOK_SECRET` для API v1, `DEMO_PASSWORD` (см. `.env.example`).

## 11. Осталось до полного production (некритично для пилота)

Выполнено с момента прошлой ревизии: PostgreSQL (Neon) + миграции, scrypt-пароли,
серверные сессии в БД, CSRF, rate limiting, audit log, zod-валидация, health-endpoint,
интеграционный API v1 (HMAC + idempotency).

Остаётся:
1. Реальные интеграции каналов (WhatsApp Business API и т.д.) и LLM-провайдер для AI-менеджеров.
2. Сброс пароля по email; верификация email при регистрации.
3. Per-tenant HMAC-секреты; распределённый rate limiting (Redis).
4. Пагинация и серверная фильтрация списков; разбиение `/api/workspace`.
5. Автоматическое резервное копирование настроено на стороне Neon (PITR) — проверить план.

## 12. Интеграционный API v1 (для внешних сервисов)

Аутентификация: заголовки `X-AAA-Company` (id тенанта), `X-AAA-Timestamp` (unix-секунды,
окно 5 минут), `X-AAA-Signature` (hex HMAC-SHA256 от `"{timestamp}.{rawBody}"` с секретом
`INTEGRATION_WEBHOOK_SECRET`). Идемпотентность — по `event_id` (повтор возвращает
исходный результат с флагом `idempotent_replay`).

| Роут | Назначение |
| ---- | ---------- |
| `POST /api/v1/leads` | Входящий лид (форма сайта, мессенджер-бот): создаёт контакт (dedupe по телефону) + сделку |
| `POST /api/v1/voice-events` | Событие Voice AI-телефонии: звонок с транскриптом/резюме, привязка к контакту |
| `GET /api/health` | Health/readiness: статус БД, режим хранилища |

## 13. Файлы для первоочередной проверки Codex

1. `lib/server/auth.ts` — сессии в БД, RBAC, CSRF, tenant isolation (ядро безопасности)
2. `lib/server/repository.ts`, `lib/server/pg-repo.ts`, `lib/server/store.ts` — модель хранения (PG + fallback)
3. `db/migrations/0001_init.sql`, `scripts/migrate.mjs` — схема и миграции
4. `lib/server/passwords.ts` — scrypt-хеширование
5. `lib/server/webhooks.ts`, `app/api/v1/*` — интеграционный API (HMAC, idempotency)
6. `app/api/deals/route.ts`, `app/api/deals/[id]/route.ts` — образец CRUD-паттерна с zod
7. `proxy.ts`, `app/(app)/layout.tsx` — двухуровневая защита страниц
8. `lib/types.ts` — модели данных
9. `tests/` — RBAC, изоляция, webhooks, scrypt (29 тестов)
10. `hooks/use-workspace.ts`, `lib/api.ts` — клиентский слой (SWR + CSRF)
