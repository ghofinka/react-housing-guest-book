import { DeleteOutlined, LogoutOutlined } from '@ant-design/icons'
import { Alert, App, Button, Descriptions, Drawer, Flex, Grid, Popconfirm, Result, Skeleton, Typography } from 'antd'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { useCheckOut, useErasePersonalData } from '../hooks/mutations'
import { useUserDirectory, useVisit } from '../hooks/queries'
import { useApiError } from '../hooks/useApiError'
import { formatDateTime, formatDuration, houseLabel, shortId } from '../utils/format'
import AuthImage from './AuthImage'
import { CategoryTag, StatusTag } from './Tags'

interface Props {
  visitId?: string
  onClose: () => void
}

export default function VisitDetailDrawer({ visitId, onClose }: Props) {
  const { user } = useAuth()
  const screens = Grid.useBreakpoint()
  const { message } = App.useApp()
  const showError = useApiError()
  const { data: visit, isLoading, error } = useVisit(visitId)
  const isAdmin = user?.role === 'admin'
  const isGuard = user?.role === 'guard'
  const { data: users } = useUserDirectory(isAdmin)
  const checkOut = useCheckOut()
  const erase = useErasePersonalData()

  // Guards never see raw account ids; admins see names when resolvable.
  const staffName = (id: string | null) =>
    id ? (users?.find((u) => u.id === id)?.name ?? shortId(id)) : '-'

  const notFound = error instanceof ApiError && error.status === 404

  return (
    <Drawer
      open={!!visitId}
      onClose={onClose}
      title="Detail Kunjungan"
      size={screens.md ? 560 : '100%'}
      destroyOnHidden
    >
      {isLoading && <Skeleton active />}
      {notFound && (
        <Result
          status="404"
          title="Kunjungan tidak ditemukan"
          subTitle="Data tidak ada atau bukan untuk rumah Anda."
        />
      )}
      {error && !notFound && <Alert type="error" showIcon title="Gagal memuat data kunjungan." />}
      {visit && (
        <Flex vertical gap={16}>
          {visit.anonymized && (
            <Alert
              type="info"
              showIcon
              title="Data pribadi kunjungan ini telah dihapus sesuai kebijakan retensi atau permintaan."
            />
          )}
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Tamu">
              {visit.guest_name ?? <Typography.Text type="secondary">-</Typography.Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Rumah tujuan">{houseLabel(visit.house)}</Descriptions.Item>
            <Descriptions.Item label="Kategori">
              <CategoryTag category={visit.category} />
            </Descriptions.Item>
            <Descriptions.Item label="Keterangan">{visit.purpose_note || '-'}</Descriptions.Item>
            <Descriptions.Item label="Plat nomor">
              <span className="mono">{visit.vehicle_plate || '-'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <StatusTag status={visit.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Masuk">{formatDateTime(visit.checkin_at)}</Descriptions.Item>
            <Descriptions.Item label="Keluar">{formatDateTime(visit.checkout_at)}</Descriptions.Item>
            <Descriptions.Item label="Lama kunjungan">
              {formatDuration(visit.checkin_at, visit.checkout_at)}
            </Descriptions.Item>
            {isAdmin && (
              <>
                <Descriptions.Item label="Petugas masuk">{staffName(visit.checkin_by)}</Descriptions.Item>
                <Descriptions.Item label="Petugas keluar">{staffName(visit.checkout_by)}</Descriptions.Item>
              </>
            )}
          </Descriptions>

          {(visit.vehicle_photo_url || visit.face_photo_url) && (
            <div>
              <Typography.Title level={5}>Foto bukti</Typography.Title>
              <Flex gap={12} wrap>
                {visit.vehicle_photo_url && (
                  <Flex vertical gap={4}>
                    <Typography.Text type="secondary">Kendaraan / plat</Typography.Text>
                    <AuthImage path={visit.vehicle_photo_url} alt="Foto kendaraan" />
                  </Flex>
                )}
                {visit.face_photo_url && (
                  <Flex vertical gap={4}>
                    <Typography.Text type="secondary">Wajah</Typography.Text>
                    <AuthImage path={visit.face_photo_url} alt="Foto wajah" />
                  </Flex>
                )}
              </Flex>
            </div>
          )}

          {isGuard && visit.status === 'inside' && (
            <Popconfirm
              title="Catat tamu keluar sekarang?"
              okText="Ya, keluar"
              cancelText="Batal"
              onConfirm={() =>
                checkOut.mutateAsync(visit.id).then(
                  () => message.success('Waktu keluar tercatat.'),
                  (err) => showError(err),
                )
              }
            >
              <Button type="primary" size="large" icon={<LogoutOutlined />} block loading={checkOut.isPending}>
                Keluar
              </Button>
            </Popconfirm>
          )}

          {isAdmin && !visit.anonymized && (
            <Popconfirm
              title="Hapus data pribadi tamu ini?"
              description="Nama, plat, keterangan, dan foto dihapus permanen. Tindakan ini tercatat di audit log."
              okText="Hapus"
              okButtonProps={{ danger: true }}
              cancelText="Batal"
              onConfirm={() =>
                erase.mutateAsync(visit.id).then(
                  () => message.success('Data pribadi telah dihapus.'),
                  (err) => showError(err),
                )
              }
            >
              <Button danger icon={<DeleteOutlined />} loading={erase.isPending}>
                Hapus data pribadi (atas permintaan)
              </Button>
            </Popconfirm>
          )}
        </Flex>
      )}
    </Drawer>
  )
}
