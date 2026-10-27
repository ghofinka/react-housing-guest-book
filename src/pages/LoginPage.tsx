import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Flex, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { login, useAuth } from '../auth/useAuth'
import { homePath } from '../layouts/nav'

interface LocationState {
  from?: string
  notice?: string
}

export default function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const state = (useLocation().state ?? {}) as LocationState
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={state.from ?? homePath(user.role)} replace />

  const onFinish = async ({ email, password }: { email: string; password: string }) => {
    setError(undefined)
    setLoading(true)
    try {
      const u = await login(email.trim(), password)
      navigate(state.from ?? homePath(u.role), { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal masuk. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex justify="center" align="center" style={{ minHeight: '100vh', padding: 16 }}>
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Flex vertical gap={4} style={{ marginBottom: 24, textAlign: 'center' }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Buku Tamu Digital
          </Typography.Title>
          <Typography.Text type="secondary">Masuk dengan akun pribadi Anda</Typography.Text>
        </Flex>
        {state.notice && <Alert type="success" showIcon title={state.notice} style={{ marginBottom: 16 }} />}
        {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
        <Form layout="vertical" size="large" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Masukkan email yang valid.' }]}
          >
            <Input prefix={<MailOutlined />} autoComplete="username" inputMode="email" autoFocus />
          </Form.Item>
          <Form.Item name="password" label="Kata sandi" rules={[{ required: true, message: 'Masukkan kata sandi.' }]}>
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Masuk
          </Button>
        </Form>
        <Typography.Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0, textAlign: 'center' }}>
          <Link to="/privasi">Pemberitahuan privasi</Link>
        </Typography.Paragraph>
      </Card>
    </Flex>
  )
}
