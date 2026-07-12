import { createSeed, DEMO_PASSWORD, type Database } from './seed'
import { hashPassword } from './passwords'
import type {
  AuditEntry,
  EntityStore,
  IntegrationEventRecord,
  Repository,
  SessionRecord,
  UserStore,
} from './repository'
import type { User } from '@/lib/types'

// In-memory repository for demo/dev when DATABASE_URL is absent.
// Never used in production (getRepo() throws instead).

function makeStore<T extends { id: string; companyId?: string }>(
  getArr: () => T[],
  setArr: (next: T[]) => void,
): EntityStore<T> {
  return {
    async byId(id) {
      return getArr().find((e) => e.id === id) ?? null
    },
    async listByCompany(companyId) {
      return getArr().filter((e) => e.companyId === companyId)
    },
    async listAll() {
      return getArr()
    },
    async insert(entity) {
      getArr().unshift(entity)
    },
    async update(entity) {
      setArr(getArr().map((e) => (e.id === entity.id ? entity : e)))
    },
    async remove(id) {
      setArr(getArr().filter((e) => e.id !== id))
    },
  }
}

export class MemoryRepository implements Repository {
  readonly kind = 'memory' as const
  private db: Database
  private sessionRows = new Map<string, SessionRecord>()
  private auditRows: (AuditEntry & { at: string })[] = []
  private intEvents = new Map<string, IntegrationEventRecord>()
  private outboxRows: { companyId: string; topic: string; payload: unknown }[] = []
  private seeded: Promise<void>

  tenants
  users: UserStore
  deals
  contacts
  clientCompanies
  tasks
  conversations
  calls
  knowledgeDocs
  integrations
  events
  assistants

  constructor() {
    this.db = createSeed()
    this.seeded = this.hashSeedPasswords()

    this.tenants = makeStore(
      () => this.db.tenants,
      (n) => (this.db.tenants = n),
    )
    const userStore = makeStore<User>(
      () => this.db.users,
      (n) => (this.db.users = n),
    )
    this.users = {
      ...userStore,
      findByEmail: async (email: string) => {
        await this.seeded
        const norm = email.trim().toLowerCase()
        return this.db.users.find((u) => u.email.toLowerCase() === norm) ?? null
      },
    }
    this.deals = makeStore(
      () => this.db.deals,
      (n) => (this.db.deals = n),
    )
    this.contacts = makeStore(
      () => this.db.contacts,
      (n) => (this.db.contacts = n),
    )
    this.clientCompanies = makeStore(
      () => this.db.clientCompanies,
      (n) => (this.db.clientCompanies = n),
    )
    this.tasks = makeStore(
      () => this.db.tasks,
      (n) => (this.db.tasks = n),
    )
    this.conversations = makeStore(
      () => this.db.conversations,
      (n) => (this.db.conversations = n),
    )
    this.calls = makeStore(
      () => this.db.calls,
      (n) => (this.db.calls = n),
    )
    this.knowledgeDocs = makeStore(
      () => this.db.knowledgeDocs,
      (n) => (this.db.knowledgeDocs = n),
    )
    this.integrations = makeStore(
      () => this.db.integrations,
      (n) => (this.db.integrations = n),
    )
    this.events = makeStore(
      () => this.db.events,
      (n) => (this.db.events = n),
    )
    this.assistants = makeStore(
      () => this.db.assistants,
      (n) => (this.db.assistants = n),
    )
  }

  private async hashSeedPasswords() {
    // Seed users share the demo password; hash once, reuse for all.
    const hash = await hashPassword(DEMO_PASSWORD)
    for (const u of this.db.users) {
      if (!u.passwordHash) u.passwordHash = hash
    }
  }

  sessions = {
    create: async (r: SessionRecord) => {
      this.sessionRows.set(r.tokenHash, r)
    },
    get: async (tokenHash: string) => this.sessionRows.get(tokenHash) ?? null,
    update: async (r: SessionRecord) => {
      this.sessionRows.set(r.tokenHash, r)
    },
    revoke: async (tokenHash: string) => {
      const r = this.sessionRows.get(tokenHash)
      if (r) r.revokedAt = new Date().toISOString()
    },
    revokeAllForUser: async (userId: string) => {
      for (const r of this.sessionRows.values()) {
        if (r.userId === userId) r.revokedAt = new Date().toISOString()
      }
    },
  }

  integrationEvents = {
    find: async (companyId: string, eventKey: string) =>
      this.intEvents.get(`${companyId}:${eventKey}`) ?? null,
    record: async (companyId: string, record: IntegrationEventRecord) => {
      this.intEvents.set(`${companyId}:${record.eventKey}`, record)
    },
  }

  outbox = {
    enqueue: async (companyId: string, topic: string, payload: unknown) => {
      this.outboxRows.push({ companyId, topic, payload })
    },
  }

  async audit(entry: AuditEntry) {
    this.auditRows.unshift({ ...entry, at: new Date().toISOString() })
  }

  async reset() {
    this.db = createSeed()
    this.sessionRows.clear()
    this.intEvents.clear()
    this.auditRows = []
    this.outboxRows = []
    this.seeded = this.hashSeedPasswords()
    await this.seeded
  }

  async ping() {
    // Always available.
  }

  /** Wait until seed passwords are hashed (used by login). */
  async ready() {
    await this.seeded
  }
}
