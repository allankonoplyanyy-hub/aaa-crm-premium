import { findUser, setSession, hashPassword, apiErrorResponse } from '@/lib/server/auth'
import { getDb, uid } from '@/lib/server/store'
import type { Tenant, User } from '@/lib/types'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      companyName?: string
      niche?: string
      city?: string
      name?: string
      email?: string
      password?: string
    }

    const companyName = body.companyName?.trim() ?? ''
    const niche = body.niche?.trim() || 'Другое'
    const city = body.city?.trim() || 'Алматы'
    const name = body.name?.trim() ?? ''
    const email = body.email?.trim().toLowerCase() ?? ''
    const password = body.password ?? ''

    if (!companyName || companyName.length < 2) {
      return Response.json({ error: 'Укажите название компании' }, { status: 400 })
    }
    if (!name || name.length < 2) {
      return Response.json({ error: 'Укажите ваше имя' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return Response.json({ error: 'Укажите корректный email' }, { status: 400 })
    }
    if (password.length < 8) {
      return Response.json({ error: 'Пароль должен быть не короче 8 символов' }, { status: 400 })
    }
    if (findUser(email)) {
      return Response.json({ error: 'Пользователь с таким email уже существует' }, { status: 409 })
    }

    const db = getDb()

    const tenant: Tenant = {
      id: uid('t'),
      name: companyName,
      bin: '',
      niche,
      city,
      plan: 'Старт',
      status: 'active',
      aiSpendKzt: 0,
      aiLimitKzt: 50000,
      createdAt: new Date().toISOString(),
    }
    db.tenants.push(tenant)

    const user: User = {
      id: uid('u'),
      companyId: tenant.id,
      name,
      email,
      role: 'admin',
      title: 'Администратор',
      avatarInitials: initials(name),
      active: true,
      passwordHash: await hashPassword(password),
    }
    db.users.push(user)

    db.events.push({
      id: uid('ev'),
      companyId: tenant.id,
      actorId: user.id,
      byAi: false,
      text: `Компания «${companyName}» зарегистрирована на платформе`,
      entity: 'system',
      entityId: null,
      at: new Date().toISOString(),
    })

    await setSession(user.id)
    return Response.json({ ok: true })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
