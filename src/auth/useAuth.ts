import { useCallback, useSyncExternalStore } from 'react'
import * as authApi from '../api/auth'
import { tokenStore } from '../api/tokens'
import type { AuthUser } from '../api/types'

export async function login(email: string, password: string): Promise<AuthUser> {
  const pair = await authApi.login(email, password)
  tokenStore.set(pair)
  return pair.user
}

export function logout() {
  const refreshToken = tokenStore.get()?.refresh_token
  tokenStore.clear()
  if (refreshToken) authApi.logout(refreshToken).catch(() => {})
}

/** Refresh the stored user (role/house may have changed since login). */
export async function syncCurrentUser() {
  if (!tokenStore.get()) return
  try {
    tokenStore.setUser(await authApi.me())
  } catch {
    // A 401 already cleared the session inside the client.
  }
}

export function useAuth() {
  const session = useSyncExternalStore(tokenStore.subscribe, tokenStore.get)
  const doLogout = useCallback(() => logout(), [])
  return { user: session?.user ?? null, login, logout: doLogout }
}
