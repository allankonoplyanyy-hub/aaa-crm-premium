# AAA CRM Premium

Многопользовательская multi-tenant CRM с AI-менеджерами, омниканальным инбоксом,
Voice AI-журналом звонков и панелью владельца платформы (CEO Panel).
Данные хранятся в **PostgreSQL (Neon)**; без `DATABASE_URL` приложение
автоматически работает на in-memory-хранилище (локальное демо без сервисов).

Продакшен-деплой: https://aaa-crm-premium.vercel.app/

## Структура сайта

| Маршрут       | Что это                                                        |
| ------------- | -------------------------------------------------------------- |
| `/`           | Публичный продающий лендинг (hero, возможности, тарифы, FAQ)   |
| `/login`      | Вход (двухколоночный премиум-экран, показ/скрытие пароля)      |
| `/register`   | Регистрация новой компании (создаёт изолированный tenant)      |
| `/dashboard`  | CRM: обзор (KPI, воронка, графики) — требует входа             |
| `/pipeline`…  | Остальные разделы CRM — все защищены middleware-редиректом     |

Все страницы CRM защищены: неавторизованный запрос редиректится на
`/login?next=<путь>` через `proxy.ts` (Next.js middleware).

## Стек

- Next.js 16 (App Router) + React 19 + TypeScript
- PostgreSQL (Neon) + `pg`; SQL-миграции в `db/migrations/`
- Tailwind CSS v4 + shadcn/ui (Base UI)
- SWR (данные на клиенте), @dnd-kit (kanban drag-and-drop), Recharts (графики)
- zod (валидация API), scrypt (пароли), Vitest (тесты), ESLint 9

## Быстрый старт

```bash
pnpm install                # или npm install
node scripts/migrate.mjs    # применить миграции (нужен DATABASE_URL)
pnpm dev                    # http://localhost:3000
```

Без `DATABASE_URL` шаг миграций не нужен — включится in-memory-режим.

## Команды

| Команда          | Действие                                  |
| ---------------- | ----------------------------------------- |
| `pnpm dev`       | Дев-сервер                                |
| `pnpm build`     | Production-сборка                         |
| `pnpm start`     | Запуск production-сборки                  |
| `pnpm lint`      | ESLint                                    |
| `pnpm typecheck` | TypeScript `tsc --noEmit`                 |
| `pnpm test`      | Vitest (RBAC, tenant isolation, seed)     |

(Аналогично работают `npm run <script>`.)

## Демо-доступы

Пароль для всех сидовых аккаунтов: `demo1234`. Также можно зарегистрировать
собственную компанию на `/register` — она получит пустое изолированное
пространство, а пароль будет захеширован (scrypt) и действует только для неё.

| Email               | Роль     | Область                             |
| ------------------- | -------- | ----------------------------------- |
| `owner@aaa.ai`      | owner    | Все компании + CEO Panel            |
| `admin@school.kz`   | admin    | «Академия Успех» (полный доступ)    |
| `manager@school.kz` | manager  | «Академия Успех» (продажи)          |
| `viewer@school.kz`  | viewer   | «Академия Успех» (только чтение)    |
| `manager@stroy.kz`  | manager  | «СтройКомплект»                     |

## Хранение данных и безопасность

- **PostgreSQL (Neon)** — основное хранилище: все сущности с `company_id`,
  индексами и внешними ключами (`db/migrations/0001_init.sql`).
- **Сессии** — серверные, в таблице `sessions` (случайный токен, HttpOnly cookie,
  TTL 7 дней). **Пароли** — scrypt. **CSRF** — double-submit cookie.
- **Rate limiting** на вход/регистрацию, **audit log** всех мутаций,
  zod-валидация всех API-запросов, health-endpoint `/api/health`.
- Интеграционный API v1 (`/api/v1/leads`, `/api/v1/voice-events`) —
  HMAC-подпись + идемпотентность по `event_id`.

Подробности — в [CODEX_HANDOFF.md](./CODEX_HANDOFF.md).

## Документация

- [CODEX_HANDOFF.md](./CODEX_HANDOFF.md) — архитектура, API, роли, ограничения
- [VALIDATION_REPORT.md](./VALIDATION_REPORT.md) — результаты проверок
- [docs/BACKUP_RESTORE.md](./docs/BACKUP_RESTORE.md) — резервное копирование и восстановление (Neon PITR, pg_dump)
