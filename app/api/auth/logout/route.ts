import { destroySession, apiErrorResponse } from '@/lib/server/auth'

export async function POST() {
  try {
    // Revokes the session row in the store and clears both cookies.
    await destroySession()
    return Response.json({ ok: true })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
