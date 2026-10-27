import { Empty, Image, Skeleton } from 'antd'
import { usePhoto } from '../hooks/queries'
import { useObjectUrl } from '../hooks/useObjectUrl'

interface Props {
  /** Relative photo path from the API (needs the Bearer token, so no plain <img src>). */
  path: string
  alt: string
  width?: number
  height?: number
}

export default function AuthImage({ path, alt, width = 220, height = 165 }: Props) {
  const { data, isLoading, isError } = usePhoto(path)
  const url = useObjectUrl(data)

  if (isLoading) return <Skeleton.Image active style={{ width, height }} />
  if (isError || !url) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Foto tidak tersedia" />
  }
  return (
    <Image
      src={url}
      alt={alt}
      width={width}
      height={height}
      style={{ objectFit: 'cover', borderRadius: 8 }}
    />
  )
}
