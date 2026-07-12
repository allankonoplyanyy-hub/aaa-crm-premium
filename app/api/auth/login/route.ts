import { z } from 'zod'
import { createSession, apiErrorResponse, ApiError } from '@/lib/server/auth'
import { verifyPassword, dummyVerify } from '@/lib/server/passwords'
import { checkRateLimit, resetRateLimit, clientIp } from '@/lib/server/security'
import { getRepo } from '@/lib/server/store'
import { log } from '@/lib/server/log'

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
})

const INVALID = 'Неверный email или пароль'

export async function POST(req: Request) {
  try {
    const parsed = LoginSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      throw new ApiError(400, INVALID)
    }
    const { email, password } = parsed.data
    const ip = clientIp(req)

    // Rate limits: per IP+email and a wider per-IP net.
    checkRateLimit(`login:${ip}:${email}`, 5)
    checkRateLimit(`login-ip:${ip}`, 20)

    const repo = await getRepo()
    const user = await repo.users.findByEmail(email)

    if (!user || !user.active) {
      // Uniform error + dummy hash verify: no email enumeration by message or timing.
      await dummyVerify()
      throw new ApiError(401, INVALID)
    }
    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      log.warn('auth.login_failed', { userId: user.id, ip })
      throw new ApiError(401, INVALID)
    }

    resetRateLimit(`login:${ip}:${email}`)
    await createSession(user.id)
    await repo.audit({
      companyId: user.companyId,
      actorId: user.id,
      action: 'auth.login',
      entity: 'system',
      entityId: null,
      meta: { ip },
    })
    log.info('auth.login', { userId: user.id })

    return Response.json({
      ok: true,
      user: { id: user.id, name: user.name, role: user.role },
    })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
