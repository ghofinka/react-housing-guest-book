import { Button, Card, Descriptions, Form, Input } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { changePassword } from '../api/auth'
import { tokenStore } from '../api/tokens'
import { useAuth } from '../auth/useAuth'
import PageHeader from '../components/PageHeader'
import { RoleTag } from '../components/Tags'
import { useApiError } from '../hooks/useApiError'

interface Values {
  current_password: string
  new_password: string
  confirm: string
}

export default function AccountPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm<Values>()
  const [saving, setSaving] = useState(false)
  const showError = useApiError()

  const onFinish = async (v: Values) => {
    setSaving(true)
    try {
      await changePassword(v.current_password, v.new_password)
      // The server revoked every session, including this one.
      tokenStore.clear()
      navigate('/login', {
        replace: true,
        state: { notice: 'Kata sandi diubah. Silakan masuk dengan kata sandi baru.' },
      })
    } catch (err) {
      showError(err, form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Akun Saya" />
      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Nama">{user?.name}</Descriptions.Item>
          <Descriptions.Item label="Peran">{user && <RoleTag role={user.role} />}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="Ubah kata sandi" style={{ maxWidth: 520 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="current_password" label="Kata sandi saat ini" rules={[{ required: true, message: 'Wajib diisi.' }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="Kata sandi baru"
            extra="Minimal 10 karakter."
            rules={[
              { required: true, message: 'Wajib diisi.' },
              { min: 10, max: 128, message: 'Panjang 10–128 karakter.' },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Ulangi kata sandi baru"
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Wajib diisi.' },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || value === getFieldValue('new_password')
                    ? Promise.resolve()
                    : Promise.reject(new Error('Kata sandi tidak sama.')),
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>
            Simpan kata sandi
          </Button>
        </Form>
      </Card>
    </>
  )
}
