import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request } from './client'
import { tokenStore } from './tokens'
import type { TokenPair } from './types'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const pair = (n: number): TokenPair => ({
  access_token: `access-${n}`,
  refresh_token: `refresh-${n}`,
  token_type: 'Bearer',
  expires_in: 900,
  user: { id: 'u1', name: 'Satpam Budi', role: 'guard', house_id: null },
})

const unauthorized = () => json(401, { error: { code: 'unauthorized', message: 'Sesi tidak valid.' } })
const authOf = (init?: RequestInit) => (init?.headers as Record<string, string> | undefined)?.Authorization

beforeEach(() => tokenStore.set(pair(1)))
afterEach(() => {
  vi.unstubAllGlobals()
  tokenStore.clear()
})

describe('request', () => {
  it('sends the access token as a Bearer header', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => json(200, { ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await request('/v1/auth/me')

    expect(authOf(fetchMock.mock.calls[0][1])).toBe('Bearer access-1')
  })

  it('refreshes once for concurrent 401s and retries both with the new token', async () => {
    let refreshCalls = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.endsWith('/v1/auth/refresh')) {
          refreshCalls++
          expect(JSON.parse(init!.body as string)).toEqual({ refresh_token: 'refresh-1' })
          await new Promise((r) => setTimeout(r, 10))
          return json(200, pair(2))
        }
        return authOf(init) === 'Bearer access-2' ? json(200, { url }) : unauthorized()
      }),
    )

    const [a, b] = await Promise.all([request('/v1/visits'), request('/v1/houses')])

    expect(a).toEqual({ url: '/v1/visits' })
    expect(b).toEqual({ url: '/v1/houses' })
    // A second refresh with the rotated-out token would revoke the whole family.
    expect(refreshCalls).toBe(1)
    expect(tokenStore.get()?.refresh_token).toBe('refresh-2')
  })

  it('clears the session when the refresh token is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('/v1/auth/refresh')
          ? json(401, { error: { code: 'invalid_refresh_token', message: 'Sesi berakhir.' } })
          : unauthorized(),
      ),
    )

    await expect(request('/v1/visits')).rejects.toMatchObject({ status: 401, code: 'unauthorized' })
    expect(tokenStore.get()).toBeNull()
  })

  it('parses 422 field details from the error envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        json(422, {
          error: {
            code: 'validation_failed',
            message: 'Data tidak valid.',
            details: { vehicle_photo: 'Foto kendaraan wajib diisi.' },
          },
        }),
      ),
    )

    const err = (await request('/v1/visits', { method: 'POST', body: {} }).catch((e) => e)) as ApiError

    expect(err).toBeInstanceOf(ApiError)
    expect(err.code).toBe('validation_failed')
    expect(err.details).toEqual({ vehicle_photo: 'Foto kendaraan wajib diisi.' })
  })

  it('maps a network failure to a readable ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(request('/v1/visits')).rejects.toMatchObject({ status: 0, code: 'network_error' })
    expect(tokenStore.get()).not.toBeNull()
  })
})
