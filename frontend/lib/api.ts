/**
 * API client for the RobEurope Express backend.
 * All requests go through NEXT_PUBLIC_API_BASE_URL.
 * Auth is handled via Bearer token in Authorization header (Supabase JWT).
 */

const DEFAULT_TTL = 30_000

const _cache = new Map<string, { data: unknown; exp: number }>()
const _inflight = new Map<string, Promise<unknown>>()

function getCached(key: string) {
  const entry = _cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.exp) { _cache.delete(key); return null }
  return entry.data
}

function setCached(key: string, data: unknown, ttl: number) {
  _cache.set(key, { data, exp: Date.now() + ttl })
}

export function invalidateCache(pattern: string) {
  for (const key of _cache.keys()) {
    if (key.includes(pattern)) _cache.delete(key)
  }
}

function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  if (!base) return 'http://localhost:5000/api'
  const trimmed = base.replace(/\/$/, '')
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`
}

export function resolveMediaUrl(path: string): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const base = getApiBase().replace(/\/api$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  formData?: boolean
  ttl?: number
  /** Supabase access token (JWT) — required for protected endpoints */
  accessToken?: string
}

export async function apiRequest<T = unknown>(
  path: string,
  {
    method = 'GET',
    body,
    headers = {},
    formData = false,
    ttl = DEFAULT_TTL,
    accessToken,
  }: RequestOptions = {}
): Promise<T> {
  const cacheKey = `${method}:${path}`
  const cacheable = method === 'GET' && ttl > 0

  if (cacheable) {
    const cached = getCached(cacheKey)
    if (cached !== null) return cached as T
    if (_inflight.has(cacheKey)) return _inflight.get(cacheKey) as Promise<T>
  }

  const execute = async (): Promise<T> => {
    const finalHeaders: Record<string, string> = { ...headers }

    if (accessToken) {
      finalHeaders['Authorization'] = `Bearer ${accessToken}`
    }

    const options: RequestInit = {
      method,
      headers: finalHeaders,
    }

    if (body) {
      if (formData || (typeof FormData !== 'undefined' && body instanceof FormData)) {
        options.body = body as FormData
        delete finalHeaders['Content-Type']
      } else {
        finalHeaders['Content-Type'] = finalHeaders['Content-Type'] ?? 'application/json'
        options.body = JSON.stringify(body)
      }
    }

    const url = `${getApiBase()}${path}`
    const res = await fetch(url, options)
    const payload = res.headers.get('content-type')?.includes('application/json')
      ? await res.json()
      : await res.text()

    if (!res.ok) {
      const err = typeof payload === 'string' ? { message: payload } : payload
      throw new Error(err?.error ?? err?.message ?? 'Request failed')
    }

    if (cacheable) setCached(cacheKey, payload, ttl)
    return payload as T
  }

  const promise = execute()

  if (cacheable) {
    _inflight.set(cacheKey, promise)
    promise.finally(() => _inflight.delete(cacheKey))
  }

  return promise
}
