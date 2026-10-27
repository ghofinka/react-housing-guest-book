import type { AuthUser, TokenPair } from './types'

// Tokens live in localStorage so a guard's session survives a tablet reload
// during a shift. The refresh token rotates on every refresh.
const KEY = 'hgb.session'

export interface Session {
  access_token: string
  refresh_token: string
  user: AuthUser
}

type Listener = (session: Session | null) => void

const listeners = new Set<Listener>()
let cache: Session | null | undefined

function read(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function write(session: Session | null) {
  cache = session
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session))
    else localStorage.removeItem(KEY)
  } catch {
    // Storage unavailable (private mode): the session stays in memory only.
  }
  listeners.forEach((fn) => fn(session))
}

export const tokenStore = {
  get(): Session | null {
    if (cache === undefined) cache = read()
    return cache
  },
  /** Re-read from storage, picking up a refresh done by another tab. */
  reload(): Session | null {
    cache = read()
    return cache
  },
  set(pair: TokenPair) {
    write({ access_token: pair.access_token, refresh_token: pair.refresh_token, user: pair.user })
  },
  setUser(user: AuthUser) {
    const current = tokenStore.get()
    if (current) write({ ...current, user })
  },
  clear() {
    if (tokenStore.get() !== null) write(null)
  },
  subscribe(fn: Listener): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return
    const session = tokenStore.reload()
    listeners.forEach((fn) => fn(session))
  })
}
