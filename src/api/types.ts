// Shapes returned by the Go API (go-housing-guest-book). Field names match the JSON exactly.

export type Role = 'guard' | 'owner' | 'admin'
export type Category = 'tamu' | 'kurir' | 'ojol' | 'tukang' | 'keluarga' | 'lainnya'
export type VisitStatus = 'inside' | 'exited'

export interface AuthUser {
  id: string
  name: string
  role: Role
  house_id: string | null
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: 'Bearer'
  expires_in: number
  user: AuthUser
}

export interface Page<T> {
  data: T[]
  next_cursor: string | null
}

export interface HouseRef {
  id: string
  block: string
  number: string
}

export interface House extends HouseRef {
  active: boolean
  created_at: string
  updated_at: string
}

export interface Visit {
  id: string
  house: HouseRef
  guest_name: string | null
  category: Category
  purpose_note: string | null
  vehicle_plate: string | null
  checkin_at: string
  checkin_by: string | null
  checkout_at: string | null
  checkout_by: string | null
  status: VisitStatus
  anonymized: boolean
  vehicle_photo_url: string | null
  face_photo_url: string | null
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  house_id: string | null
  contact: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface AuditEntry {
  id: number
  user_id: string | null
  user_name: string | null
  action: string
  target: string
  created_at: string
}

export type RetentionTrigger = 'schedule' | 'manual' | 'cli'

export interface RetentionRun {
  id: number
  started_at: string
  finished_at: string | null
  trigger: RetentionTrigger
  dry_run: boolean
  photos_deleted: number
  records_anonymized: number
  error: string | null
}

export interface RetentionSettings {
  photo_retention_days: number
  personal_data_retention_days: number
  recent_runs: RetentionRun[]
}

export interface RetentionRunResult {
  run_id: number
  dry_run: boolean
  photos_deleted: number
  records_anonymized: number
  files_failed: number
}

export interface PrivacyNotice {
  title: string
  updated_at: string
  retention: { photo_days: number; personal_data_days: number }
  contact: string
  sections: { heading: string; items: string[] }[]
}

export interface PrivacySettings {
  contact: string
  extra_note: string
}
