import { useEffect, useState } from 'react'

/** A blob: URL for `blob`, revoked when the blob changes or on unmount. */
export function useObjectUrl(blob?: Blob | null): string | undefined {
  const [url, setUrl] = useState<string>()
  // Blob URLs are an external resource that must be revoked, so an effect is
  // the right place; a useMemo version breaks under StrictMode's double mount.
  /* oxlint-disable react/set-state-in-effect */
  useEffect(() => {
    if (!blob) {
      setUrl(undefined)
      return
    }
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])
  /* oxlint-enable react/set-state-in-effect */
  return url
}
