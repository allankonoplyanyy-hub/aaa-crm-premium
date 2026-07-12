// Double-submit CSRF: read the readable CSRF cookie and echo it in a header
// on every mutating request. The server compares cookie and header values.
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)aaa_csrf=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export async function apiFetch<T = unknown>(
  url: string,
  options?: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown },
): Promise<T> {
  const method = options?.method ?? 'GET'
  const headers: Record<string, string> = {}
  if (options?.body) headers['Content-Type'] = 'application/json'
  if (method !== 'GET') {
    const csrf = getCsrfToken()
    if (csrf) headers['x-csrf-token'] = csrf
  }

  const res = await fetch(url, {
    method,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: string }).error)
        : `Ошибка запроса (${res.status})`
    throw new Error(message)
  }
  return data as T
}
