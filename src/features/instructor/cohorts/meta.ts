import type { BadgeTone } from '@/components/ui/StatusBadge'
import type { StudentCertStatus } from '@/shared/types'

// 증명서 상태 5종 pill — 수강생 목록(§3)·수강생 상세(§4 예정) 통일 사용.
export const CERT_STATUS_META: Record<
  StudentCertStatus,
  { label: string; tone: BadgeTone }
> = {
  requested: { label: '요청됨', tone: 'info' },
  reviewing: { label: '검토 중', tone: 'accent' },
  changes_requested: { label: '보완 요청', tone: 'danger' },
  certified: { label: '인증 완료', tone: 'success' },
  drafting: { label: '작성 중', tone: 'neutral' },
}
