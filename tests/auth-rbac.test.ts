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
} from '@/lib/server/auth'
import { hashPassword, verifyPassword } from '@/lib/server/passwords'

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

describe('password hashing (scrypt)', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(hash.startsWith('scrypt$')).toBe(true)
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true)
  })

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('password-one')
    expect(await verifyPassword('password-two', hash)).toBe(false)
  })

  it('produces unique salts per hash', async () => {
    const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')])
    expect(a).not.toBe(b)
  })

  it('rejects malformed or missing stored hashes', async () => {
    expect(await verifyPassword('x', null)).toBe(false)
    expect(await verifyPassword('x', '')).toBe(false)
    expect(await verifyPassword('x', 'sha256$broken')).toBe(false)
  })
})
