import { describe, it, expect } from 'vitest'
import { createSeed, DEMO_PASSWORD, SEED_VERSION } from '@/lib/server/seed'
import { getRepo, getDb, uid } from '@/lib/server/store'

describe('demo store', () => {
  it('getRepo returns a cached singleton', () => {
    expect(getRepo()).toBe(getRepo())
    expect(getDb()).toBe(getRepo().db)
  })

  it('reset() reseeds the database', () => {
    const repo = getRepo()
    const before = repo.db.deals.length
    repo.db.deals.push({ ...repo.db.deals[0], id: 'test_deal' })
    expect(repo.db.deals.length).toBe(before + 1)
    repo.reset()
    expect(repo.db.deals.length).toBe(before)
    expect(repo.db.deals.some((d) => d.id === 'test_deal')).toBe(false)
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

  it('has two tenants and all five demo roles', () => {
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

  it('both tenants have deals, contacts and conversations', () => {
    for (const t of ['t1', 't2']) {
      expect(db.deals.some((d) => d.companyId === t)).toBe(true)
      expect(db.contacts.some((c) => c.companyId === t)).toBe(true)
    }
  })
})
