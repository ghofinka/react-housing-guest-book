import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/id'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import type { Category, HouseRef, RetentionTrigger, Role, VisitStatus } from '../api/types'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('id')

export const TZ = 'Asia/Jakarta'

export const toWib = (iso: string) => dayjs(iso).tz(TZ)

export const formatDateTime = (iso?: string | null) =>
  iso ? `${toWib(iso).format('DD MMM YYYY HH:mm')} WIB` : '-'

export const formatTime = (iso?: string | null) => (iso ? toWib(iso).format('HH:mm') : '-')

export const formatDate = (iso?: string | null) => (iso ? toWib(iso).format('DD MMM YYYY') : '-')

/** "2 jam 15 mnt" between two instants (default: until now). */
export function formatDuration(fromIso: string, toIso?: string | null, now: Dayjs = dayjs()): string {
  const end = toIso ? dayjs(toIso) : now
  const minutes = Math.max(0, end.diff(dayjs(fromIso), 'minute'))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  if (days > 0) return `${days} hari ${hours} jam`
  if (hours > 0) return `${hours} jam ${mins} mnt`
  return `${mins} mnt`
}

/** Date filter param for the API: the picked calendar day, read as a WIB day. */
export const toDateParam = (d?: Dayjs | null) => (d ? d.format('YYYY-MM-DD') : undefined)

export const CATEGORY_LABEL: Record<Category, string> = {
  tamu: 'Tamu',
  kurir: 'Kurir',
  ojol: 'Ojol',
  tukang: 'Tukang',
  keluarga: 'Keluarga',
  lainnya: 'Lainnya',
}

export const CATEGORY_COLOR: Record<Category, string> = {
  tamu: 'blue',
  kurir: 'orange',
  ojol: 'green',
  tukang: 'purple',
  keluarga: 'magenta',
  lainnya: 'default',
}

export const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[]

/** Courier/ojol fast lane: no guest name or face photo needed (S1). */
export const isFastLane = (c?: Category | null) => c === 'kurir' || c === 'ojol'

export const ROLE_LABEL: Record<Role, string> = {
  guard: 'Satpam',
  owner: 'Pemilik Rumah',
  admin: 'Admin',
}

export const ROLE_COLOR: Record<Role, string> = {
  guard: 'geekblue',
  owner: 'green',
  admin: 'volcano',
}

export const STATUS_LABEL: Record<VisitStatus, string> = {
  inside: 'Di dalam',
  exited: 'Sudah keluar',
}

export const TRIGGER_LABEL: Record<RetentionTrigger, string> = {
  schedule: 'Terjadwal',
  manual: 'Manual',
  cli: 'CLI',
}

export const houseLabel = (h?: Pick<HouseRef, 'block' | 'number'> | null) =>
  h ? [h.block, h.number].filter(Boolean).join('-') : '-'

export const shortId = (id?: string | null) => (id ? id.slice(0, 8) : '-')
