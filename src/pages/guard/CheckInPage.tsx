import { LoginOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, App, Button, Card, Col, Form, Input, Radio, Row, Select, Typography } from 'antd'
import { useMemo, useRef } from 'react'
import { Link } from 'react-router'
import type { Category } from '../../api/types'
import { checkIn } from '../../api/visits'
import PageHeader from '../../components/PageHeader'
import PhotoCapture from '../../components/PhotoCapture'
import QueryError from '../../components/QueryError'
import { keys, useHouses } from '../../hooks/queries'
import { useApiError } from '../../hooks/useApiError'
import { CATEGORIES, CATEGORY_LABEL, formatTime, houseLabel, isFastLane } from '../../utils/format'
import { uuid } from '../../utils/uuid'

interface Values {
  category?: Category
  house_id?: string
  guest_name?: string
  vehicle_plate?: string
  vehicle_photo?: File | null
  face_photo?: File | null
  purpose_note?: string
}

/** Plates are stored upper-case, letters/digits/spaces only. */
const normalizePlate = (v?: string) => (v ?? '').toUpperCase().replace(/[^A-Z0-9 ]/g, '')

/** M1/M2/M4: guard records a guest at the gate. Entry time is set by the server. */
export default function CheckInPage() {
  const [form] = Form.useForm<Values>()
  const { message } = App.useApp()
  const showError = useApiError()
  const qc = useQueryClient()
  const houses = useHouses()
  const category = Form.useWatch('category', form)
  const fastLane = isFastLane(category)

  // Idempotency key: kept across retries of the same guest so a resubmit after
  // a dropped connection doesn't create a duplicate visit; renewed after success.
  const requestId = useRef(uuid())

  const houseOptions = useMemo(
    () => houses.data?.map((h) => ({ value: h.id, label: houseLabel(h) })) ?? [],
    [houses.data],
  )

  const submit = useMutation({
    mutationFn: (v: Values) => {
      const fast = isFastLane(v.category)
      return checkIn({
        client_request_id: requestId.current,
        house_id: v.house_id!,
        category: v.category!,
        guest_name: fast ? undefined : v.guest_name?.trim() || undefined,
        vehicle_plate: v.vehicle_plate?.trim() || undefined,
        purpose_note: v.purpose_note?.trim() || undefined,
        vehicle_photo: v.vehicle_photo,
        face_photo: fast ? null : v.face_photo,
      })
    },
    onSuccess: (visit) => {
      requestId.current = uuid()
      form.resetFields()
      qc.invalidateQueries({ queryKey: keys.visits })
      const who = visit.guest_name ?? CATEGORY_LABEL[visit.category]
      message.success(`${who} ke ${houseLabel(visit.house)} tercatat masuk pukul ${formatTime(visit.checkin_at)}.`)
    },
    onError: (err) => showError(err, form),
  })

  return (
    <>
      <PageHeader title="Catat Tamu Masuk" subtitle="Waktu masuk dan petugas dicatat otomatis." />
      {houses.error && <QueryError error={houses.error} onRetry={houses.refetch} />}
      <Card>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={(v) => submit.mutate(v)}
          disabled={submit.isPending}
        >
          <Form.Item name="category" label="Kategori" rules={[{ required: true, message: 'Pilih kategori.' }]}>
            <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
              <Row gutter={[8, 8]}>
                {CATEGORIES.map((c) => (
                  <Col xs={8} md={4} key={c}>
                    <Radio.Button
                      value={c}
                      style={{ width: '100%', height: 56, lineHeight: '54px', textAlign: 'center', fontSize: 16 }}
                    >
                      {CATEGORY_LABEL[c]}
                    </Radio.Button>
                  </Col>
                ))}
              </Row>
            </Radio.Group>
          </Form.Item>

          {fastLane && (
            <Alert
              type="info"
              showIcon
              title="Jalur cepat kurir/ojol: nama dan foto wajah tidak diperlukan."
              style={{ marginBottom: 16 }}
            />
          )}

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="house_id" label="Rumah tujuan" rules={[{ required: true, message: 'Pilih rumah tujuan.' }]}>
                <Select
                  showSearch={{ optionFilterProp: 'label' }}
                  placeholder="Cari nomor rumah, mis. A-12"
                  options={houseOptions}
                  loading={houses.isLoading}
                  notFoundContent="Rumah tidak ditemukan"
                />
              </Form.Item>
            </Col>
            {!fastLane && (
              <Col xs={24} md={12}>
                <Form.Item
                  name="guest_name"
                  label="Nama tamu"
                  rules={[
                    { required: true, whitespace: true, message: 'Isi nama tamu.' },
                    { max: 100, message: 'Maksimal 100 karakter.' },
                  ]}
                >
                  <Input placeholder="Nama tamu" autoComplete="off" />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} md={12}>
              <Form.Item
                name="vehicle_plate"
                label="Plat nomor"
                extra="Kosongkan jika tamu berjalan kaki."
                normalize={normalizePlate}
              >
                <Input placeholder="B 1234 XYZ" maxLength={12} className="mono" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="purpose_note" label="Keterangan (opsional)" rules={[{ max: 200, message: 'Maksimal 200 karakter.' }]}>
                <Input placeholder="mis. antar paket, servis AC" maxLength={200} autoComplete="off" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="vehicle_photo"
                label="Foto kendaraan / plat"
                dependencies={['vehicle_plate']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator: (_, value) =>
                      getFieldValue('vehicle_plate') && !value
                        ? Promise.reject(new Error('Foto kendaraan wajib jika ada plat nomor.'))
                        : Promise.resolve(),
                  }),
                ]}
              >
                <PhotoCapture label="Ambil foto kendaraan" capture="environment" id="vehicle_photo" />
              </Form.Item>
            </Col>
            {!fastLane && (
              <Col xs={24} md={12}>
                <Form.Item name="face_photo" label="Foto wajah (sesuai kebijakan cluster)">
                  <PhotoCapture label="Ambil foto wajah" capture="user" id="face_photo" />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Button
            type="primary"
            htmlType="submit"
            block
            icon={<LoginOutlined />}
            loading={submit.isPending}
            style={{ height: 56, fontSize: 18 }}
          >
            Catat Masuk
          </Button>
        </Form>
      </Card>
      <Typography.Paragraph type="secondary" style={{ marginTop: 12, fontSize: 13 }}>
        Data tamu dicatat untuk keamanan cluster, hanya dapat dilihat petugas, pengurus, dan pemilik rumah tujuan,
        serta dihapus otomatis sesuai kebijakan retensi. <Link to="/privasi">Pemberitahuan privasi</Link>
      </Typography.Paragraph>
    </>
  )
}
