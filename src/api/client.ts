import { tokenStore } from './tokens'
import type { TokenPair } from './types'

export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  /** Field name → message, present on 422 validation_failed. */
  readonly details?: Record<string, string>

  constructor(status: number, code: string, message: string, details?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export type Query = Record<string, string | number | boolean | null | undefined>

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Plain objects are sent as JSON; FormData is sent as multipart. */
  body?: unknown
  query?: Query
  /** Attach the Bearer token and refresh on 401. Default true. */
  auth?: boolean
  signal?: AbortSignal
  /** Browser HTTP cache mode, for endpoints the API marks cacheable. */
  cache?: RequestCache
}

export function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return `${API_BASE}${path}${qs ? `?${qs}` : ''}`
}

const FALLBACK_MESSAGES: Record<number, string> = {
  0: 'Koneksi bermasalah, coba lagi.',
  401: 'Sesi berakhir, silakan masuk lagi.',
  403: 'Anda tidak memiliki akses.',
  404: 'Data tidak ditemukan.',
  413: 'Ukuran foto terlalu besar.',
}

async function toApiError(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as {
      error?: { code?: string; message?: string; details?: Record<string, string> }
    }
    if (body.error?.code) {
      return new ApiError(res.status, body.error.code, body.error.message ?? '', body.error.details)
    }
  } catch {
    // Not the JSON envelope (e.g. the mux's plain-text 404/405).
  }
  return new ApiError(
    res.status,
    `http_${res.status}`,
    FALLBACK_MESSAGES[res.status] ?? 'Terjadi kesalahan pada server.',
  )
}

// The backend rotates the refresh token on every use and revokes the whole
// family if an old one is replayed, so only one refresh may be in flight:
// one shared promise per tab, plus a Web Lock across tabs.
let refreshing: Promise<boolean> | null = null

async function doRefresh(staleRefreshToken: string): Promise<boolean> {
  const current = tokenStore.reload()
  if (!current) return false
  // Someone else (another request or tab) already refreshed: just retry.
  if (current.refresh_token !== staleRefreshToken) return true

  let res: Response
  try {
    res = await fetch(buildUrl('/v1/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: current.refresh_token }),
    })
  } catch {
    throw new ApiError(0, 'network_error', FALLBACK_MESSAGES[0])
  }
  if (!res.ok) {
    tokenStore.clear()
    return false
  }
  tokenStore.set((await res.json()) as TokenPair)
  return true
}

export function refreshSession(staleRefreshToken: string): Promise<boolean> {
  if (!refreshing) {
    const run = () => doRefresh(staleRefreshToken)
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
    const p = locks ? locks.request('hgb-token-refresh', run) : run()
    refreshing = p.finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

async function send(path: string, opts: RequestOptions, retried = false): Promise<Response> {
  const { method = 'GET', body, query, auth = true, signal, cache } = opts
  const headers: Record<string, string> = {}
  let payload: BodyInit | undefined
  if (body instanceof FormData) {
    payload = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const session = auth ? tokenStore.get() : null
  if (session) headers.Authorization = `Bearer ${session.access_token}`

  let res: Response
  try {
    res = await fetch(buildUrl(path, query), { method, headers, body: payload, signal, cache })
  } catch (err) {
    if (signal?.aborted) throw err
    throw new ApiError(0, 'network_error', FALLBACK_MESSAGES[0])
  }

  if (res.status === 401 && session) {
    if (!retried && (await refreshSession(session.refresh_token))) {
      return send(path, opts, true)
    }
    // Still rejected with a fresh token (e.g. account deactivated).
    tokenStore.clear()
  }
  if (!res.ok) throw await toApiError(res)
  return res
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await send(path, opts)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export async function requestBlob(path: string, opts: RequestOptions = {}): Promise<Blob> {
  const res = await send(path, opts)
  return res.blob()
}
