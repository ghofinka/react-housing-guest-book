import { EyeOutlined, SaveOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Col, Flex, Form, Input, QRCode, Row, Skeleton, Typography } from 'antd'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { updatePrivacySettings } from '../../api/settings'
import type { PrivacySettings } from '../../api/types'
import PageHeader from '../../components/PageHeader'
import QueryError from '../../components/QueryError'
import { keys, usePrivacySettings } from '../../hooks/queries'
import { useApiError } from '../../hooks/useApiError'

/** M8: the privacy notice shown in the app and linked from the QR poster at the gate. */
export default function PrivacySettingsPage() {
  const { data, isLoading, error, refetch } = usePrivacySettings()
  const [form] = Form.useForm<PrivacySettings>()
  const qc = useQueryClient()
  const { message } = App.useApp()
  const showError = useApiError()
  const noticeUrl = `${window.location.origin}/privasi`

  useEffect(() => {
    if (data) form.setFieldsValue(data)
  }, [data, form])

  const save = useMutation({
    mutationFn: updatePrivacySettings,
    onSuccess: (settings) => {
      qc.setQueryData(keys.privacySettings, settings)
      qc.invalidateQueries({ queryKey: keys.privacyNotice })
      message.success('Pemberitahuan privasi disimpan.')
    },
    onError: (err) => showError(err, form),
  })

  return (
    <>
      <PageHeader
        title="Pemberitahuan Privasi"
        subtitle="Isi utama (data yang dicatat, tujuan, masa simpan) dibuat otomatis dari pengaturan retensi."
        extra={
          <Link to="/privasi" target="_blank">
            <Button icon={<EyeOutlined />}>Lihat halaman publik</Button>
          </Link>
        }
      />
      {error && <QueryError error={error} onRetry={refetch} />}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Informasi tambahan">
            {isLoading ? (
              <Skeleton active />
            ) : (
              <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
                <Form.Item
                  name="contact"
                  label="Kontak pengelola data"
                  extra="Untuk pertanyaan atau permintaan penghapusan data."
                  rules={[{ max: 200, message: 'Maksimal 200 karakter.' }]}
                >
                  <Input.TextArea rows={2} maxLength={200} showCount placeholder="mis. Pengurus RT 05, WA 0812-xxxx-xxxx" />
                </Form.Item>
                <Form.Item name="extra_note" label="Catatan tambahan" rules={[{ max: 1000, message: 'Maksimal 1000 karakter.' }]}>
                  <Input.TextArea rows={5} maxLength={1000} showCount />
                </Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={save.isPending}>
                  Simpan
                </Button>
              </Form>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="QR untuk poster di pos jaga">
            <Flex vertical align="center" gap={12}>
              <QRCode value={noticeUrl} size={200} />
              <Typography.Text copyable className="mono" style={{ fontSize: 12 }}>
                {noticeUrl}
              </Typography.Text>
            </Flex>
          </Card>
        </Col>
      </Row>
    </>
  )
}
