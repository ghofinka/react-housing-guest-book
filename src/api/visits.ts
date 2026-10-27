import { request, requestBlob } from './client'
import type { Category, Page, Visit, VisitStatus } from './types'

export interface VisitFilters {
  status?: VisitStatus
  house_id?: string
  /** YYYY-MM-DD, WIB calendar day, inclusive. */
  from?: string
  to?: string
}

export const listVisits = (filters: VisitFilters & { cursor?: string; limit?: number }) =>
  request<Page<Visit>>('/v1/visits', { query: { ...filters } })

export const getVisit = (id: string) => request<Visit>(`/v1/visits/${id}`)

export interface CheckInInput {
  client_request_id: string
  house_id: string
  category: Category
  guest_name?: string
  purpose_note?: string
  vehicle_plate?: string
  vehicle_photo?: File | null
  face_photo?: File | null
}

export function checkIn(input: CheckInInput) {
  const { vehicle_photo, face_photo, ...fields } = input
  if (!vehicle_photo && !face_photo) {
    return request<Visit>('/v1/visits', { method: 'POST', body: fields })
  }
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value) form.append(key, value)
  }
  if (vehicle_photo) form.append('vehicle_photo', vehicle_photo)
  if (face_photo) form.append('face_photo', face_photo)
  return request<Visit>('/v1/visits', { method: 'POST', body: form })
}

export const checkOut = (id: string) =>
  request<Visit>(`/v1/visits/${id}/checkout`, { method: 'POST' })

/** Admin: erase a guest's personal data on request. */
export const erasePersonalData = (id: string) =>
  request<Visit>(`/v1/visits/${id}/personal-data`, { method: 'DELETE' })

/** `path` is the relative vehicle_photo_url / face_photo_url from a Visit. */
export const fetchPhoto = (path: string) => requestBlob(path)
