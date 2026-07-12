import { getRepo } from '@/lib/server/store'

// Liveness + readiness probe. 200 when the app and its store are usable.
export async function GET() {
  try {
    const repo = await getRepo()
    await repo.ping()
    return Response.json({
      status: 'ok',
      store: repo.kind,
      time: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[health] store unavailable:', error)
    return Response.json(
      { status: 'unavailable', error: 'Store is not reachable' },
      { status: 503 },
    )
  }
}
