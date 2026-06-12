import type { BadgeTone } from '@/components/ui/StatusBadge'
import type { AdminMentoringLogRow, MentorAssignmentRow } from './types'

// 상태 칩 매핑 — 운영 멘토링 전용(기능 로컬). 'N시간 완료'·'재제출 후 유효'는
// 상태 enum 이 아닌 보조 라벨(05-26·05-31 결정)이라 표시 키로만 파생한다.

export type AssignmentDisplayStatus =
  | 'in_progress'
  | 'unassigned'
  | 'early_ended'
  | 'n_hours_done'

export const ASSIGNMENT_STATUS_META: Record<
  AssignmentDisplayStatus,
  { label: string; tone: BadgeTone }
> = {
  in_progress: { label: '진행 중', tone: 'success' },
  unassigned: { label: '미배정', tone: 'danger' },
  early_ended: { label: '조기 종료', tone: 'warning' },
  n_hours_done: { label: 'N시간 완료', tone: 'success' },
}

export function assignmentDisplayStatus(
  row: MentorAssignmentRow,
): AssignmentDisplayStatus {
  if (!row.assignmentId) return 'unassigned'
  if (row.status === 'early_ended') return 'early_ended'
  return row.nHoursDone ? 'n_hours_done' : 'in_progress'
}

export type LogDisplayStatus =
  | 'draft'
  | 'valid'
  | 'change_requested'
  | 'resubmitted_valid'

export const LOG_STATUS_META: Record<
  LogDisplayStatus,
  { label: string; tone: BadgeTone }
> = {
  draft: { label: '초안', tone: 'neutral' },
  valid: { label: '유효', tone: 'success' },
  change_requested: { label: '수정 요청', tone: 'info' },
  resubmitted_valid: { label: '재제출 후 유효', tone: 'accent' },
}

export function logDisplayStatus(
  log: Pick<AdminMentoringLogRow, 'status' | 'resubmitted'>,
): LogDisplayStatus {
  if (log.status === 'valid' && log.resubmitted) return 'resubmitted_valid'
  return log.status
}

/** 누적 인정 진행바 색 — 100% success / 50% 이상 warning / 그 외 info(Figma 대표값 기준, 임계값 정의는 BE·디자인 확정 TODO). */
export function progressFillClass(pct: number) {
  if (pct >= 100) return 'bg-success'
  if (pct >= 50) return 'bg-warning'
  return 'bg-info'
}
