import { useEffect, useState } from 'react'
import { apiClient } from '@/shared/api'

// 마일리지 상품 이미지(인증 blob). url 없으면 fallback(아이콘) 렌더.
export function ProductImage({
  url,
  className,
  fallback,
}: {
  url?: string | null
  className?: string
  fallback: React.ReactNode
}) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    if (!url) {
      setSrc(null)
      return
    }
    let alive = true
    let objectUrl: string | null = null
    apiClient
      .getBlob(url)
      .then((blob) => {
        if (!alive) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => {})
    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])
  if (!url || !src) return <>{fallback}</>
  return <img src={src} alt="" className={className} />
}
