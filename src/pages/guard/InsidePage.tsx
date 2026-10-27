import { CarOutlined, LogoutOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Empty, Flex, Input, Popconfirm, Row, Skeleton, Typography } from 'antd'
import { useMemo, useState } from 'react'
import type { Visit } from '../../api/types'
import PageHeader from '../../components/PageHeader'
import QueryError from '../../components/QueryError'
import { CategoryTag } from '../../components/Tags'
import VisitDetailDrawer from '../../components/VisitDetailDrawer'
import { useCheckOut } from '../../hooks/mutations'
import { useInsideVisits } from '../../hooks/queries'
import { useApiError } from '../../hooks/useApiError'
import { CATEGORY_LABEL, formatDuration, formatTime, houseLabel } from '../../utils/format'

const matches = (v: Visit, q: string) =>
  [v.guest_name, v.vehicle_plate, houseLabel(v.house), CATEGORY_LABEL[v.category]]
    .filter(Boolean)
    .some((s) => s!.toLowerCase().includes(q))

/** M3: guests currently inside, with one-tap check-out. */
export default function InsidePage() {
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useInsideVisits()
  const [query, setQuery] = useState('')
  const [detailId, setDetailId] = useState<string>()
  const checkOut = useCheckOut()
  const { message } = App.useApp()
  const showError = useApiError()

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? (data ?? []).filter((v) => matches(v, q)) : (data ?? [])
  }, [data, query])

  const doCheckOut = (v: Visit) =>
    checkOut.mutateAsync(v.id).then(
      () => message.success(`${v.guest_name ?? CATEGORY_LABEL[v.category]} tercatat keluar.`),
      (err) => showError(err),
    )

  return (
    <>
      <PageHeader
        title={`Tamu di Dalam (${data?.length ?? 0})`}
        subtitle={dataUpdatedAt ? `Diperbarui ${formatTime(new Date(dataUpdatedAt).toISOString())}` : undefined}
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
            Muat ulang
          </Button>
        }
      />
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Cari nama, plat, atau rumah"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      {error && <QueryError error={error} onRetry={refetch} />}
      {isLoading && <Skeleton active />}
      {data && visible.length === 0 && (
        <Empty description={query ? 'Tidak ada yang cocok.' : 'Tidak ada tamu di dalam.'} />
      )}
      <Row gutter={[12, 12]}>
        {visible.map((v) => (
          <Col xs={24} md={12} xl={8} key={v.id}>
            <Card hoverable onClick={() => setDetailId(v.id)} styles={{ body: { padding: 16 } }}>
              <Flex justify="space-between" align="flex-start" gap={8}>
                <div style={{ minWidth: 0 }}>
                  <Typography.Title level={4} style={{ margin: 0 }} ellipsis>
                    {houseLabel(v.house)}
                  </Typography.Title>
                  <Typography.Text strong ellipsis>
                    {v.guest_name ?? CATEGORY_LABEL[v.category]}
                  </Typography.Text>
                </div>
                <CategoryTag category={v.category} />
              </Flex>
              <Flex vertical gap={2} style={{ margin: '8px 0 12px' }}>
                {v.vehicle_plate && (
                  <Typography.Text className="mono">
                    <CarOutlined /> {v.vehicle_plate}
                  </Typography.Text>
                )}
                <Typography.Text type="secondary">
                  Masuk {formatTime(v.checkin_at)} · {formatDuration(v.checkin_at)}
                </Typography.Text>
              </Flex>
              {/* stopPropagation: the button must not also open the detail drawer */}
              <div onClick={(e) => e.stopPropagation()}>
                <Popconfirm
                  title={`Catat ${v.guest_name ?? 'tamu'} keluar?`}
                  okText="Ya, keluar"
                  cancelText="Batal"
                  okButtonProps={{ size: 'large' }}
                  cancelButtonProps={{ size: 'large' }}
                  onConfirm={() => doCheckOut(v)}
                >
                  <Button
                    type="primary"
                    block
                    icon={<LogoutOutlined />}
                    loading={checkOut.isPending && checkOut.variables === v.id}
                    style={{ height: 52, fontSize: 17 }}
                  >
                    Keluar
                  </Button>
                </Popconfirm>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <VisitDetailDrawer visitId={detailId} onClose={() => setDetailId(undefined)} />
    </>
  )
}
