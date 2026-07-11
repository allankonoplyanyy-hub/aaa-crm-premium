import {
  requireSession,
  assertCanWrite,
  assertTenant,
  apiErrorResponse,
  ApiError,
} from '@/lib/server/auth'
import { getDb, uid } from '@/lib/server/store'
import type { Task } from '@/lib/types'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    const { id } = await params
    const db = getDb()
    const task = db.tasks.find((t) => t.id === id)
    if (!task) throw new ApiError(404, 'Задача не найдена')
    assertTenant(session, task.companyId)

    const body = (await req.json()) as Partial<Task>

    if (typeof body.done === 'boolean' && body.done !== task.done) {
      task.done = body.done
      if (body.done) {
        db.events.unshift({
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
    if (typeof body.title === 'string' && body.title.trim()) task.title = body.title.trim()
    if (body.dueAt) task.dueAt = body.dueAt
    if (body.type) task.type = body.type
    if (body.assigneeId && db.users.some((u) => u.id === body.assigneeId && u.companyId === task.companyId)) {
      task.assigneeId = body.assigneeId
    }

    return Response.json(task)
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    const { id } = await params
    const db = getDb()
    const task = db.tasks.find((t) => t.id === id)
    if (!task) throw new ApiError(404, 'Задача не найдена')
    assertTenant(session, task.companyId)

    db.tasks = db.tasks.filter((t) => t.id !== id)
    return Response.json({ ok: true })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
