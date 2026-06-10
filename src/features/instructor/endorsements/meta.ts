import type { BadgeTone } from '@/components/ui/StatusBadge'
import type { EndorsementSnapshotStatus } from '@/shared/types'

// 스냅샷 반영 상태 → 라벨·배지 톤. 3화면(목록·상세·전체보기) 공통.
export const SNAPSHOT_META: Record<
  EndorsementSnapshotStatus,
  { label: string; tone: BadgeTone }
> = {
  snapshot_applied: { label: '스냅샷 반영', tone: 'success' },
  pending_certification: { label: '인증 대기', tone: 'neutral' },
  pending_refresh: { label: '최신화 대기', tone: 'warning' },
}

// 제출 후 24h 수정 창 남은 분 → '14h 23m 남음'. 0/미정이면 null(수정 불가).
export function formatRemaining(minutes?: number): string | null {
  if (!minutes || minutes <= 0) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m 남음`
}
