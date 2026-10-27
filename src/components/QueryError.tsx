import { Alert, Button } from 'antd'
import { ApiError } from '../api/client'

export default function QueryError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const text = error instanceof ApiError ? error.message : 'Gagal memuat data.'
  return (
    <Alert
      type="error"
      showIcon
      title={text}
      action={
        onRetry && (
          <Button size="small" onClick={onRetry}>
            Coba lagi
          </Button>
        )
      }
      style={{ marginBottom: 16 }}
    />
  )
}
