import { z } from 'zod'
import {
  requireSession,
  assertCanWrite,
  assertCsrf,
  assertTenant,
  apiErrorResponse,
  ApiError,
} from '@/lib/server/auth'
import { getRepo, uid } from '@/lib/server/store'

const patchTaskSchema = z.object({
  done: z.boolean().optional(),
  title: z.string().trim().min(1).max(300).optional(),
  dueAt: z.string().min(1).optional(),
  type: z.enum(['call', 'meeting', 'message', 'proposal', 'followup']).optional(),
  assigneeId: z.string().max(64).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    await assertCsrf(req)
    const { id } = await params

    const repo = await getRepo()
    const task = await repo.tasks.byId(id)
    if (!task) throw new ApiError(404, 'Задача не найдена')
    assertTenant(session, task.companyId)

    const parsed = patchTaskSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json({ error: 'Некорректные данные' }, { status: 400 })
    }
    const body = parsed.data

    if (typeof body.done === 'boolean' && body.done !== task.done) {
      task.done = body.done
      if (body.done) {
        await repo.events.insert({
          id: uid('e'),
          companyId: task.companyId,
          actorId: session.id,
          byAi: false,
          text: `${session.name} завершил(а) задачу «${task.title}»`,
          entity: 'task',
          entityId: task.id,
          at: new Date().toISOString(),
        })
      }
    }
    if (body.title) task.title = body.title
    if (body.dueAt) task.dueAt = body.dueAt
    if (body.type) task.type = body.type
    if (body.assigneeId) {
      const u = await repo.users.byId(body.assigneeId)
      if (u && u.companyId === task.companyId) task.assigneeId = u.id
    }

    await repo.tasks.update(task)
    await repo.audit({
      companyId: task.companyId,
      actorId: session.id,
      action: 'task.update',
      entity: 'task',
      entityId: task.id,
    })

    return Response.json(task)
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    await assertCsrf(req)
    const { id } = await params

    const repo = await getRepo()
    const task = await repo.tasks.byId(id)
    if (!task) throw new ApiError(404, 'Задача не найдена')
    assertTenant(session, task.companyId)

    await repo.tasks.remove(id)
    await repo.audit({
      companyId: task.companyId,
      actorId: session.id,
      action: 'task.delete',
      entity: 'task',
      entityId: id,
    })
    return Response.json({ ok: true })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
