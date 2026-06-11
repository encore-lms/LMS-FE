import type { BadgeTone } from '@/components/ui/StatusBadge'
import type { AssignmentSubmissionStatus } from '@/shared/types'

// 과제·실습 상태 표기 공용 — 목록 행 배지·제출 현황 헤더·학생별 제출 pill. (Figma 2236:10561·10651)
export const SUBMISSION_STATUS_META: Record<
  AssignmentSubmissionStatus,
  { label: string; tone: BadgeTone }
> = {
  not_submitted: { label: '미제출', tone: 'info' },
  submitted: { label: '제출완료', tone: 'success' },
  supplement_requested: { label: '보완요청', tone: 'warning' },
  review_done: { label: '검토완료', tone: 'success' },
}

/** 제출 현황 좌측 필터 탭 순서 — Figma chip 순서 그대로. */
export const SUBMISSION_FILTERS = [
  'all',
  'not_submitted',
  'submitted',
  'supplement_requested',
  'review_done',
] as const

export type SubmissionFilter = (typeof SUBMISSION_FILTERS)[number]
