import { request } from './client'
import type { Page, Role, User } from './types'

export const listUsers = (filters: { role?: Role; house_id?: string; cursor?: string; limit?: number }) =>
  request<Page<User>>('/v1/users', { query: { ...filters } })

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role: Role
  /** Required for owners, must be absent for other roles. */
  house_id?: string
  contact?: string
}

export const createUser = (body: CreateUserInput) =>
  request<User>('/v1/users', { method: 'POST', body })

/** Role and email cannot be changed. */
export interface UpdateUserInput {
  name?: string
  contact?: string
  house_id?: string
  active?: boolean
  password?: string
}

export const updateUser = (id: string, body: UpdateUserInput) =>
  request<User>(`/v1/users/${id}`, { method: 'PATCH', body })
