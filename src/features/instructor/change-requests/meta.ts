import type { BadgeTone } from '@/components/ui/StatusBadge'
import type { CertReviewTargetType, ChangeRequestStatus } from '@/shared/types'

// 인증 후 통합 검토 공용 표기 — 유형 칩·상태 pill·탭. (Figma 2750:2070·2750:2202)
export const TARGET_TYPE_META: Record<
  CertReviewTargetType,
  { label: string; tone: BadgeTone }
> = {
  project: { label: '프로젝트', tone: 'accent' },
  troubleshooting: { label: '트러블슈팅', tone: 'info' },
}

export const CHANGE_REQUEST_STATUS_META: Record<
  ChangeRequestStatus,
  { label: string; tone: BadgeTone }
> = {
  requested: { label: '요청 대기', tone: 'warning' },
  reviewing: { label: '검토중', tone: 'neutral' },
  approved: { label: '승인', tone: 'success' },
  rejected: { label: '반려', tone: 'danger' },
}

/** 유형 필터 탭 순서 — Figma chip 순서(전체/프로젝트/트러블슈팅) 그대로. */
export const TYPE_FILTERS = ['all', 'project', 'troubleshooting'] as const

export type TypeFilter = (typeof TYPE_FILTERS)[number]
