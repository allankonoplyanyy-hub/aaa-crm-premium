import type { Pool } from 'pg'
import { getPool } from './db'
import { createSeed, DEMO_PASSWORD } from './seed'
import { hashPassword } from './passwords'
import type {
  AuditEntry,
  EntityStore,
  IntegrationEventRecord,
  Repository,
  SessionRecord,
  UserStore,
} from './repository'
import type {
  ActivityEvent,
  AiAssistant,
  Call,
  ClientCompany,
  Contact,
  Conversation,
  Deal,
  Integration,
  KnowledgeDoc,
  Task,
  Tenant,
  User,
} from '@/lib/types'

// PostgreSQL repository. Hot fields are real columns (see db/migrations),
// the full entity document is stored in "data" jsonb and is the source of truth
// for reads. Writes keep columns and jsonb in sync inside one statement.

interface TableCfg<T> {
  table: string
  /** ISO-string field used for DESC ordering (mirrors in-memory unshift order). */
  orderField: string
  /** Extra columns kept in sync with data jsonb: name → value extractor. */
  columns?: Record<string, (e: T) => unknown>
}

class PgStore<T extends { id: string; companyId?: string }> implements EntityStore<T> {
  constructor(
    private pool: Pool,
    private cfg: TableCfg<T>,
  ) {}

  private sortValue(e: T): string {
    const v = (e as Record<string, unknown>)[this.cfg.orderField]
    return typeof v === 'string' ? v : new Date().toISOString()
  }

  async byId(id: string): Promise<T | null> {
    const { rows } = await this.pool.query(
      `SELECT data FROM ${this.cfg.table} WHERE id = $1`,
      [id],
    )
    return rows[0] ? (rows[0].data as T) : null
  }

  async listByCompany(companyId: string): Promise<T[]> {
    const { rows } = await this.pool.query(
      `SELECT data FROM ${this.cfg.table} WHERE tenant_id = $1 ORDER BY sort_at DESC`,
      [companyId],
    )
    return rows.map((r) => r.data as T)
  }

  async listAll(): Promise<T[]> {
    const { rows } = await this.pool.query(
      `SELECT data FROM ${this.cfg.table} ORDER BY sort_at DESC`,
    )
    return rows.map((r) => r.data as T)
  }

  async insert(entity: T): Promise<void> {
    const extra = this.cfg.columns ?? {}
    const extraNames = Object.keys(extra)
    const cols = ['id', 'tenant_id', 'data', 'sort_at', ...extraNames]
    const vals = [
      entity.id,
      entity.companyId,
      JSON.stringify(entity),
      this.sortValue(entity),
      ...extraNames.map((n) => extra[n](entity)),
    ]
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
    await this.pool.query(
      `INSERT INTO ${this.cfg.table} (${cols.join(', ')}) VALUES (${placeholders})`,
      vals,
    )
  }

  async update(entity: T): Promise<void> {
    const extra = this.cfg.columns ?? {}
    const extraNames = Object.keys(extra)
    const sets = ['data = $2', 'sort_at = $3', ...extraNames.map((n, i) => `${n} = $${i + 4}`)]
    await this.pool.query(
      `UPDATE ${this.cfg.table} SET ${sets.join(', ')} WHERE id = $1`,
      [
        entity.id,
        JSON.stringify(entity),
        this.sortValue(entity),
        ...extraNames.map((n) => extra[n](entity)),
      ],
    )
  }

  async remove(id: string): Promise<void> {
    await this.pool.query(`DELETE FROM ${this.cfg.table} WHERE id = $1`, [id])
  }
}

// tenants has no tenant_id column; give it a dedicated store.
class PgTenantStore implements EntityStore<Tenant> {
  constructor(private pool: Pool) {}

  async byId(id: string): Promise<Tenant | null> {
    const { rows } = await this.pool.query('SELECT data FROM tenants WHERE id = $1', [id])
    return rows[0] ? (rows[0].data as Tenant) : null
  }
  async listByCompany(companyId: string): Promise<Tenant[]> {
    const t = await this.byId(companyId)
    return t ? [t] : []
  }
  async listAll(): Promise<Tenant[]> {
    const { rows } = await this.pool.query('SELECT data FROM tenants ORDER BY created_at ASC')
    return rows.map((r) => r.data as Tenant)
  }
  async insert(t: Tenant): Promise<void> {
    await this.pool.query(
      'INSERT INTO tenants (id, name, status, data) VALUES ($1, $2, $3, $4)',
      [t.id, t.name, t.status, JSON.stringify(t)],
    )
  }
  async update(t: Tenant): Promise<void> {
    await this.pool.query('UPDATE tenants SET name = $2, status = $3, data = $4 WHERE id = $1', [
      t.id,
      t.name,
      t.status,
      JSON.stringify(t),
    ])
  }
  async remove(id: string): Promise<void> {
    await this.pool.query('DELETE FROM tenants WHERE id = $1', [id])
  }
}

class PgUserStore implements UserStore {
  constructor(private pool: Pool) {}

  private fromRow(row: { data: User; password_hash: string | null }): User {
    const user = row.data
    user.passwordHash = row.password_hash ?? undefined
    return user
  }

  private dataJson(u: User): string {
    // Never store the hash inside the jsonb document (column only).
    const { passwordHash: _ph, ...rest } = u
    return JSON.stringify(rest)
  }

  async byId(id: string): Promise<User | null> {
    const { rows } = await this.pool.query(
      'SELECT data, password_hash FROM users WHERE id = $1',
      [id],
    )
    return rows[0] ? this.fromRow(rows[0]) : null
  }
  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.pool.query(
      'SELECT data, password_hash FROM users WHERE lower(email) = lower($1)',
      [email.trim()],
    )
    return rows[0] ? this.fromRow(rows[0]) : null
  }
  async listByCompany(companyId: string): Promise<User[]> {
    const { rows } = await this.pool.query(
      'SELECT data, password_hash FROM users WHERE tenant_id = $1 ORDER BY created_at ASC',
      [companyId],
    )
    return rows.map((r) => this.fromRow(r))
  }
  async listAll(): Promise<User[]> {
    const { rows } = await this.pool.query(
      'SELECT data, password_hash FROM users ORDER BY created_at ASC',
    )
    return rows.map((r) => this.fromRow(r))
  }
  async insert(u: User): Promise<void> {
    await this.pool.query(
      'INSERT INTO users (id, tenant_id, email, role, active, password_hash, data) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [u.id, u.companyId, u.email, u.role, u.active, u.passwordHash ?? null, this.dataJson(u)],
    )
  }
  async update(u: User): Promise<void> {
    await this.pool.query(
      'UPDATE users SET email = $2, role = $3, active = $4, password_hash = $5, data = $6 WHERE id = $1',
      [u.id, u.email, u.role, u.active, u.passwordHash ?? null, this.dataJson(u)],
    )
  }
  async remove(id: string): Promise<void> {
    await this.pool.query('DELETE FROM users WHERE id = $1', [id])
  }
}

export class PgRepository implements Repository {
  readonly kind = 'postgres' as const
  private pool: Pool

  tenants: EntityStore<Tenant>
  users: UserStore
  deals: EntityStore<Deal>
  contacts: EntityStore<Contact>
  clientCompanies: EntityStore<ClientCompany>
  tasks: EntityStore<Task>
  conversations: EntityStore<Conversation>
  calls: EntityStore<Call>
  knowledgeDocs: EntityStore<KnowledgeDoc>
  integrations: EntityStore<Integration>
  events: EntityStore<ActivityEvent>
  assistants: EntityStore<AiAssistant>

  constructor(pool?: Pool) {
    this.pool = pool ?? getPool()
    this.tenants = new PgTenantStore(this.pool)
    this.users = new PgUserStore(this.pool)
    this.deals = new PgStore<Deal>(this.pool, {
      table: 'deals',
      orderField: 'createdAt',
      columns: {
        stage: (d) => d.stage,
        owner_id: (d) => d.ownerId,
        amount_kzt: (d) => d.amountKzt,
      },
    })
    this.contacts = new PgStore<Contact>(this.pool, {
      table: 'contacts',
      orderField: 'createdAt',
      columns: { phone: (c) => c.phone || null },
    })
    this.clientCompanies = new PgStore<ClientCompany>(this.pool, {
      table: 'client_companies',
      orderField: 'createdAt',
    })
    this.tasks = new PgStore<Task>(this.pool, {
      table: 'tasks',
      orderField: 'createdAt',
      columns: {
        done: (t) => t.done,
        assignee_id: (t) => t.assigneeId,
        deal_id: (t) => t.dealId,
      },
    })
    this.conversations = new PgStore<Conversation>(this.pool, {
      table: 'conversations',
      orderField: 'updatedAt',
    })
    this.calls = new PgStore<Call>(this.pool, { table: 'calls', orderField: 'at' })
    this.knowledgeDocs = new PgStore<KnowledgeDoc>(this.pool, {
      table: 'knowledge_docs',
      orderField: 'updatedAt',
    })
    this.integrations = new PgStore<Integration>(this.pool, {
      table: 'integrations',
      orderField: 'name',
    })
    this.events = new PgStore<ActivityEvent>(this.pool, {
      table: 'activity_events',
      orderField: 'at',
    })
    this.assistants = new PgStore<AiAssistant>(this.pool, {
      table: 'ai_assistants',
      orderField: 'name',
    })
  }

  sessions = {
    create: async (r: SessionRecord) => {
      await this.pool.query(
        'INSERT INTO sessions (token_hash, user_id, active_company_id, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)',
        [r.tokenHash, r.userId, r.activeCompanyId, r.createdAt, r.expiresAt],
      )
    },
    get: async (tokenHash: string): Promise<SessionRecord | null> => {
      const { rows } = await this.pool.query(
        'SELECT token_hash, user_id, active_company_id, created_at, expires_at, revoked_at FROM sessions WHERE token_hash = $1',
        [tokenHash],
      )
      const r = rows[0]
      if (!r) return null
      return {
        tokenHash: r.token_hash,
        userId: r.user_id,
        activeCompanyId: r.active_company_id,
        createdAt: new Date(r.created_at).toISOString(),
        expiresAt: new Date(r.expires_at).toISOString(),
        revokedAt: r.revoked_at ? new Date(r.revoked_at).toISOString() : null,
      }
    },
    update: async (r: SessionRecord) => {
      await this.pool.query(
        'UPDATE sessions SET active_company_id = $2, expires_at = $3, revoked_at = $4 WHERE token_hash = $1',
        [r.tokenHash, r.activeCompanyId, r.expiresAt, r.revokedAt],
      )
    },
    revoke: async (tokenHash: string) => {
      await this.pool.query('UPDATE sessions SET revoked_at = now() WHERE token_hash = $1', [
        tokenHash,
      ])
    },
    revokeAllForUser: async (userId: string) => {
      await this.pool.query(
        'UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
        [userId],
      )
    },
  }

  integrationEvents = {
    find: async (companyId: string, eventKey: string): Promise<IntegrationEventRecord | null> => {
      const { rows } = await this.pool.query(
        'SELECT event_key, source, payload_hash, result FROM integration_events WHERE tenant_id = $1 AND event_key = $2',
        [companyId, eventKey],
      )
      const r = rows[0]
      if (!r) return null
      return { eventKey: r.event_key, source: r.source, payloadHash: r.payload_hash, result: r.result }
    },
    record: async (companyId: string, record: IntegrationEventRecord) => {
      await this.pool.query(
        'INSERT INTO integration_events (tenant_id, event_key, source, payload_hash, result) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (tenant_id, event_key) DO NOTHING',
        [companyId, record.eventKey, record.source, record.payloadHash, JSON.stringify(record.result)],
      )
    },
  }

  outbox = {
    enqueue: async (companyId: string, topic: string, payload: unknown) => {
      await this.pool.query(
        'INSERT INTO outbox_events (tenant_id, topic, payload) VALUES ($1, $2, $3)',
        [companyId, topic, JSON.stringify(payload)],
      )
    },
  }

  async audit(entry: AuditEntry) {
    await this.pool.query(
      'INSERT INTO audit_log (tenant_id, actor_id, action, entity, entity_id, meta) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        entry.companyId,
        entry.actorId,
        entry.action,
        entry.entity,
        entry.entityId,
        JSON.stringify(entry.meta ?? {}),
      ],
    )
  }

  async ping() {
    await this.pool.query('SELECT 1')
  }

  /** Seed demo data once when the database is empty (DEMO_MODE only). */
  async seedIfEmpty(): Promise<void> {
    const { rows } = await this.pool.query('SELECT count(*)::int AS n FROM tenants')
    if (rows[0].n > 0) return
    await this.seedDemoData()
  }

  private async seedDemoData(): Promise<void> {
    const db = createSeed()
    const demoHash = await hashPassword(DEMO_PASSWORD)
    for (const u of db.users) {
      if (!u.passwordHash) u.passwordHash = demoHash
    }
    for (const t of db.tenants) await this.tenants.insert(t)
    for (const u of db.users) await this.users.insert(u)
    for (const c of db.clientCompanies) await this.clientCompanies.insert(c)
    for (const c of db.contacts) await this.contacts.insert(c)
    for (const d of db.deals) await this.deals.insert(d)
    for (const t of db.tasks) await this.tasks.insert(t)
    for (const c of db.conversations) await this.conversations.insert(c)
    for (const c of db.calls) await this.calls.insert(c)
    for (const k of db.knowledgeDocs) await this.knowledgeDocs.insert(k)
    for (const i of db.integrations) await this.integrations.insert(i)
    for (const e of db.events) await this.events.insert(e)
    for (const a of db.assistants) await this.assistants.insert(a)
  }

  /** Demo reset: wipe all data and re-seed. Blocked when DEMO_MODE=false. */
  async reset() {
    if (process.env.DEMO_MODE === 'false') {
      throw new Error('reset() is disabled outside demo mode')
    }
    await this.pool.query(
      'TRUNCATE tenants, users, sessions, deals, contacts, client_companies, tasks, conversations, calls, knowledge_docs, integrations, activity_events, ai_assistants, audit_log, integration_events, outbox_events CASCADE',
    )
    await this.seedDemoData()
  }
}
