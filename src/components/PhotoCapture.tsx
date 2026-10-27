import { CameraOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Flex, Image } from 'antd'
import { useRef, useState } from 'react'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { compressImage } from '../utils/image'

interface Props {
  value?: File | null
  onChange?: (file: File | null) => void
  label: string
  /** Which camera the tablet opens: rear for plates, front for faces. */
  capture?: 'environment' | 'user'
  id?: string
}

/** Antd Form-compatible camera input: opens the device camera, compresses, previews. */
export default function PhotoCapture({ value, onChange, label, capture = 'environment', id }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const preview = useObjectUrl(value)

  const pick = () => inputRef.current?.click()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow retaking the same shot
    if (!file) return
    setBusy(true)
    try {
      onChange?.(await compressImage(file))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        capture={capture}
        onChange={handleFile}
        style={{ display: 'none' }}
        data-testid={id ? `${id}-input` : undefined}
      />
      {value && preview ? (
        <Flex gap={12} align="center" wrap>
          <Image
            src={preview}
            alt={label}
            width={128}
            height={96}
            style={{ objectFit: 'cover', borderRadius: 8 }}
          />
          <Flex vertical gap={8}>
            <Button icon={<ReloadOutlined />} onClick={pick} loading={busy}>
              Foto ulang
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={() => onChange?.(null)}>
              Hapus
            </Button>
          </Flex>
        </Flex>
      ) : (
        <Button
          icon={<CameraOutlined style={{ fontSize: 24 }} />}
          onClick={pick}
          loading={busy}
          block
          style={{ height: 72, borderStyle: 'dashed' }}
        >
          {label}
        </Button>
      )}
    </>
  )
}
