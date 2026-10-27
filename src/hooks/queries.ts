import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { listHouses } from '../api/houses'
import {
  getPrivacyNotice,
  getPrivacySettings,
  getRetention,
  listAuditLogs,
  type AuditFilters,
} from '../api/settings'
import type { Page, Role } from '../api/types'
import { listUsers } from '../api/users'
import { fetchPhoto, getVisit, listVisits, type VisitFilters } from '../api/visits'

export const keys = {
  houses: (includeInactive = false) => ['houses', includeInactive] as const,
  visits: ['visits'] as const,
  inside: ['visits', 'inside'] as const,
  visitList: (f: VisitFilters) => ['visits', 'list', f] as const,
  visit: (id: string) => ['visit', id] as const,
  photo: (path: string) => ['photo', path] as const,
  users: ['users'] as const,
  userList: (f: object) => ['users', 'list', f] as const,
  userDirectory: ['users', 'directory'] as const,
  audit: (f: AuditFilters) => ['audit', f] as const,
  retention: ['retention'] as const,
  privacySettings: ['privacy', 'settings'] as const,
  privacyNotice: ['privacy', 'notice'] as const,
}

const PAGE_SIZE = 50
const nextCursor = <T>(last: Page<T>) => last.next_cursor ?? undefined

export const useHouses = (includeInactive = false, enabled = true) =>
  useQuery({
    queryKey: keys.houses(includeInactive),
    queryFn: () => listHouses(includeInactive),
    enabled,
    staleTime: 5 * 60_000,
  })

/** Guests currently inside (M3). Polled so every guard tablet stays current. */
export const useInsideVisits = (enabled = true) =>
  useQuery({
    queryKey: keys.inside,
    queryFn: () => listVisits({ status: 'inside', limit: 200 }).then((p) => p.data),
    enabled,
    refetchInterval: 30_000,
  })

export const useVisitPages = (filters: VisitFilters) =>
  useInfiniteQuery({
    queryKey: keys.visitList(filters),
    queryFn: ({ pageParam }) => listVisits({ ...filters, cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextCursor,
  })

export const useVisit = (id?: string) =>
  useQuery({
    queryKey: keys.visit(id ?? ''),
    queryFn: () => getVisit(id!),
    enabled: !!id,
  })

/** Each fetch is audited server-side (photo_viewed), so keep it cached for the session. */
export const usePhoto = (path?: string | null) =>
  useQuery({
    queryKey: keys.photo(path ?? ''),
    queryFn: () => fetchPhoto(path!),
    enabled: !!path,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
  })

export const useUserPages = (filters: { role?: Role }) =>
  useInfiniteQuery({
    queryKey: keys.userList(filters),
    queryFn: ({ pageParam }) => listUsers({ ...filters, cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextCursor,
  })

/** Admin-only id → user lookup, for audit filters and "petugas" names. */
export const useUserDirectory = (enabled = true) =>
  useQuery({
    queryKey: keys.userDirectory,
    queryFn: () => listUsers({ limit: 200 }).then((p) => p.data),
    enabled,
    staleTime: 5 * 60_000,
  })

export const useAuditPages = (filters: AuditFilters) =>
  useInfiniteQuery({
    queryKey: keys.audit(filters),
    queryFn: ({ pageParam }) => listAuditLogs({ ...filters, cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextCursor,
  })

export const useRetention = () => useQuery({ queryKey: keys.retention, queryFn: getRetention })

export const usePrivacySettings = () =>
  useQuery({ queryKey: keys.privacySettings, queryFn: getPrivacySettings })

export const usePrivacyNotice = () =>
  useQuery({ queryKey: keys.privacyNotice, queryFn: getPrivacyNotice })
