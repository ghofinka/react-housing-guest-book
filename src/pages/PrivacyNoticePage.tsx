import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Flex, Skeleton, Typography } from 'antd'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import QueryError from '../components/QueryError'
import { usePrivacyNotice } from '../hooks/queries'
import { formatDate } from '../utils/format'

/** Public page (M8): what is recorded, why, and for how long. Target of the gate poster QR. */
export default function PrivacyNoticePage() {
  const { user } = useAuth()
  const { data, isLoading, error, refetch } = usePrivacyNotice()

  return (
    <Flex justify="center" style={{ padding: 16, minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: 760 }}>
        <Link to={user ? '/' : '/login'}>
          <Button type="link" icon={<ArrowLeftOutlined />} style={{ paddingInline: 0, marginBottom: 8 }}>
            {user ? 'Kembali ke aplikasi' : 'Ke halaman masuk'}
          </Button>
        </Link>
        <Card>
          {isLoading && <Skeleton active paragraph={{ rows: 8 }} />}
          {error && <QueryError error={error} onRetry={refetch} />}
          {data && (
            <>
              <Typography.Title level={2} style={{ marginTop: 0 }}>
                {data.title}
              </Typography.Title>
              <Typography.Text type="secondary">Diperbarui {formatDate(data.updated_at)}</Typography.Text>
              <Descriptions column={1} bordered size="small" style={{ margin: '16px 0' }}>
                <Descriptions.Item label="Foto disimpan">{data.retention.photo_days} hari</Descriptions.Item>
                <Descriptions.Item label="Data pribadi disimpan">
                  {data.retention.personal_data_days} hari
                </Descriptions.Item>
                {data.contact && <Descriptions.Item label="Kontak">{data.contact}</Descriptions.Item>}
              </Descriptions>
              {data.sections.map((s) => (
                <section key={s.heading}>
                  <Typography.Title level={4}>{s.heading}</Typography.Title>
                  <ul style={{ paddingInlineStart: 20 }}>
                    {s.items.map((item) => (
                      <li key={item}>
                        <Typography.Text>{item}</Typography.Text>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </>
          )}
        </Card>
      </div>
    </Flex>
  )
}
