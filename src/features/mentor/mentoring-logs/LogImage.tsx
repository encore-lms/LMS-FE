import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { apiClient } from '@/shared/api'
import { cn } from '@/shared/lib/cn'

/**
 * 첨부 이미지 한 장.
 *
 * <p><code>&lt;img src&gt;</code> 는 Authorization 헤더를 붙이지 못한다. 원본 경로를 그대로 주면
 * 401 이 나고 SPA fallback 이 HTML 을 돌려줘 깨진 이미지만 남는다 — 토큰이 실리는 요청으로
 * 받아 blob URL 로 그린다(2026-08-06 QA 검증에서 발견).</p>
 */
export function LogImage({
  imageId,
  alt,
  className,
}: {
  imageId: string
  alt: string
  className?: string
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let revoked = false
    let objectUrl: string | null = null
    setFailed(false)
    setUrl(null)

    apiClient
      .getBlob(`/mentor/v1/mentoring-log-images/${imageId}`)
      .then((blob) => {
        if (revoked) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {
        if (!revoked) setFailed(true)
      })

    return () => {
      revoked = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [imageId])

  if (failed) {
    return (
      <div
        className={cn(
          'bg-surface-muted text-fg-subtle flex flex-col items-center justify-center gap-1 text-[10px]',
          className,
        )}
      >
        <ImageOff className="h-4 w-4" aria-hidden="true" />
        불러오지 못함
      </div>
    )
  }

  if (!url) {
    return <div className={cn('bg-surface-muted animate-pulse', className)} />
  }

  return <img src={url} alt={alt} className={className} />
}
