import { request } from './client'
import type {
  AuditEntry,
  Page,
  PrivacyNotice,
  PrivacySettings,
  RetentionRunResult,
  RetentionSettings,
} from './types'

// Retention (M9)
export const getRetention = () => request<RetentionSettings>('/v1/settings/retention')

export const updateRetention = (body: {
  photo_retention_days: number
  personal_data_retention_days: number
}) => request<RetentionSettings>('/v1/settings/retention', { method: 'PUT', body })

export const runRetention = (dryRun: boolean) =>
  request<RetentionRunResult>('/v1/retention/run', {
    method: 'POST',
    query: { dry_run: dryRun || undefined },
  })

// Audit log (M11)
export interface AuditFilters {
  user_id?: string
  action?: string
  /** Prefix match. */
  target?: string
  from?: string
  to?: string
}

export const listAuditLogs = (filters: AuditFilters & { cursor?: string; limit?: number }) =>
  request<Page<AuditEntry>>('/v1/audit-logs', { query: { ...filters } })

// Privacy notice (M8)
// The API sends `max-age=300` for guests' phones; the app always revalidates so an admin's
// edit shows up immediately instead of up to 5 minutes later.
export const getPrivacyNotice = () =>
  request<PrivacyNotice>('/v1/privacy-notice', { auth: false, cache: 'no-cache' })

export const getPrivacySettings = () => request<PrivacySettings>('/v1/settings/privacy')

export const updatePrivacySettings = (body: PrivacySettings) =>
  request<PrivacySettings>('/v1/settings/privacy', { method: 'PUT', body })
