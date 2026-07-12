-- AAA CRM: initial production schema.
-- Hybrid model: hot/relational fields are real columns (FK, indexes, constraints),
-- the full entity document lives in "data" jsonb kept in sync by the repository.

CREATE TABLE IF NOT EXISTS tenants (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  data        jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id            text PRIMARY KEY,
  tenant_id     text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email         text NOT NULL,
  role          text NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'viewer')),
  active        boolean NOT NULL DEFAULT true,
  password_hash text,
  data          jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users (lower(email));
CREATE INDEX IF NOT EXISTS users_tenant_idx ON users (tenant_id);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash        text PRIMARY KEY,
  user_id           text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active_company_id text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz NOT NULL,
  revoked_at        timestamptz
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS deals (
  id          text PRIMARY KEY,
  tenant_id   text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stage       text NOT NULL CHECK (stage IN ('new','qualification','proposal','negotiation','approval','won','lost')),
  owner_id    text,
  amount_kzt  numeric NOT NULL DEFAULT 0 CHECK (amount_kzt >= 0),
  data        jsonb NOT NULL,
  sort_at     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS deals_tenant_sort_idx ON deals (tenant_id, sort_at DESC);
CREATE INDEX IF NOT EXISTS deals_tenant_stage_idx ON deals (tenant_id, stage);
CREATE INDEX IF NOT EXISTS deals_owner_idx ON deals (owner_id);

CREATE TABLE IF NOT EXISTS contacts (
  id          text PRIMARY KEY,
  tenant_id   text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone       text,
  data        jsonb NOT NULL,
  sort_at     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contacts_tenant_sort_idx ON contacts (tenant_id, sort_at DESC);
CREATE INDEX IF NOT EXISTS contacts_tenant_phone_idx ON contacts (tenant_id, phone);

CREATE TABLE IF NOT EXISTS client_companies (
  id          text PRIMARY KEY,
  tenant_id   text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data        jsonb NOT NULL,
  sort_at     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS client_companies_tenant_idx ON client_companies (tenant_id, sort_at DESC);

CREATE TABLE IF NOT EXISTS tasks (
  id          text PRIMARY KEY,
  tenant_id   text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  done        boolean NOT NULL DEFAULT false,
  assignee_id text,
  deal_id     text,
  data        jsonb NOT NULL,
  sort_at     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tasks_tenant_idx ON tasks (tenant_id, sort_at DESC);
CREATE INDEX IF NOT EXISTS tasks_tenant_done_idx ON tasks (tenant_id, done);

CREATE TABLE IF NOT EXISTS conversations (
  id          text PRIMARY KEY,
  tenant_id   text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data        jsonb NOT NULL,
  sort_at     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS conversations_tenant_idx ON conversations (tenant_id, sort_at DESC);

CREATE TABLE IF NOT EXISTS calls (
  id          text PRIMARY KEY,
  tenant_id   text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data        jsonb NOT NULL,
  sort_at     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS calls_tenant_idx ON calls (tenant_id, sort_at DESC);

CREATE TABLE IF NOT EXISTS knowledge_docs (
  id          text PRIMARY KEY,
  tenant_id   text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data        jsonb NOT NULL,
  sort_at     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS knowledge_docs_tenant_idx ON knowledge_docs (tenant_id, sort_at DESC);

CREATE TABLE IF NOT EXISTS integrations (
  id          text PRIMARY KEY,
  tenant_id   text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data        jsonb NOT NULL,
  sort_at     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS integrations_tenant_idx ON integrations (tenant_id);

CREATE TABLE IF NOT EXISTS activity_events (
  id          text PRIMARY KEY,
  tenant_id   text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data        jsonb NOT NULL,
  sort_at     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_events_tenant_idx ON activity_events (tenant_id, sort_at DESC);

CREATE TABLE IF NOT EXISTS ai_assistants (
  id          text PRIMARY KEY,
  tenant_id   text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data        jsonb NOT NULL,
  sort_at     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_assistants_tenant_idx ON ai_assistants (tenant_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id          bigserial PRIMARY KEY,
  tenant_id   text NOT NULL,
  actor_id    text,
  action      text NOT NULL,
  entity      text NOT NULL,
  entity_id   text,
  meta        jsonb NOT NULL DEFAULT '{}'::jsonb,
  at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_tenant_at_idx ON audit_log (tenant_id, at DESC);

-- Idempotency for imports and integration events.
CREATE TABLE IF NOT EXISTS integration_events (
  id           bigserial PRIMARY KEY,
  tenant_id    text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_key    text NOT NULL,
  source       text NOT NULL,
  payload_hash text NOT NULL,
  result       jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, event_key)
);

-- Outbox for reliable event delivery to AAA AI Control Center.
CREATE TABLE IF NOT EXISTS outbox_events (
  id            bigserial PRIMARY KEY,
  tenant_id     text NOT NULL,
  topic         text NOT NULL,
  payload       jsonb NOT NULL,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivered','failed')),
  attempts      int NOT NULL DEFAULT 0,
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outbox_pending_idx ON outbox_events (status, next_retry_at);
