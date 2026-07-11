import { cookies } from 'next/headers'
import type { Role, SessionUser, User } from '@/lib/types'
import { getDb } from './store'

const SESSION_COOKIE = 'aaa_session'
const COMPANY_COOKIE = 'aaa_company'

export async function setSession(userId: string) {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, userId, { httpOnly: true, sameSite: 'lax', path: '/' })
}

export async function clearSession() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  jar.delete(COMPANY_COOKIE)
}

export async function setActiveCompany(companyId: string) {
  const jar = await cookies()
  jar.set(COMPANY_COOKIE, companyId, { httpOnly: true, sameSite: 'lax', path: '/' })
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies()
  const userId = jar.get(SESSION_COOKIE)?.value
  if (!userId) return null
  const db = getDb()
  const user = db.users.find((u) => u.id === userId && u.active)
  if (!user) return null

  // Owner can switch active company; everyone else is locked to their tenant.
  let activeCompanyId = user.companyId
  if (user.role === 'owner') {
    const requested = jar.get(COMPANY_COOKIE)?.value
    if (requested && db.tenants.some((t) => t.id === requested)) {
      activeCompanyId = requested
    }
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
export function assertTenant(session: SessionUser, entityCompanyId: string) {
  if (entityCompanyId !== session.activeCompanyId) {
    throw new ApiError(404, 'Запись не найдена')
  }
}

export function findUser(email: string): User | undefined {
  return getDb().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
}

// Demo-grade hashing (SHA-256 via Web Crypto). Production must use bcrypt/argon2.
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`aaa-crm::${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPassword(user: User, password: string, demoPassword: string): Promise<boolean> {
  if (user.passwordHash) {
    return (await hashPassword(password)) === user.passwordHash
  }
  return password === demoPassword
}

export function apiErrorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status })
  }
  console.error('[v0] API error:', error)
  return Response.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
}
