import type { BadgeTone } from '@/components/ui/StatusBadge'
import type {
  AdminMentoringLogRow,
  AdminTemplateFieldType,
  MentorAssignmentRow,
  MentorTeamStatRow,
  MentoringTeamStatKey,
  StatCertificateState,
  TeamLogFieldDiffStatus,
} from './types'

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

/** 'N시간 완료'의 N을 실제 배정 시간으로 — 10 → '10시간 완료', 1.5 → '1.5시간 완료'(2026-08-04 QA). */
export function nHoursDoneLabel(allocatedHours: number | null): string {
  if (allocatedHours == null || allocatedHours <= 0) return '배정 시간 완료'
  return `${allocatedHours}시간 완료`
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
  | 'submitted'
  | 'valid'
  | 'change_requested'
  | 'resubmitted_valid'

export const LOG_STATUS_META: Record<
  LogDisplayStatus,
  { label: string; tone: BadgeTone }
> = {
  draft: { label: '초안', tone: 'neutral' },
  submitted: { label: '승인 대기', tone: 'warning' },
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

// ───────────────────────── 일지 항목·템플릿 (§31~32) ─────────────────────────

/** 항목 타입 배지 — 텍스트=info/success 틴트 · 이미지=warning · 텍스트+이미지=accent. */
export const FIELD_TYPE_META: Record<
  AdminTemplateFieldType,
  { label: string; tone: BadgeTone }
> = {
  long_text: { label: '긴 텍스트', tone: 'info' },
  short_text: { label: '짧은 텍스트', tone: 'success' },
  image: { label: '이미지', tone: 'warning' },
  text_image: { label: '텍스트+이미지', tone: 'accent' },
}

/**
 * 템플릿 대비 배지 라벨 — required_changed 는 방향 표기가 있어 라벨 함수
 * (requiredChangedLabel)로 별도 파생. same 만 중립, 나머지는 amber 강조(변경 행).
 */
export const FIELD_DIFF_LABEL: Record<TeamLogFieldDiffStatus, string> = {
  same: '템플릿 동일',
  desc_changed: '설명 변경',
  added: '신규 추가',
  required_changed: '필수 변경',
  disabled: '비활성화',
}

/** '필수 변경 (선택→필수)' — 템플릿 기준 대비 방향 표기. */
export function requiredChangedLabel(nowRequired: boolean) {
  return nowRequired ? '필수 변경 (선택→필수)' : '필수 변경 (필수→선택)'
}

// ───────────────────────── 멘토 통계 (§33) ─────────────────────────

/**
 * 상태 요약·필터 라벨 — 통계 노출 5종(진행 중/일지 필요/수정 요청/평가 필요/시간 완료).
 * completed 는 인정 시간을 다 채웠다는 뜻이지 배정이 끝났다는 뜻이 아니다(멘토 화면과 같은 기준).
 */
export const STAT_TEAM_STATUS_LABEL: Record<MentoringTeamStatKey, string> = {
  in_progress: '진행 중',
  log_needed: '일지 필요',
  change_requested: '수정 요청',
  evaluation_needed: '평가 필요',
  completed: '시간 완료',
}

export const STAT_TEAM_STATUS_KEYS = Object.keys(
  STAT_TEAM_STATUS_LABEL,
) as MentoringTeamStatKey[]

/** 평가·추천 셀 — '평가 완료 · 추천' / '평가 완료 · 추천 안 함' / '평가 필요' / 'N시간 미달'. */
export function evaluationCellMeta(
  row: Pick<MentorTeamStatRow, 'evaluation' | 'recommendation'>,
): { label: string; tone: BadgeTone } {
  if (row.evaluation === 'submitted') {
    return row.recommendation === 'recommended'
      ? { label: '평가 완료 · 추천', tone: 'success' }
      : { label: '평가 완료 · 추천 안 함', tone: 'success' }
  }
  if (row.evaluation === 'needed')
    return { label: '평가 필요', tone: 'warning' }
  return { label: 'N시간 미달', tone: 'neutral' }
}

/** 증명서 반영 셀 — 스냅샷 반영 완료/원천 데이터 대기/대상 외. */
export const CERTIFICATE_STATE_META: Record<
  StatCertificateState,
  { label: string; tone: BadgeTone }
> = {
  reflected: { label: '스냅샷 반영 완료', tone: 'success' },
  waiting_source: { label: '원천 데이터 대기', tone: 'info' },
  not_target: { label: '대상 외', tone: 'neutral' },
}
