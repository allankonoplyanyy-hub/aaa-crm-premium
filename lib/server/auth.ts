import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import type { Role, SessionUser } from '@/lib/types'
import { getRepo } from './store'
import type { SessionRecord } from './repository'

export const SESSION_COOKIE = 'aaa_session'
export const CSRF_COOKIE = 'aaa_csrf'
export const CSRF_HEADER = 'x-csrf-token'

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function cookieFlags() {
  // The v0 preview renders the app in a cross-site iframe: cookies need
  // SameSite=None there. Production uses Lax + Secure.
  const dev = process.env.NODE_ENV === 'development'
  return {
    httpOnly: true,
    secure: true,
    sameSite: (dev ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  }
}

/** Creates a DB-backed session + CSRF token and sets both cookies. */
export async function createSession(userId: string): Promise<void> {
  const repo = await getRepo()
  const token = randomBytes(32).toString('base64url')
  const csrf = randomBytes(24).toString('base64url')
  const now = new Date()
  const record: SessionRecord = {
    tokenHash: hashToken(token),
    userId,
    activeCompanyId: null,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    revokedAt: null,
  }
  await repo.sessions.create(record)

  const jar = await cookies()
  const flags = cookieFlags()
  jar.set(SESSION_COOKIE, token, { ...flags, maxAge: SESSION_TTL_MS / 1000 })
  // CSRF cookie is intentionally readable by JS (double-submit pattern).
  jar.set(CSRF_COOKIE, csrf, { ...flags, httpOnly: false, maxAge: SESSION_TTL_MS / 1000 })
}

/** Revokes the current session server-side and clears cookies. */
export async function destroySession(): Promise<void> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) {
    const repo = await getRepo()
    await repo.sessions.revoke(hashToken(token))
  }
  jar.delete(SESSION_COOKIE)
  jar.delete(CSRF_COOKIE)
}

/** Force-invalidate every session of a user (e.g. deactivation, password change). */
export async function revokeAllSessions(userId: string): Promise<void> {
  const repo = await getRepo()
  await repo.sessions.revokeAllForUser(userId)
}

async function getSessionRecord(): Promise<SessionRecord | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null
  const repo = await getRepo()
  const record = await repo.sessions.get(hashToken(token))
  if (!record) return null
  if (record.revokedAt) return null
  if (new Date(record.expiresAt).getTime() < Date.now()) return null
  return record
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const record = await getSessionRecord()
  if (!record) return null
  const repo = await getRepo()
  const user = await repo.users.byId(record.userId)
  if (!user || !user.active) return null

  // Owner company switch is stored server-side in the session record.
  let activeCompanyId = user.companyId
  if (user.role === 'owner' && record.activeCompanyId) {
    const tenant = await repo.tenants.byId(record.activeCompanyId)
    if (tenant) activeCompanyId = tenant.id
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    activeCompanyId,
    title: user.title,
    avatarInitials: user.avatarInitials,
  }
}

/** Owner-only: persist the active company on the server-side session. */
export async function setActiveCompany(companyId: string): Promise<void> {
  const record = await getSessionRecord()
  if (!record) throw new ApiError(401, 'Требуется авторизация')
  const repo = await getRepo()
  record.activeCompanyId = companyId
  await repo.sessions.update(record)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSessionUser()
  if (!session) throw new ApiError(401, 'Требуется авторизация')
  return session
}

// CSRF: double-submit cookie. Write requests must echo the CSRF cookie in a header.
export async function assertCsrf(req: Request): Promise<void> {
  const jar = await cookies()
  const cookieValue = jar.get(CSRF_COOKIE)?.value
  const headerValue = req.headers.get(CSRF_HEADER)
  if (!cookieValue || !headerValue) {
    throw new ApiError(403, 'CSRF-токен отсутствует')
  }
  const a = Buffer.from(cookieValue)
  const b = Buffer.from(headerValue)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new ApiError(403, 'Неверный CSRF-токен')
  }
}

const WRITE_ROLES: Role[] = ['owner', 'admin', 'manager']

export function assertCanWrite(session: SessionUser) {
  if (!WRITE_ROLES.includes(session.role)) {
    throw new ApiError(403, 'Роль «Наблюдатель» не имеет прав на изменение данных')
  }
}

export function assertAdmin(session: SessionUser) {
  if (session.role !== 'owner' && session.role !== 'admin') {
    throw new ApiError(403, 'Недостаточно прав')
  }
}

export function assertOwner(session: SessionUser) {
  if (session.role !== 'owner') {
    throw new ApiError(403, 'Доступно только владельцу платформы')
  }
}

// Tenant isolation: entity must belong to the session's active company.
// Cross-tenant lookups return 404 without leaking existence.
export function assertTenant(session: SessionUser, entityCompanyId: string) {
  if (entityCompanyId !== session.activeCompanyId) {
    throw new ApiError(404, 'Запись не найдена')
  }
}

export function apiErrorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status })
  }
  console.error('[api] unhandled error:', error)
  return Response.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
}
