import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CheckInPage from './CheckInPage'

vi.mock('../../api/houses', () => ({
  listHouses: vi.fn(async () => [
    { id: 'h1', block: 'A', number: '12', active: true, created_at: '', updated_at: '' },
  ]),
}))

const checkIn = vi.fn()
vi.mock('../../api/visits', () => ({ checkIn: (...args: unknown[]) => checkIn(...args) }))

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AntApp>
        <MemoryRouter>
          <CheckInPage />
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

beforeEach(() => checkIn.mockReset())

describe('CheckInPage', () => {
  it('hides name and face photo for the courier fast lane', async () => {
    const user = userEvent.setup()
    renderPage()
    expect(screen.getByLabelText('Nama tamu')).toBeInTheDocument()

    await user.click(screen.getByText('Kurir'))

    expect(screen.queryByLabelText('Nama tamu')).not.toBeInTheDocument()
    expect(screen.queryByText('Foto wajah (sesuai kebijakan cluster)')).not.toBeInTheDocument()
    expect(screen.getByText(/Jalur cepat kurir\/ojol/)).toBeInTheDocument()
  })

  it('upper-cases the plate and requires a vehicle photo when a plate is entered', async () => {
    const user = userEvent.setup()
    renderPage()

    const plate = screen.getByLabelText('Plat nomor')
    await user.type(plate, 'b 1234-xyz')
    expect(plate).toHaveValue('B 1234XYZ')

    await user.click(screen.getByRole('button', { name: /Catat Masuk/ }))

    expect(await screen.findByText('Foto kendaraan wajib jika ada plat nomor.')).toBeInTheDocument()
    expect(checkIn).not.toHaveBeenCalled()
  })

  it('submits a courier without name, with a stable idempotency key', async () => {
    const user = userEvent.setup()
    checkIn.mockResolvedValue({
      id: 'v1',
      house: { id: 'h1', block: 'A', number: '12' },
      guest_name: null,
      category: 'kurir',
      checkin_at: '2026-10-27T01:30:00Z',
    })
    renderPage()

    await user.click(screen.getByText('Kurir'))
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByTitle('A-12'))
    await user.click(screen.getByRole('button', { name: /Catat Masuk/ }))

    await waitFor(() => expect(checkIn).toHaveBeenCalledTimes(1))
    const input = checkIn.mock.calls[0][0]
    expect(input).toMatchObject({ house_id: 'h1', category: 'kurir', guest_name: undefined })
    expect(input.client_request_id).toMatch(/^[0-9a-f-]{36}$/)
    expect(await screen.findByText(/Kurir ke A-12 tercatat masuk pukul 08:30/)).toBeInTheDocument()
  })
})
