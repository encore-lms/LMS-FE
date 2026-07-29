import { useEffect, useState } from 'react'
import { apiClient } from '@/shared/api'
import { cn } from '@/shared/lib/cn'

// 마일리지 상품 이미지(인증 blob).
// - url 있고 로딩 중 → 스켈레톤(이미지가 늦게 떠 아이콘이 먼저 깜빡이는 것 방지)
// - url 없음 / 로드 실패 → fallback(타입 아이콘)
// - 로드 완료 → 이미지
export function ProductImage({
  url,
  className,
  fallback,
  skeletonClassName,
}: {
  url?: string | null
  className?: string
  fallback: React.ReactNode
  skeletonClassName?: string
}) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    setSrc(null)
    setFailed(false)
    if (!url) return
    let alive = true
    let objectUrl: string | null = null
    apiClient
      .getBlob(url)
      .then((blob) => {
        if (!alive) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])
  if (!url || failed) return <>{fallback}</>
  if (!src)
    return (
      <div
        className={cn(
          'bg-surface-muted size-full animate-pulse',
          skeletonClassName,
        )}
      />
    )
  return <img src={src} alt="" className={className} />
}
