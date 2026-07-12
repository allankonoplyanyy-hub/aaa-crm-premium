import { z } from 'zod'
import {
  requireSession,
  assertAdmin,
  assertCsrf,
  revokeAllSessions,
  apiErrorResponse,
  ApiError,
} from '@/lib/server/auth'
import { getRepo, uid } from '@/lib/server/store'

const patchUserSchema = z.object({
  role: z.enum(['admin', 'manager', 'viewer']).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    assertAdmin(session)
    await assertCsrf(req)
    const { id } = await params

    const repo = await getRepo()
    const user = await repo.users.byId(id)
    if (!user) throw new ApiError(404, 'Пользователь не найден')
    if (user.role === 'owner') throw new ApiError(403, 'Нельзя изменить владельца платформы')
    // Admin can only manage users of their own company; owner manages all.
    if (session.role !== 'owner' && user.companyId !== session.activeCompanyId) {
      throw new ApiError(404, 'Пользователь не найден')
    }

    const parsed = patchUserSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json({ error: 'Некорректные данные' }, { status: 400 })
    }
    const body = parsed.data

    if (body.role) user.role = body.role
    if (typeof body.active === 'boolean') {
      user.active = body.active
      // Deactivation kills all live sessions of that user immediately.
      if (!body.active) await revokeAllSessions(user.id)
    }

    await repo.users.update(user)
    await repo.events.insert({
      id: uid('e'),
      companyId: user.companyId,
      actorId: session.id,
      byAi: false,
      text: `${session.name} обновил(а) доступ пользователя ${user.name}`,
      entity: 'system',
      entityId: user.id,
      at: new Date().toISOString(),
    })
    await repo.audit({
      companyId: user.companyId,
      actorId: session.id,
      action: 'user.update',
      entity: 'user',
      entityId: user.id,
      meta: { role: body.role, active: body.active },
    })

    const { passwordHash: _ph, ...safeUser } = user
    return Response.json(safeUser)
  } catch (error) {
    return apiErrorResponse(error)
  }
}
