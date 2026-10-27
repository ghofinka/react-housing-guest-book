import { describe, expect, it } from 'vitest'
import { formatDateTime, formatDuration, houseLabel, isFastLane } from './format'

describe('format', () => {
  it('shows instants in WIB regardless of the input offset', () => {
    expect(formatDateTime('2026-10-27T01:30:00Z')).toBe('27 Okt 2026 08:30 WIB')
    expect(formatDateTime('2026-10-27T08:30:00+07:00')).toBe('27 Okt 2026 08:30 WIB')
    expect(formatDateTime(null)).toBe('-')
  })

  it('formats visit durations', () => {
    expect(formatDuration('2026-10-27T01:00:00Z', '2026-10-27T01:45:00Z')).toBe('45 mnt')
    expect(formatDuration('2026-10-27T01:00:00Z', '2026-10-27T03:15:00Z')).toBe('2 jam 15 mnt')
    expect(formatDuration('2026-10-25T01:00:00Z', '2026-10-27T04:00:00Z')).toBe('2 hari 3 jam')
  })

  it('labels houses as block-number', () => {
    expect(houseLabel({ block: 'A', number: '12' })).toBe('A-12')
    expect(houseLabel({ block: '', number: '7' })).toBe('7')
  })

  it('treats only kurir and ojol as the fast lane', () => {
    expect(isFastLane('kurir')).toBe(true)
    expect(isFastLane('ojol')).toBe(true)
    expect(isFastLane('tamu')).toBe(false)
  })
})
