import { Button, DatePicker, Flex, Segmented, Select, Table, Typography, type TableColumnsType } from 'antd'
import type { Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Visit, VisitStatus } from '../api/types'
import type { VisitFilters } from '../api/visits'
import { useAuth } from '../auth/useAuth'
import PageHeader from '../components/PageHeader'
import QueryError from '../components/QueryError'
import { CategoryTag, StatusTag } from '../components/Tags'
import VisitDetailDrawer from '../components/VisitDetailDrawer'
import { useHouses, useVisitPages } from '../hooks/queries'
import { formatDateTime, houseLabel, toDateParam } from '../utils/format'

type StatusFilter = 'all' | VisitStatus

const columns: TableColumnsType<Visit> = [
  { title: 'Masuk', dataIndex: 'checkin_at', render: formatDateTime, width: 180 },
  {
    title: 'Tamu',
    key: 'guest',
    render: (_, v) =>
      v.anonymized ? (
        <Typography.Text type="secondary" italic>
          Data dihapus (retensi)
        </Typography.Text>
      ) : (
        (v.guest_name ?? <Typography.Text type="secondary">-</Typography.Text>)
      ),
  },
  { title: 'Rumah', key: 'house', render: (_, v) => houseLabel(v.house), width: 100 },
  { title: 'Kategori', dataIndex: 'category', render: (c) => <CategoryTag category={c} />, width: 110 },
  {
    title: 'Plat',
    dataIndex: 'vehicle_plate',
    render: (p) => <span className="mono">{p || '-'}</span>,
    responsive: ['md'],
    width: 130,
  },
  { title: 'Keluar', dataIndex: 'checkout_at', render: formatDateTime, responsive: ['lg'], width: 180 },
  { title: 'Status', dataIndex: 'status', render: (s) => <StatusTag status={s} />, width: 120 },
]

/**
 * M7: visit history. Shared by guards/admins (all houses) and owners — for
 * owners the server forces house_id to their own house (M6), so the house
 * filter is hidden and a direct link to another house's visit returns 404.
 */
export default function VisitHistoryPage() {
  const { user } = useAuth()
  const isOwner = user?.role === 'owner'
  const { visitId } = useParams()
  const navigate = useNavigate()

  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [houseId, setHouseId] = useState<string>()
  const houses = useHouses(false, !isOwner)

  const filters = useMemo<VisitFilters>(
    () => ({
      status: status === 'all' ? undefined : status,
      house_id: isOwner ? undefined : houseId,
      from: toDateParam(range?.[0]),
      to: toDateParam(range?.[1]),
    }),
    [status, houseId, range, isOwner],
  )
  const { data, error, refetch, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useVisitPages(filters)
  const rows = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data])

  return (
    <>
      <PageHeader
        title={isOwner ? 'Tamu Rumah Saya' : 'Riwayat Tamu'}
        subtitle={isOwner ? 'Hanya tamu yang tercatat menuju rumah Anda.' : 'Terbaru di atas.'}
      />
      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        <DatePicker.RangePicker
          value={range}
          onChange={(v) => setRange(v)}
          format="DD MMM YYYY"
          placeholder={['Dari tanggal', 'Sampai tanggal']}
          allowEmpty={[true, true]}
        />
        <Segmented<StatusFilter>
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'Semua' },
            { value: 'inside', label: 'Di dalam' },
            { value: 'exited', label: 'Sudah keluar' },
          ]}
        />
        {!isOwner && (
          <Select
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="Semua rumah"
            value={houseId}
            onChange={setHouseId}
            options={houses.data?.map((h) => ({ value: h.id, label: houseLabel(h) }))}
            loading={houses.isLoading}
            style={{ minWidth: 160 }}
          />
        )}
      </Flex>
      {error && <QueryError error={error} onRetry={refetch} />}
      <Table<Visit>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        pagination={false}
        size="middle"
        scroll={{ x: 'max-content' }}
        rowClassName="clickable-row"
        onRow={(v) => ({ onClick: () => navigate(`/riwayat/${v.id}`) })}
        locale={{ emptyText: 'Belum ada kunjungan.' }}
      />
      {hasNextPage && (
        <Flex justify="center" style={{ marginTop: 16 }}>
          <Button onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
            Muat lebih banyak
          </Button>
        </Flex>
      )}
      <VisitDetailDrawer visitId={visitId} onClose={() => navigate('/riwayat')} />
    </>
  )
}
