import { Button, Result } from 'antd'
import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <Result
      status="404"
      title="Halaman tidak ditemukan"
      extra={
        <Link to="/">
          <Button type="primary">Kembali ke beranda</Button>
        </Link>
      }
    />
  )
}
