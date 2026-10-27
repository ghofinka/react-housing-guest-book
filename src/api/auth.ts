import { request } from './client'
import type { AuthUser, TokenPair } from './types'

export const login = (email: string, password: string) =>
  request<TokenPair>('/v1/auth/login', { method: 'POST', body: { email, password }, auth: false })

export const logout = (refresh_token: string) =>
  request<void>('/v1/auth/logout', { method: 'POST', body: { refresh_token }, auth: false })

export const me = () => request<AuthUser>('/v1/auth/me')

/** Revokes every session of the user, including this one. */
export const changePassword = (current_password: string, new_password: string) =>
  request<void>('/v1/auth/password', { method: 'POST', body: { current_password, new_password } })
