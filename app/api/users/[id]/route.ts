import {
  requireSession,
  assertAdmin,
  apiErrorResponse,
  ApiError,
} from '@/lib/server/auth'
import { getDb, uid } from '@/lib/server/store'
import type { Role } from '@/lib/types'

const ASSIGNABLE_ROLES: Role[] = ['admin', 'manager', 'viewer']

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    assertAdmin(session)
    const { id } = await params
    const db = getDb()
    const user = db.users.find((u) => u.id === id)
    if (!user) throw new ApiError(404, 'Пользователь не найден')
    if (user.role === 'owner') throw new ApiError(403, 'Нельзя изменить владельца платформы')
    // Admin can only manage users of their own company; owner manages all.
    if (session.role !== 'owner' && user.companyId !== session.activeCompanyId) {
      throw new ApiError(404, 'Пользователь не найден')
    }

    const body = (await req.json()) as { role?: Role; active?: boolean }
    if (body.role) {
      if (!ASSIGNABLE_ROLES.includes(body.role)) throw new ApiError(400, 'Недопустимая роль')
      user.role = body.role
    }
    if (typeof body.active === 'boolean') user.active = body.active

    db.events.unshift({
      id: uid('e'),
      companyId: user.companyId,
      actorId: session.id,
      byAi: false,
      text: `${session.name} обновил(а) доступ пользователя ${user.name}`,
      entity: 'system',
      entityId: user.id,
      at: new Date().toISOString(),
    })

    return Response.json(user)
  } catch (error) {
    return apiErrorResponse(error)
  }
}
