# AAA CRM Premium

Многопользовательская multi-tenant CRM с AI-менеджерами, омниканальным инбоксом,
Voice AI-журналом звонков и панелью владельца платформы (CEO Panel).
Демо-версия работает полностью на in-memory-хранилище и не требует внешних сервисов.

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
- Tailwind CSS v4 + shadcn/ui (Base UI)
- SWR (данные на клиенте), @dnd-kit (kanban drag-and-drop), Recharts (графики)
- Vitest (юнит-тесты), ESLint 9 + eslint-config-next

## Быстрый старт

```bash
pnpm install        # или npm install
pnpm dev            # http://localhost:3000
```

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
пространство, а пароль будет захеширован (SHA-256) и действует только для неё.

| Email               | Роль     | Область                             |
| ------------------- | -------- | ----------------------------------- |
| `owner@aaa.ai`      | owner    | Все компании + CEO Panel            |
| `admin@school.kz`   | admin    | «Академия Успех» (полный доступ)    |
| `manager@school.kz` | manager  | «Академия Успех» (продажи)          |
| `viewer@school.kz`  | viewer   | «Академия Успех» (только чтение)    |
| `manager@stroy.kz`  | manager  | «СтройКомплект»                     |

## Важно: хранение данных

Это демо. Все данные живут в **in-memory store** внутри процесса Node.js
(`lib/server/store.ts` + сид `lib/server/seed.ts`). Изменения переживают
обновление страницы, но **исчезают при перезапуске сервера** (и на serverless-
инстансах Vercel могут сбрасываться между вызовами). PostgreSQL и localStorage
**не используются**. Подробности и план перехода на продакшен —
в [CODEX_HANDOFF.md](./CODEX_HANDOFF.md).

## Документация

- [CODEX_HANDOFF.md](./CODEX_HANDOFF.md) — архитектура, API, роли, ограничения
- [VALIDATION_REPORT.md](./VALIDATION_REPORT.md) — результаты проверок
