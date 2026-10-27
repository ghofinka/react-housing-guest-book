import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  App,
  Button,
  Flex,
  Form,
  Input,
  Modal,
  Segmented,
  Select,
  Switch,
  Table,
  Typography,
  type TableColumnsType,
} from 'antd'
import { useMemo, useState } from 'react'
import type { Role, User } from '../../api/types'
import { createUser, updateUser, type UpdateUserInput } from '../../api/users'
import { useAuth } from '../../auth/useAuth'
import PageHeader from '../../components/PageHeader'
import QueryError from '../../components/QueryError'
import { ActiveTag, RoleTag } from '../../components/Tags'
import { keys, useHouses, useUserPages } from '../../hooks/queries'
import { useApiError } from '../../hooks/useApiError'
import { houseLabel, ROLE_LABEL } from '../../utils/format'

interface Values {
  name: string
  email?: string
  password?: string
  role: Role
  house_id?: string
  contact?: string
  active?: boolean
}

const ROLES = Object.keys(ROLE_LABEL) as Role[]

/** M5/M10: one account per person; owners are linked to exactly one house. */
export default function UsersPage() {
  const { user: me } = useAuth()
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')
  // Kept after close so the modal doesn't change content during its close animation.
  const [editing, setEditing] = useState<User | 'new'>('new')
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm<Values>()
  const role = Form.useWatch('role', form)
  const qc = useQueryClient()
  const { message } = App.useApp()
  const showError = useApiError()

  const { data, isLoading, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = useUserPages({
    role: roleFilter === 'all' ? undefined : roleFilter,
  })
  const rows = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data])
  const houses = useHouses(true)
  const houseById = useMemo(() => new Map(houses.data?.map((h) => [h.id, h])), [houses.data])
  const houseOptions = houses.data
    ?.filter((h) => h.active)
    .map((h) => ({ value: h.id, label: houseLabel(h) }))

  const isNew = editing === 'new'
  const editingUser = editing !== 'new' ? editing : null
  const isSelf = !!editingUser && editingUser.id === me?.id

  const save = useMutation({
    mutationFn: (v: Values) => {
      if (!editingUser) {
        return createUser({
          name: v.name.trim(),
          email: v.email!.trim(),
          password: v.password!,
          role: v.role,
          house_id: v.role === 'owner' ? v.house_id : undefined,
          contact: v.contact?.trim() || undefined,
        })
      }
      const body: UpdateUserInput = { name: v.name.trim(), contact: v.contact?.trim() ?? '', active: v.active }
      if (editingUser.role === 'owner') body.house_id = v.house_id
      if (v.password) body.password = v.password
      return updateUser(editingUser.id, body)
    },
    onSuccess: (u) => {
      message.success(`Akun ${u.name} disimpan.`)
      setModalOpen(false)
      qc.invalidateQueries({ queryKey: keys.users })
    },
    onError: (err) => showError(err, form),
  })

  const open = (target: User | 'new') => {
    form.resetFields()
    if (target !== 'new') {
      form.setFieldsValue({
        name: target.name,
        role: target.role,
        house_id: target.house_id ?? undefined,
        contact: target.contact ?? '',
        active: target.active,
      })
    }
    setEditing(target)
    setModalOpen(true)
  }

  const columns: TableColumnsType<User> = [
    { title: 'Nama', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email', responsive: ['md'] },
    { title: 'Peran', dataIndex: 'role', render: (r) => <RoleTag role={r} /> },
    {
      title: 'Rumah',
      dataIndex: 'house_id',
      render: (id: string | null) => (id ? houseLabel(houseById.get(id)) : '-'),
    },
    { title: 'Kontak', dataIndex: 'contact', render: (c) => c || '-', responsive: ['lg'] },
    { title: 'Status', dataIndex: 'active', render: (a) => <ActiveTag active={a} /> },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, u) => (
        <Button icon={<EditOutlined />} onClick={() => open(u)}>
          Ubah
        </Button>
      ),
    },
  ]

  const ownerSelected = (isNew ? role : editingUser?.role) === 'owner'

  return (
    <>
      <PageHeader
        title="Pengguna"
        subtitle="Akun satpam, pemilik rumah, dan admin. Gunakan satu akun per orang."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => open('new')}>
            Tambah pengguna
          </Button>
        }
      />
      <Segmented
        value={roleFilter}
        onChange={(v) => setRoleFilter(v as Role | 'all')}
        options={[{ value: 'all', label: 'Semua' }, ...ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))]}
        style={{ marginBottom: 16 }}
      />
      {error && <QueryError error={error} onRetry={refetch} />}
      <Table<User>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
      {hasNextPage && (
        <Flex justify="center" style={{ marginTop: 16 }}>
          <Button onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
            Muat lebih banyak
          </Button>
        </Flex>
      )}

      <Modal
        open={modalOpen}
        title={isNew ? 'Tambah pengguna' : 'Ubah pengguna'}
        okText="Simpan"
        cancelText="Batal"
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        onCancel={() => setModalOpen(false)}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)} requiredMark={false}>
          <Form.Item name="name" label="Nama" rules={[{ required: true, whitespace: true, message: 'Isi nama.' }, { max: 100 }]}>
            <Input />
          </Form.Item>
          {isNew ? (
            <>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email tidak valid.' }]}>
                <Input autoComplete="off" />
              </Form.Item>
              <Form.Item name="role" label="Peran" rules={[{ required: true, message: 'Pilih peran.' }]}>
                <Select options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} />
              </Form.Item>
            </>
          ) : (
            editingUser && (
              <Typography.Paragraph type="secondary">
                {editingUser.email} · {ROLE_LABEL[editingUser.role]} (email dan peran tidak dapat diubah)
              </Typography.Paragraph>
            )
          )}
          {ownerSelected && (
            <Form.Item name="house_id" label="Rumah" rules={[{ required: true, message: 'Pemilik harus terhubung ke rumah.' }]}>
              <Select showSearch={{ optionFilterProp: 'label' }} options={houseOptions} loading={houses.isLoading} />
            </Form.Item>
          )}
          <Form.Item name="contact" label="Kontak (opsional)" rules={[{ max: 50, message: 'Maksimal 50 karakter.' }]}>
            <Input placeholder="No. HP / WhatsApp" />
          </Form.Item>
          <Form.Item
            name="password"
            label={isNew ? 'Kata sandi awal' : 'Atur ulang kata sandi (opsional)'}
            extra={isNew ? 'Minimal 10 karakter.' : 'Kosongkan jika tidak diubah. Sesi pengguna akan diakhiri.'}
            rules={[{ required: isNew, message: 'Isi kata sandi.' }, { min: 10, max: 128, message: 'Panjang 10–128 karakter.' }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          {!isNew && (
            <Form.Item
              name="active"
              label="Akun aktif"
              valuePropName="checked"
              extra={
                isSelf
                  ? 'Anda tidak dapat menonaktifkan akun sendiri.'
                  : 'Menonaktifkan akun langsung mengakhiri sesinya.'
              }
            >
              <Switch disabled={isSelf} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  )
}
