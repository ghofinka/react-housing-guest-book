import { request } from './client'
import type { House } from './types'

export const listHouses = (includeInactive = false) =>
  request<{ data: House[] }>('/v1/houses', {
    query: { include_inactive: includeInactive || undefined },
  }).then((r) => r.data)

export const createHouse = (body: { block: string; number: string }) =>
  request<House>('/v1/houses', { method: 'POST', body })

export const updateHouse = (id: string, body: Partial<Pick<House, 'block' | 'number' | 'active'>>) =>
  request<House>(`/v1/houses/${id}`, { method: 'PATCH', body })
