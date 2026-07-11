# CODEX_HANDOFF — AAA CRM Premium

Технический паспорт проекта для проверки. Обновлён: 2026-07-11.

## 1. Архитектура

- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict).
- **UI:** Tailwind CSS v4 (токены в `app/globals.css`, `@theme inline`), shadcn/ui на Base UI (`components/ui/*`).
- **Клиентские данные:** SWR поверх `/api/*`; мутации — `fetch` + `mutate()`.
- **Серверные данные:** in-memory репозиторий (`lib/server/store.ts`), сид-данные (`lib/server/seed.ts`), доступ только через API-роуты.
- **Auth/RBAC:** cookie-сессия + guard-функции (`lib/server/auth.ts`). Никакой логики доступа на клиенте не достаточно самой по себе — каждый API-роут проверяет права на сервере.
- **Middleware:** отсутствует (не требуется — защита выполняется в layout `app/(app)/layout.tsx` через `getSessionUser()` + redirect, и в каждом API-роуте).

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

- **PostgreSQL: НЕ используется.**
- **localStorage: НЕ используется** (только httpOnly-cookie для сессии).
- **In-memory store: используется.** Singleton на `globalThis` (`lib/server/store.ts`), сид версионируется (`SEED_VERSION`).
- **Что сохраняется после перезагрузки страницы:** все демо-изменения (сделки, задачи, сообщения), пока жив процесс Node.js.
- **Что исчезнет после рестарта сервера:** все изменения; база пересоздаётся из сида. На Vercel serverless инстанс может быть переработан в любой момент — данные эфемерны by design.
- **Сессия** — httpOnly-cookie `aaa_session` с userId (НЕ подписана — демо-упрощение).

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

1. Данные эфемерны (см. раздел 6).
2. Пароль один на всех (`demo1234`), сравнение в открытом виде — только для демо.
3. Cookie сессии не подписана и не шифруется.
4. Нет rate limiting, CSRF-токенов, audit log.
5. Нет пагинации — все списки грузятся целиком (приемлемо для объёма сида).
6. Нет E2E-тестов (проверки выполнялись вручную в браузере, см. VALIDATION_REPORT.md).

## 9. Команды

```bash
pnpm install     # npm install тоже работает
pnpm dev         # дев-сервер http://localhost:3000
pnpm lint        # ESLint (0 ошибок)
pnpm typecheck   # tsc --noEmit (0 ошибок)
pnpm test        # vitest run — 16 тестов
pnpm build       # next build — production-сборка
pnpm start       # запуск production-сборки
```

## 10. Деплой

- Хостинг: Vercel. Публикация — кнопкой Publish в v0 либо `vercel deploy` из корня.
- Env-переменные: обязательных нет; опционально `NEXT_PUBLIC_DEMO_MODE=false` скрывает демо-подсказки (см. `.env.example`).

## 11. Production-блокеры (обязательно перед реальным запуском)

1. **PostgreSQL** (Neon/Supabase): реализовать `PostgresRepository` вместо `DemoRepository` — интерфейс `Repository` в `lib/server/store.ts` создан именно для этого. Добавить миграции (Drizzle).
2. **Настоящая аутентификация**: хеширование паролей, подписанные сессии (Better Auth / Auth.js), сброс пароля.
3. Реальные интеграции каналов (WhatsApp Business API и т.д.) и LLM-провайдер для AI-менеджеров.
4. Rate limiting, CSRF, audit log, резервное копирование БД.
5. Пагинация и серверная фильтрация списков.

## 12. Файлы для первоочередной проверки Codex

1. `lib/server/auth.ts` — RBAC + tenant isolation (ядро безопасности)
2. `lib/server/store.ts`, `lib/server/seed.ts` — модель хранения
3. `app/api/deals/route.ts`, `app/api/deals/[id]/route.ts` — образец CRUD-паттерна
4. `app/api/workspace/route.ts` — фильтрация снапшота по тенанту
5. `app/(app)/layout.tsx` — guard авторизованной зоны
6. `lib/types.ts` — модели данных
7. `components/pipeline/pipeline-view.tsx` — kanban + DnD
8. `components/inbox/inbox-view.tsx` — чат + мобильный master-detail
9. `tests/` — тестовое покрытие инвариантов
10. `hooks/use-workspace.ts`, `lib/api.ts` — клиентский слой данных
