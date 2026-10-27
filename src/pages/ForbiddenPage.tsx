import { Button, Result } from 'antd'
import { Link } from 'react-router'

export default function ForbiddenPage() {
  return (
    <Result
      status="403"
      title="Akses ditolak"
      subTitle="Halaman ini tidak tersedia untuk peran Anda."
      extra={
        <Link to="/">
          <Button type="primary">Kembali ke beranda</Button>
        </Link>
      }
    />
  )
}
