import { ClockCircleOutlined } from '@ant-design/icons'
import { Button, Result, Tag } from 'antd'
import { Link, useParams } from 'react-router'
import { COMING_SOON } from '../layouts/nav'
import NotFoundPage from './NotFoundPage'

export default function ComingSoonPage() {
  const { fitur = '' } = useParams()
  const feature = COMING_SOON[fitur]
  if (!feature) return <NotFoundPage />

  return (
    <Result
      icon={<ClockCircleOutlined style={{ color: '#0f766e' }} />}
      title={`${feature.title} segera hadir`}
      subTitle={
        <>
          {feature.description}
          <br />
          <Tag style={{ marginTop: 8 }}>PRD {feature.prd}</Tag>
        </>
      }
      extra={
        <Link to="/">
          <Button type="primary">Kembali ke beranda</Button>
        </Link>
      }
    />
  )
}
