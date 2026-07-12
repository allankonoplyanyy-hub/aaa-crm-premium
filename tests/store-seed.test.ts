import { describe, it, expect } from 'vitest'
import { createSeed, DEMO_PASSWORD, SEED_VERSION } from '@/lib/server/seed'
import { uid } from '@/lib/server/store'
import { MemoryRepository } from '@/lib/server/memory-repo'

describe('memory repository', () => {
  it('lists entities scoped by company', async () => {
    const repo = new MemoryRepository()
    const t1Deals = await repo.deals.listByCompany('t1')
    const t2Deals = await repo.deals.listByCompany('t2')
    expect(t1Deals.length).toBeGreaterThan(0)
    expect(t2Deals.length).toBeGreaterThan(0)
    expect(t1Deals.every((d) => d.companyId === 't1')).toBe(true)
    expect(t2Deals.every((d) => d.companyId === 't2')).toBe(true)
  })

  it('insert/update/remove roundtrip', async () => {
    const repo = new MemoryRepository()
    const base = (await repo.deals.listByCompany('t1'))[0]
    const copy = { ...base, id: 'test_deal', title: 'Тест' }
    await repo.deals.insert(copy)
    expect((await repo.deals.byId('test_deal'))?.title).toBe('Тест')
    copy.title = 'Тест 2'
    await repo.deals.update(copy)
    expect((await repo.deals.byId('test_deal'))?.title).toBe('Тест 2')
    await repo.deals.remove('test_deal')
    expect(await repo.deals.byId('test_deal')).toBeNull()
  })

  it('reset() reseeds demo data', async () => {
    const repo = new MemoryRepository()
    const before = (await repo.deals.listAll()).length
    const base = (await repo.deals.listAll())[0]
    await repo.deals.insert({ ...base, id: 'test_deal' })
    expect((await repo.deals.listAll()).length).toBe(before + 1)
    await repo.reset()
    expect((await repo.deals.listAll()).length).toBe(before)
    expect(await repo.deals.byId('test_deal')).toBeNull()
  })

  it('sessions: create/get/revoke lifecycle', async () => {
    const repo = new MemoryRepository()
    const record = {
      tokenHash: 'hash1',
      userId: 'u1',
      activeCompanyId: null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      revokedAt: null,
    }
    await repo.sessions.create(record)
    expect((await repo.sessions.get('hash1'))?.userId).toBe('u1')
    await repo.sessions.revoke('hash1')
    expect((await repo.sessions.get('hash1'))?.revokedAt).not.toBeNull()
  })

  it('integration events: idempotency store', async () => {
    const repo = new MemoryRepository()
    expect(await repo.integrationEvents.find('t1', 'lead:e1')).toBeNull()
    await repo.integrationEvents.record('t1', {
      eventKey: 'lead:e1',
      source: 'Сайт',
      payloadHash: 'abc',
      result: { ok: true },
    })
    expect((await repo.integrationEvents.find('t1', 'lead:e1'))?.payloadHash).toBe('abc')
    // Isolation: another tenant does not see the event.
    expect(await repo.integrationEvents.find('t2', 'lead:e1')).toBeNull()
  })

  it('uid generates unique prefixed ids', () => {
    const ids = new Set(Array.from({ length: 200 }, () => uid('x')))
    expect(ids.size).toBe(200)
    for (const id of ids) expect(id.startsWith('x_')).toBe(true)
  })

  it('exports demo password and seed version', () => {
    expect(DEMO_PASSWORD.length).toBeGreaterThan(0)
    expect(SEED_VERSION).toBeGreaterThan(0)
  })
})

describe('seed data integrity (tenant isolation invariants)', () => {
  const db = createSeed()
  const tenantIds = new Set(db.tenants.map((t) => t.id))

  it('has two tenants and all demo roles', () => {
    expect(db.tenants.length).toBe(2)
    const roles = db.users.map((u) => u.role)
    expect(roles).toContain('owner')
    expect(roles).toContain('admin')
    expect(roles).toContain('manager')
    expect(roles).toContain('viewer')
  })

  it('every entity belongs to a known tenant', () => {
    const collections = [
      db.users, db.deals, db.contacts, db.clientCompanies, db.tasks,
      db.conversations, db.calls, db.knowledgeDocs, db.integrations,
      db.events, db.assistants,
    ]
    for (const collection of collections) {
      for (const entity of collection) {
        expect(tenantIds.has((entity as { companyId: string }).companyId)).toBe(true)
      }
    }
  })

  it('deals never reference contacts from another tenant', () => {
    const contactTenant = new Map(db.contacts.map((c) => [c.id, c.companyId]))
    for (const deal of db.deals) {
      if (deal.contactId) {
        expect(contactTenant.get(deal.contactId)).toBe(deal.companyId)
      }
    }
  })

  it('deals never reference owners from another tenant (except platform owner)', () => {
    const userById = new Map(db.users.map((u) => [u.id, u]))
    for (const deal of db.deals) {
      const owner = userById.get(deal.ownerId)
      expect(owner).toBeDefined()
      if (owner && owner.role !== 'owner') {
        expect(owner.companyId).toBe(deal.companyId)
      }
    }
  })

  it('both tenants have deals and contacts', () => {
    for (const t of ['t1', 't2']) {
      expect(db.deals.some((d) => d.companyId === t)).toBe(true)
      expect(db.contacts.some((c) => c.companyId === t)).toBe(true)
    }
  })
})
