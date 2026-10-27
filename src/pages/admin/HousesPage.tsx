import { EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App, Button, Flex, Form, Input, Modal, Switch, Table, type TableColumnsType } from 'antd'
import { useMemo, useState } from 'react'
import { createHouse, updateHouse } from '../../api/houses'
import type { House } from '../../api/types'
import PageHeader from '../../components/PageHeader'
import QueryError from '../../components/QueryError'
import { useHouses } from '../../hooks/queries'
import { useApiError } from '../../hooks/useApiError'
import { formatDate, houseLabel } from '../../utils/format'

interface Values {
  block: string
  number: string
}

/** M10: house master data. Houses are deactivated, never deleted (visits reference them). */
export default function HousesPage() {
  const [showInactive, setShowInactive] = useState(false)
  const [query, setQuery] = useState('')
  // Kept after close so the modal doesn't change content during its close animation.
  const [editing, setEditing] = useState<House | 'new'>('new')
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm<Values>()
  const { data, isLoading, error, refetch } = useHouses(showInactive)
  const qc = useQueryClient()
  const { message } = App.useApp()
  const showError = useApiError()

  const invalidate = () => qc.invalidateQueries({ queryKey: ['houses'] })

  const save = useMutation({
    mutationFn: (v: Values) =>
      editing !== 'new' ? updateHouse(editing.id, v) : createHouse(v),
    onSuccess: (h) => {
      message.success(`Rumah ${houseLabel(h)} disimpan.`)
      setModalOpen(false)
      invalidate()
    },
    onError: (err) => showError(err, form),
  })

  const toggle = useMutation({
    mutationFn: (h: House) => updateHouse(h.id, { active: !h.active }),
    onSuccess: (h) => {
      message.success(`Rumah ${houseLabel(h)} ${h.active ? 'diaktifkan' : 'dinonaktifkan'}.`)
      invalidate()
    },
    onError: (err) => showError(err),
  })

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? (data ?? []).filter((h) => houseLabel(h).toLowerCase().includes(q)) : (data ?? [])
  }, [data, query])

  const open = (target: House | 'new') => {
    form.setFieldsValue(target === 'new' ? { block: '', number: '' } : { block: target.block, number: target.number })
    setEditing(target)
    setModalOpen(true)
  }

  const columns: TableColumnsType<House> = [
    { title: 'Rumah', key: 'label', render: (_, h) => <strong>{houseLabel(h)}</strong> },
    { title: 'Blok', dataIndex: 'block' },
    { title: 'Nomor', dataIndex: 'number' },
    {
      title: 'Aktif',
      dataIndex: 'active',
      render: (_, h) => (
        <Switch
          checked={h.active}
          loading={toggle.isPending && toggle.variables?.id === h.id}
          onChange={() => toggle.mutate(h)}
        />
      ),
    },
    { title: 'Diubah', dataIndex: 'updated_at', render: formatDate, responsive: ['md'] },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, h) => (
        <Button icon={<EditOutlined />} onClick={() => open(h)}>
          Ubah
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Rumah"
        subtitle="Daftar nomor rumah yang bisa dipilih satpam saat mencatat tamu."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => open('new')}>
            Tambah rumah
          </Button>
        }
      />
      <Flex gap={12} wrap align="center" style={{ marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Cari rumah"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        <Flex gap={8} align="center">
          <Switch checked={showInactive} onChange={setShowInactive} />
          Tampilkan yang nonaktif
        </Flex>
      </Flex>
      {error && <QueryError error={error} onRetry={refetch} />}
      <Table<House>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        pagination={{ pageSize: 50, hideOnSinglePage: true }}
        scroll={{ x: 'max-content' }}
      />
      <Modal
        open={modalOpen}
        title={editing === 'new' ? 'Tambah rumah' : 'Ubah rumah'}
        okText="Simpan"
        cancelText="Batal"
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        onCancel={() => setModalOpen(false)}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)} requiredMark={false}>
          <Form.Item
            name="block"
            label="Blok"
            normalize={(v?: string) => v?.toUpperCase()}
            rules={[{ max: 20, message: 'Maksimal 20 karakter.' }]}
          >
            <Input placeholder="mis. A" />
          </Form.Item>
          <Form.Item
            name="number"
            label="Nomor"
            rules={[
              { required: true, whitespace: true, message: 'Isi nomor rumah.' },
              { max: 20, message: 'Maksimal 20 karakter.' },
            ]}
          >
            <Input placeholder="mis. 12" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
