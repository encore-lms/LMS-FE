import {
  Calendar,
  Check,
  CheckCircle2,
  Timer,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { MentoringRequestItem, MentoringRequestStatus } from '../types'
import { MENTORING_REQUEST_STATUS_LABEL } from '../types'

// 예약 상태 → 시각 매핑 — Figma 멘토링 예약(2553:3820/3942) 정의.
// 색 의미 일관(스펙 공통): 확정=brand · 조정 제안=accent-strong · 거절=danger · 요청 대기=warning.
// 색은 @theme 토큰만 사용(raw 틴트 매핑 기확정: #f0edfa→accent-bg · #e0edfc→info-bg ·
// #d6f2e8→success-bg · 카드 좌측 스트라이프 #f59e0a→warning conform, M1 statusMeta 선례).
interface MentoringRequestStatusMeta {
  label: string
  icon: LucideIcon
  /** 상태 칩 bg + text */
  chip: string
  /** 요청 카드 좌측 세로 상태 스트라이프 */
  stripe: string
  /** 필터 탭 앞 상태 점(이미지 asset Ellipse → 상태색 토큰 매핑 추정, openQuestion 기록) */
  dot: string
}

export const REQUEST_STATUS_META: Record<
  MentoringRequestStatus,
  MentoringRequestStatusMeta
> = {
  requested: {
    label: MENTORING_REQUEST_STATUS_LABEL.requested,
    icon: Timer,
    chip: 'bg-warning-bg text-warning',
    stripe: 'bg-warning',
    dot: 'bg-warning',
  },
  counter_proposed: {
    label: MENTORING_REQUEST_STATUS_LABEL.counter_proposed,
    icon: Calendar,
    chip: 'bg-accent-bg text-accent-strong',
    stripe: 'bg-accent-strong',
    dot: 'bg-accent-strong',
  },
  confirmed: {
    label: MENTORING_REQUEST_STATUS_LABEL.confirmed,
    icon: Check,
    chip: 'bg-brand/10 text-brand',
    stripe: 'bg-brand',
    dot: 'bg-brand',
  },
  completed: {
    label: MENTORING_REQUEST_STATUS_LABEL.completed,
    icon: CheckCircle2,
    chip: 'bg-success-bg text-success',
    stripe: 'bg-success',
    dot: 'bg-success',
  },
  rejected: {
    label: MENTORING_REQUEST_STATUS_LABEL.rejected,
    icon: X,
    chip: 'bg-danger-bg text-danger',
    stripe: 'bg-danger',
    dot: 'bg-danger',
  },
  canceled: {
    label: MENTORING_REQUEST_STATUS_LABEL.canceled,
    icon: XCircle,
    chip: 'bg-surface-muted text-fg-muted',
    stripe: 'bg-fg-subtle',
    dot: 'bg-fg-subtle',
  },
}

/**
 * 응답 저장 완료 토스트 — Figma 공통 Toast 원문(2582:6296). 응답 완료는 별도 결과 페이지 없이
 * 토스트 + 목록 잔류로 확정(결정 ③ — 2582:6296 본문 결과 화면은 IA 미확정 openQuestion).
 */
export const RESPONSE_SAVED_TOAST =
  '예약 응답이 저장되었습니다. 선택한 상태가 요청 목록에 반영됩니다.'

/** 필터 탭 — Figma 칩 6개(진행 중 요청 / 요청 대기 / 조정 제안 / 확정 / 완료 / 거절·취소). */
export type MentoringRequestTab =
  | 'open'
  | 'requested'
  | 'counter_proposed'
  | 'confirmed'
  | 'completed'
  | 'closed'

export const REQUEST_TABS: {
  value: MentoringRequestTab
  label: string
  /** 상태 점 색 — '진행 중 요청'(기본 활성 칩)은 점 없음 */
  dot?: string
}[] = [
  { value: 'open', label: '진행 중 요청' },
  {
    value: 'requested',
    label: '요청 대기',
    dot: REQUEST_STATUS_META.requested.dot,
  },
  {
    value: 'counter_proposed',
    label: '조정 제안',
    dot: REQUEST_STATUS_META.counter_proposed.dot,
  },
  { value: 'confirmed', label: '확정', dot: REQUEST_STATUS_META.confirmed.dot },
  { value: 'completed', label: '완료', dot: REQUEST_STATUS_META.completed.dot },
  {
    value: 'closed',
    label: '거절·취소',
    dot: REQUEST_STATUS_META.rejected.dot,
  },
]

/** 탭 ↔ 상태 매칭 — '진행 중 요청' = 멘토 응답 대기 묶음(요청 대기 + 조정 제안). */
export function matchRequestTab(
  request: MentoringRequestItem,
  tab: MentoringRequestTab,
): boolean {
  switch (tab) {
    case 'open':
      return (
        request.status === 'requested' || request.status === 'counter_proposed'
      )
    case 'closed':
      return request.status === 'rejected' || request.status === 'canceled'
    default:
      return request.status === tab
  }
}
