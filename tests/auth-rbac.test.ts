import { describe, it, expect, vi } from 'vitest'
import type { SessionUser } from '@/lib/types'
// vi.mock calls are hoisted above imports, so the static import below
// receives the mocked next/headers.
import {
  ApiError,
  assertCanWrite,
  assertAdmin,
  assertOwner,
  assertTenant,
  findUser,
} from '@/lib/server/auth'

// auth.ts imports next/headers (server-only); mock it for unit tests.
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => {},
    delete: () => {},
  }),
}))

function session(role: SessionUser['role'], activeCompanyId = 't1'): SessionUser {
  return {
    id: 'test',
    name: 'Test',
    email: 'test@test.kz',
    role,
    companyId: 't1',
    activeCompanyId,
    title: 'Test',
    avatarInitials: 'ТТ',
  }
}

describe('RBAC guards', () => {
  it('assertCanWrite allows owner, admin, manager', () => {
    expect(() => assertCanWrite(session('owner'))).not.toThrow()
    expect(() => assertCanWrite(session('admin'))).not.toThrow()
    expect(() => assertCanWrite(session('manager'))).not.toThrow()
  })

  it('assertCanWrite rejects viewer with 403', () => {
    try {
      assertCanWrite(session('viewer'))
      expect.unreachable('viewer must not pass assertCanWrite')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as InstanceType<typeof ApiError>).status).toBe(403)
    }
  })

  it('assertAdmin allows owner and admin, rejects manager and viewer', () => {
    expect(() => assertAdmin(session('owner'))).not.toThrow()
    expect(() => assertAdmin(session('admin'))).not.toThrow()
    expect(() => assertAdmin(session('manager'))).toThrow(ApiError)
    expect(() => assertAdmin(session('viewer'))).toThrow(ApiError)
  })

  it('assertOwner allows only owner', () => {
    expect(() => assertOwner(session('owner'))).not.toThrow()
    for (const role of ['admin', 'manager', 'viewer'] as const) {
      expect(() => assertOwner(session(role))).toThrow(ApiError)
    }
  })
})

describe('tenant isolation guard', () => {
  it('passes when entity belongs to the active company', () => {
    expect(() => assertTenant(session('manager', 't1'), 't1')).not.toThrow()
  })

  it('throws 404 (not 403) on cross-tenant access to avoid leaking existence', () => {
    try {
      assertTenant(session('manager', 't1'), 't2')
      expect.unreachable('cross-tenant access must throw')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as InstanceType<typeof ApiError>).status).toBe(404)
    }
  })
})

describe('findUser', () => {
  it('finds seed users case-insensitively with whitespace trimmed', () => {
    expect(findUser('owner@aaa.ai')?.role).toBe('owner')
    expect(findUser('  OWNER@AAA.AI  ')?.role).toBe('owner')
    expect(findUser('viewer@school.kz')?.role).toBe('viewer')
    expect(findUser('nobody@nowhere.kz')).toBeUndefined()
  })
})
