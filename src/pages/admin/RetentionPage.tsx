import { ExperimentOutlined, PlayCircleOutlined, SaveOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Popconfirm,
  Row,
  Skeleton,
  Table,
  Tag,
  type TableColumnsType,
} from 'antd'
import { useEffect, useState } from 'react'
import { runRetention, updateRetention } from '../../api/settings'
import type { RetentionRun, RetentionRunResult } from '../../api/types'
import PageHeader from '../../components/PageHeader'
import QueryError from '../../components/QueryError'
import { keys, useRetention } from '../../hooks/queries'
import { useApiError } from '../../hooks/useApiError'
import { formatDateTime, TRIGGER_LABEL } from '../../utils/format'

interface Values {
  photo_retention_days: number
  personal_data_retention_days: number
}

const runColumns: TableColumnsType<RetentionRun> = [
  { title: 'Mulai', dataIndex: 'started_at', render: formatDateTime },
  { title: 'Selesai', dataIndex: 'finished_at', render: formatDateTime, responsive: ['md'] },
  { title: 'Pemicu', dataIndex: 'trigger', render: (t: RetentionRun['trigger']) => TRIGGER_LABEL[t] },
  {
    title: 'Mode',
    dataIndex: 'dry_run',
    render: (d: boolean) => (d ? <Tag>Uji coba</Tag> : <Tag color="blue">Nyata</Tag>),
  },
  { title: 'Foto dihapus', dataIndex: 'photos_deleted', align: 'right' },
  { title: 'Data dianonimkan', dataIndex: 'records_anonymized', align: 'right' },
  {
    title: 'Hasil',
    dataIndex: 'error',
    render: (e: string | null, r) =>
      e ? <Tag color="error">{e}</Tag> : r.finished_at ? <Tag color="success">OK</Tag> : <Tag>Berjalan</Tag>,
  },
]

/** M9: how long photos and personal data are kept, and the purge job's history. */
export default function RetentionPage() {
  const { data, isLoading, error, refetch } = useRetention()
  const [form] = Form.useForm<Values>()
  const [lastRun, setLastRun] = useState<RetentionRunResult>()
  const qc = useQueryClient()
  const { message } = App.useApp()
  const showError = useApiError()

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        photo_retention_days: data.photo_retention_days,
        personal_data_retention_days: data.personal_data_retention_days,
      })
    }
  }, [data, form])

  const save = useMutation({
    mutationFn: updateRetention,
    onSuccess: (settings) => {
      qc.setQueryData(keys.retention, settings)
      message.success('Kebijakan retensi disimpan.')
    },
    onError: (err) => showError(err, form),
  })

  const run = useMutation({
    mutationFn: runRetention,
    onSuccess: (result) => {
      setLastRun(result)
      qc.invalidateQueries({ queryKey: keys.retention })
      if (!result.dry_run) qc.invalidateQueries({ queryKey: keys.visits })
    },
    onError: (err) => showError(err),
  })

  return (
    <>
      <PageHeader
        title="Retensi Data"
        subtitle="Foto dan data pribadi tamu dihapus/dianonimkan otomatis setelah batas waktu (UU PDP)."
      />
      {error && <QueryError error={error} onRetry={refetch} />}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Batas waktu penyimpanan">
            {isLoading ? (
              <Skeleton active />
            ) : (
              <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)} requiredMark={false}>
                <Form.Item
                  name="photo_retention_days"
                  label="Foto disimpan selama"
                  rules={[{ required: true, type: 'integer', min: 1, max: 365, message: 'Antara 1–365 hari.' }]}
                >
                  <InputNumber min={1} max={365} suffix="hari" style={{ width: 200 }} />
                </Form.Item>
                <Form.Item
                  name="personal_data_retention_days"
                  label="Data pribadi (nama, plat, keterangan) disimpan selama"
                  dependencies={['photo_retention_days']}
                  rules={[
                    { required: true, type: 'integer', min: 1, max: 1095, message: 'Antara 1–1095 hari.' },
                    ({ getFieldValue }) => ({
                      validator: (_, value) =>
                        value == null || value >= getFieldValue('photo_retention_days')
                          ? Promise.resolve()
                          : Promise.reject(new Error('Tidak boleh lebih singkat dari masa simpan foto.')),
                    }),
                  ]}
                >
                  <InputNumber min={1} max={1095} suffix="hari" style={{ width: 200 }} />
                </Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={save.isPending}>
                  Simpan
                </Button>
              </Form>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Jalankan penghapusan">
            <p>
              Penghapusan berjalan otomatis setiap hari. Jalankan uji coba untuk melihat berapa data yang akan
              terhapus tanpa menghapus apa pun.
            </p>
            <Row gutter={8}>
              <Col>
                <Button
                  icon={<ExperimentOutlined />}
                  onClick={() => run.mutate(true)}
                  loading={run.isPending && run.variables === true}
                >
                  Uji coba
                </Button>
              </Col>
              <Col>
                <Popconfirm
                  title="Jalankan penghapusan sekarang?"
                  description="Foto dan data yang melewati batas waktu akan dihapus permanen."
                  okText="Jalankan"
                  okButtonProps={{ danger: true }}
                  cancelText="Batal"
                  onConfirm={() => run.mutate(false)}
                >
                  <Button danger icon={<PlayCircleOutlined />} loading={run.isPending && run.variables === false}>
                    Jalankan sekarang
                  </Button>
                </Popconfirm>
              </Col>
            </Row>
            {lastRun && (
              <Alert
                style={{ marginTop: 16 }}
                type={lastRun.files_failed ? 'warning' : lastRun.dry_run ? 'info' : 'success'}
                showIcon
                title={lastRun.dry_run ? 'Hasil uji coba' : 'Penghapusan selesai'}
                description={
                  <>
                    {lastRun.photos_deleted} foto {lastRun.dry_run ? 'akan dihapus' : 'dihapus'},{' '}
                    {lastRun.records_anonymized} data {lastRun.dry_run ? 'akan dianonimkan' : 'dianonimkan'}.
                    {lastRun.files_failed > 0 && ` ${lastRun.files_failed} berkas gagal dihapus.`}
                  </>
                }
              />
            )}
          </Card>
        </Col>
      </Row>
      <Card title="Riwayat penghapusan" style={{ marginTop: 16 }}>
        <Table<RetentionRun>
          rowKey="id"
          columns={runColumns}
          dataSource={data?.recent_runs}
          loading={isLoading}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: 'Belum pernah dijalankan.' }}
        />
      </Card>
    </>
  )
}
