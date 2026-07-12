import { z } from 'zod'
import { createSession, apiErrorResponse, ApiError } from '@/lib/server/auth'
import { hashPassword } from '@/lib/server/passwords'
import { checkRateLimit, clientIp } from '@/lib/server/security'
import { getRepo, uid } from '@/lib/server/store'
import { log } from '@/lib/server/log'
import type { Tenant, User } from '@/lib/types'

const RegisterSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  niche: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(200),
})

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export async function POST(req: Request) {
  try {
    checkRateLimit(`register:${clientIp(req)}`, 5)

    const parsed = RegisterSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      const messages: Record<string, string> = {
        companyName: 'Укажите название компании (от 2 символов)',
        name: 'Укажите ваше имя (от 2 символов)',
        email: 'Укажите корректный email',
        password: 'Пароль должен быть не короче 8 символов',
      }
      throw new ApiError(400, messages[String(issue?.path[0])] ?? 'Некорректные данные')
    }
    const { companyName, niche, city, name, email, password } = parsed.data

    const repo = await getRepo()
    if (await repo.users.findByEmail(email)) {
      // Registration must confirm duplicates to be usable; login stays uniform.
      throw new ApiError(409, 'Пользователь с таким email уже существует')
    }

    const nowIso = new Date().toISOString()
    const tenant: Tenant = {
      id: uid('t'),
      name: companyName,
      bin: '',
      niche: niche || 'Другое',
      city: city || 'Алматы',
      plan: 'Старт',
      status: 'active',
      aiSpendKzt: 0,
      aiLimitKzt: 50000,
      createdAt: nowIso,
    }
    await repo.tenants.insert(tenant)

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
    await repo.users.insert(user)

    await repo.events.insert({
      id: uid('ev'),
      companyId: tenant.id,
      actorId: user.id,
      byAi: false,
      text: `Компания «${companyName}» зарегистрирована на платформе`,
      entity: 'system',
      entityId: null,
      at: nowIso,
    })
    await repo.audit({
      companyId: tenant.id,
      actorId: user.id,
      action: 'auth.register',
      entity: 'system',
      entityId: tenant.id,
    })
    log.info('auth.register', { tenantId: tenant.id, userId: user.id })

    await createSession(user.id)
    return Response.json({ ok: true }, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
