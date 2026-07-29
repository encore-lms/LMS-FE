import { useEffect, useState } from 'react'
import { apiClient } from '@/shared/api'

interface HasImage {
  id: string
  imageUrl?: string | null
}

/**
 * 상품 이미지(blob)를 전부 미리 로드한다. 모든 이미지가 준비돼야 ready=true.
 * 카드를 이 시점 이후에만 렌더해 "아이콘 먼저 → 이미지 나중" 깜빡임을 없앤다.
 * ready 판정은 로드 완료된 key와 현재 key가 같은지로 하므로, 로드 전 1프레임 노출이 없다.
 */
export function usePreloadedProductImages(items: HasImage[]): {
  images: Record<string, string>
  ready: boolean
} {
  const [state, setState] = useState<{
    key: string
    images: Record<string, string>
  }>({ key: '', images: {} })

  // 대상 이미지 URL의 안정적 key(순서 무관) — 목록/이미지가 바뀔 때만 재로드.
  const key = items
    .filter((i) => i.imageUrl)
    .map((i) => `${i.id}:${i.imageUrl}`)
    .sort()
    .join('|')

  useEffect(() => {
    let alive = true
    const created: string[] = []
    const withImage = items.filter((i) => i.imageUrl)
    if (withImage.length === 0) {
      setState({ key, images: {} })
      return
    }
    // 실패는 무시(해당 상품은 아이콘 fallback) — 전체 렌더를 막지 않는다.
    Promise.all(
      withImage.map((i) =>
        apiClient
          .getBlob(i.imageUrl as string)
          .then((blob) => {
            const url = URL.createObjectURL(blob)
            created.push(url)
            return [i.id, url] as const
          })
          .catch(() => null),
      ),
    ).then((entries) => {
      if (!alive) {
        created.forEach((u) => URL.revokeObjectURL(u))
        return
      }
      const map: Record<string, string> = {}
      for (const e of entries) if (e) map[e[0]] = e[1]
      setState({ key, images: map })
    })
    return () => {
      alive = false
      created.forEach((u) => URL.revokeObjectURL(u))
    }
    // key가 로드 대상 전체를 대표한다(items 참조 변화는 무시).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // 로드 완료한 key와 현재 key가 같을 때만 준비 완료.
  return { images: state.images, ready: state.key === key }
}
