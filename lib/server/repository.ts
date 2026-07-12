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

// Async repository abstraction. Two implementations:
//  - MemoryRepository (demo/dev without DATABASE_URL)
//  - PgRepository (PostgreSQL; required in production)

export interface EntityStore<T extends { id: string }> {
  byId(id: string): Promise<T | null>
  listByCompany(companyId: string): Promise<T[]>
  listAll(): Promise<T[]>
  insert(entity: T): Promise<void>
  update(entity: T): Promise<void>
  remove(id: string): Promise<void>
}

export interface UserStore extends EntityStore<User> {
  findByEmail(email: string): Promise<User | null>
}

export interface SessionRecord {
  tokenHash: string
  userId: string
  activeCompanyId: string | null
  createdAt: string
  expiresAt: string
  revokedAt: string | null
}

export interface SessionStore {
  create(record: SessionRecord): Promise<void>
  get(tokenHash: string): Promise<SessionRecord | null>
  update(record: SessionRecord): Promise<void>
  revoke(tokenHash: string): Promise<void>
  revokeAllForUser(userId: string): Promise<void>
}

export interface AuditEntry {
  companyId: string
  actorId: string | null
  action: string
  entity: string
  entityId: string | null
  meta?: Record<string, unknown>
}

export interface IntegrationEventRecord {
  eventKey: string
  source: string
  payloadHash: string
  result: unknown
}

export interface IntegrationEventStore {
  find(companyId: string, eventKey: string): Promise<IntegrationEventRecord | null>
  record(companyId: string, record: IntegrationEventRecord): Promise<void>
}

export interface OutboxStore {
  enqueue(companyId: string, topic: string, payload: unknown): Promise<void>
}

export interface Repository {
  readonly kind: 'memory' | 'postgres'
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
  sessions: SessionStore
  integrationEvents: IntegrationEventStore
  outbox: OutboxStore
  audit(entry: AuditEntry): Promise<void>
  /** Re-seed demo data. Memory: always. Postgres: only when DEMO_MODE allows. */
  reset(): Promise<void>
  /** Health probe: throws when the backing store is unavailable. */
  ping(): Promise<void>
}
