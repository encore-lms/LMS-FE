import type { AssignmentStatus } from './types'

// 과제 상세·요약 공용 제출 상태 배지 — 목록 카드(AssignmentCard)는 미제출을
// 중립 톤으로 쓰는 별도 맵이라 통합하지 않는다.
export const STATUS_BADGE: Record<
  AssignmentStatus,
  { cls: string; label: string }
> = {
  not_submitted: { cls: 'bg-warning-bg text-warning', label: '미제출' },
  submitted: { cls: 'bg-brand/10 text-brand', label: '제출 완료' },
  reviewed: { cls: 'bg-info-bg text-info', label: '검토 완료' },
}
