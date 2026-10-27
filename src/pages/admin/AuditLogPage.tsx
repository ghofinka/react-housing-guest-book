import { FilterOutlined } from '@ant-design/icons'
import { Button, DatePicker, Flex, Form, Input, Select, Table, Tag, Typography, type TableColumnsType } from 'antd'
import type { Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import type { AuditFilters } from '../../api/settings'
import type { AuditEntry } from '../../api/types'
import PageHeader from '../../components/PageHeader'
import QueryError from '../../components/QueryError'
import { useAuditPages, useUserDirectory } from '../../hooks/queries'
import { formatDateTime, ROLE_LABEL, shortId, toDateParam } from '../../utils/format'

interface FilterValues {
  user_id?: string
  action?: string
  target?: string
  range?: [Dayjs | null, Dayjs | null] | null
}

const columns: TableColumnsType<AuditEntry> = [
  { title: 'Waktu', dataIndex: 'created_at', render: formatDateTime, width: 190 },
  {
    title: 'Pengguna',
    key: 'user',
    render: (_, e) =>
      e.user_name ?? (e.user_id ? shortId(e.user_id) : <Typography.Text type="secondary">Sistem</Typography.Text>),
  },
  { title: 'Aksi', dataIndex: 'action', render: (a: string) => <Tag>{a}</Tag> },
  { title: 'Target', dataIndex: 'target', render: (t: string) => <span className="mono">{t}</span> },
]

/** M11: read-only record of who viewed, changed, or deleted data. */
export default function AuditLogPage() {
  const [form] = Form.useForm<FilterValues>()
  const [filters, setFilters] = useState<AuditFilters>({})
  const users = useUserDirectory()
  const { data, isLoading, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = useAuditPages(filters)
  const rows = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data])

  const apply = (v: FilterValues) =>
    setFilters({
      user_id: v.user_id,
      action: v.action?.trim() || undefined,
      target: v.target?.trim() || undefined,
      from: toDateParam(v.range?.[0]),
      to: toDateParam(v.range?.[1]),
    })

  return (
    <>
      <PageHeader title="Audit Log" subtitle="Catatan siapa melihat, mengubah, atau menghapus data. Tidak dapat diubah." />
      <Form form={form} layout="inline" onFinish={apply} style={{ marginBottom: 16, rowGap: 12 }}>
        <Form.Item name="user_id">
          <Select
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="Semua pengguna"
            loading={users.isLoading}
            options={users.data?.map((u) => ({ value: u.id, label: `${u.name} (${ROLE_LABEL[u.role]})` }))}
            style={{ minWidth: 220 }}
          />
        </Form.Item>
        <Form.Item name="action">
          <Input allowClear placeholder="Aksi, mis. photo_viewed" />
        </Form.Item>
        <Form.Item name="target">
          <Input allowClear placeholder="Target (awalan), mis. visit:" />
        </Form.Item>
        <Form.Item name="range">
          <DatePicker.RangePicker format="DD MMM YYYY" allowEmpty={[true, true]} placeholder={['Dari', 'Sampai']} />
        </Form.Item>
        <Flex gap={8}>
          <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>
            Terapkan
          </Button>
          <Button
            onClick={() => {
              form.resetFields()
              setFilters({})
            }}
          >
            Reset
          </Button>
        </Flex>
      </Form>
      {error && <QueryError error={error} onRetry={refetch} />}
      <Table<AuditEntry>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Tidak ada catatan.' }}
      />
      {hasNextPage && (
        <Flex justify="center" style={{ marginTop: 16 }}>
          <Button onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
            Muat lebih banyak
          </Button>
        </Flex>
      )}
    </>
  )
}
