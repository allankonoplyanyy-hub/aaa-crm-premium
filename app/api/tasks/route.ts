import { requireSession, assertCanWrite, apiErrorResponse } from '@/lib/server/auth'
import { getDb, uid } from '@/lib/server/store'
import { TASK_TYPE_LABELS, type Task, type TaskType } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    assertCanWrite(session)
    const body = (await req.json()) as Partial<Task>

    if (!body.title?.trim()) {
      return Response.json({ error: 'Укажите название задачи' }, { status: 400 })
    }
    if (!body.dueAt) {
      return Response.json({ error: 'Укажите срок задачи' }, { status: 400 })
    }
    const type = (body.type as TaskType) || 'call'
    if (!TASK_TYPE_LABELS[type]) {
      return Response.json({ error: 'Неизвестный тип задачи' }, { status: 400 })
    }

    const db = getDb()
    const cid = session.activeCompanyId

    const task: Task = {
      id: uid('tk'),
      companyId: cid,
      title: body.title.trim(),
      type,
      dueAt: body.dueAt,
      done: false,
      assigneeId:
        body.assigneeId && db.users.some((u) => u.id === body.assigneeId && u.companyId === cid)
          ? body.assigneeId
          : session.id,
      dealId:
        body.dealId && db.deals.some((d) => d.id === body.dealId && d.companyId === cid)
          ? body.dealId
          : null,
      contactId:
        body.contactId && db.contacts.some((c) => c.id === body.contactId && c.companyId === cid)
          ? body.contactId
          : null,
      createdAt: new Date().toISOString(),
    }

    db.tasks.unshift(task)
    db.events.unshift({
      id: uid('e'),
      companyId: cid,
      actorId: session.id,
      byAi: false,
      text: `${session.name} создал(а) задачу «${task.title}»`,
      entity: 'task',
      entityId: task.id,
      at: new Date().toISOString(),
    })

    return Response.json(task, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
