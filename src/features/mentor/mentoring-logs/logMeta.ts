import {
  AlertTriangle,
  Check,
  Home,
  Info,
  Link2,
  Pencil,
  type LucideIcon,
} from 'lucide-react'
import type { MentoringLogStatus, MentoringPlaceType } from '../types'

// 멘토링 일지 화면 상태 메타 — Figma 2553:4040 원문 라벨(유효/수정 요청/작성 중).
// LogStatusChip의 구 '승인' 라벨은 2026-06-13 '유효'로 통일(자동 유효 정책 정합, Figma 동반 정정).
export interface LogStatusMeta {
  label: string
  icon: LucideIcon
  chip: string
}

export const LOG_STATUS_META: Record<MentoringLogStatus, LogStatusMeta> = {
  valid: { label: '유효', icon: Check, chip: 'bg-success-bg text-success' },
  submitted: {
    label: '승인 대기',
    icon: Info,
    chip: 'bg-warning-bg text-warning',
  },
  change_requested: {
    label: '수정 요청',
    icon: AlertTriangle,
    chip: 'bg-danger-bg text-danger',
  },
  draft: { label: '작성 중', icon: Pencil, chip: 'bg-warning-bg text-warning' },
}

/** 장소 유형 아이콘 — 온라인 link / 오프라인 집(home) / 기타 info(Figma house-door-fill 정합). */
export const PLACE_TYPE_ICON: Record<MentoringPlaceType, LucideIcon> = {
  online: Link2,
  offline: Home,
  etc: Info,
}

// 제출 완료 토스트 — 승인 단계 도입: 제출 시 '승인 대기', 매니저 승인 후 인정. 재제출도 공용.
export const LOG_SUBMITTED_TOAST =
  '멘토링 일지가 제출되었습니다. 매니저 승인 후 인정 시간에 반영됩니다.'

export const LOG_DRAFT_SAVED_TOAST =
  '임시 저장했어요. 작성 중 일지는 인정 시간에 반영되지 않습니다.'

// 액션바 정책 캡션 — 승인 단계 도입 반영.
export const LOG_SUBMIT_POLICY_CAPTION =
  '제출 시 승인 대기 · 매니저 승인 후 인정 · 수정 요청 시 전체 수정 후 재제출'

/** 90 → '1.5시간 (90분)' / 118 → '2시간 (118분)' — 시간 표기 반올림은 0.1h 단위. */
export function durationLabel(minutes: number) {
  const hours = Math.round((minutes / 60) * 10) / 10
  return `${hours}시간 (${minutes}분)`
}

/** 'HH:mm' 간격(분) — 미입력·역순이면 0(검증은 폼 스키마에서). */
export function minutesBetween(start: string, end: string): number {
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(eh * 60 + em - (sh * 60 + sm), 0)
}
