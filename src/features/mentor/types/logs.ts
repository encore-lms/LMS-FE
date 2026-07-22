// 멘토 도메인 타입 — 멘토링 일지 상태·템플릿 스냅샷·목록/상세·초안 payload(M3).
import type { MentorTeamMember } from './team'
import type { MentoringPlaceType } from './requests'

/** 일지 상태 — 초안/유효/수정 요청(폐기·반려 없음, 05-31 확정). 재제출 시 즉시 valid 복귀. */
export type MentoringLogStatus =
  | 'draft'
  | 'submitted'
  | 'valid'
  | 'change_requested'

// ───────────────────────── 멘토링 일지 (M3) ─────────────────────────

/** 템플릿 항목 타입 — SHORT_TEXT/LONG_TEXT만(선택형·점수형 금지, P0-ADM-MTR-010). */
export type MentoringLogFieldType = 'short_text' | 'long_text'

/**
 * 운영 적용 템플릿 항목 스냅샷 — 멘토는 렌더링만(항목 편집 불가).
 * MentoringTeamLogFieldOverride.fieldSnapshot 또는 배정 시점 템플릿(03_멘토.md §5).
 */
export interface MentoringLogFieldSnapshot {
  fieldSnapshotId: string
  name: string
  description: string
  required: boolean
  type: MentoringLogFieldType
  /** 글자수 한도 — 미지정이면 null(한도 정책 미확정 TODO) */
  charLimit: number | null
  order: number
  /**
   * 첨부형 항목 표시 보강(작성 산출물=files · 활동 기록=photos) — DB 계약에 첨부 필드가
   * 없어(스키마 갭 openQuestion) FE 표시 전용. BE 확정 시 정식 타입으로 정규화 TODO.
   */
  inputKind?: 'files' | 'photos'
}

/** GET /mentor/v1/mentoring-logs 행. */
export interface MentoringLogListItem {
  logId: string
  teamId: string
  cohortLabel: string
  teamName: string
  /** 일지 요지 1줄 — 주요 아젠다 첫 줄 파생 */
  summary: string
  dateLabel: string // '5/26'
  timeLabel: string // '14:00'
  yearLabel: string // '2026'
  placeType: MentoringPlaceType
  placeDetail: string
  actualMinutes: number
  /** 인정 시간 — 초안·수정 요청(재제출 전)은 null('-') */
  recognizedHours: number | null
  /** 초과 멘토링 시간 — 기록 보존·인정 없음. 0이면 '-' */
  excessHours: number
  status: MentoringLogStatus
  statusNote?: string
  /** 정렬·기간 필터용 — '2026-05-26T14:00' */
  performedAt: string
}

/** GET /mentor/v1/mentoring-logs — KPI·필터 집계는 클라이언트 파생(목록 단일 응답). */
export interface MentoringLogsData {
  logs: MentoringLogListItem[]
}

export interface MentoringLogAttendee extends MentorTeamMember {
  attended: boolean
}

/** 운영자 수정 요청 — 사유 코드 6종 + 상세 메모 필수(05-31 확정). */
export type MentoringLogChangeReasonCode =
  | 'time_mismatch'
  | 'place_missing'
  | 'attendance_missing'
  | 'template_answer_insufficient'
  | 'evidence_missing'
  | 'other'

export const MENTORING_LOG_CHANGE_REASON_LABEL: Record<
  MentoringLogChangeReasonCode,
  string
> = {
  time_mismatch: '시간 불일치',
  place_missing: '장소 누락',
  attendance_missing: '참석 정보 누락',
  template_answer_insufficient: '항목 답변 불충분',
  evidence_missing: '증빙 누락',
  other: '기타',
}

export interface MentoringLogChangeRequest {
  reasonCode: MentoringLogChangeReasonCode
  reasonLabel: string
  /** 상세 메모(필수) — 멘토 전체 수정 후 재제출 안내 */
  note: string
  requestedAtLabel: string
}

/** 활동 기록 사진 메타 — 업로드 계약 미확정(DB 스키마 갭 openQuestion), 표시 전용. */
export interface MentoringLogPhoto {
  dateLabel: string // '2026.05.26 (화)'
  timeLabel: string // '14:00'
  kind: 'start' | 'end'
}

/** GET /mentor/v1/mentoring-logs/{logId} — 상세 모달·수정 폼 프리필 공용. */
export interface MentoringLogDetailData {
  logId: string
  /** 동일 팀 일지 누적 자동 산정 회차 */
  round: number
  status: MentoringLogStatus
  statusNote?: string
  teamId: string
  cohortLabel: string
  teamName: string
  mentorName: string
  /** 일지 요지 1줄 — 주요 아젠다 첫 줄 파생(목록과 동일 원천) */
  summary: string
  /** '2026-05-26(화) 14:00 → 15:30' */
  sessionLabel: string
  /** 폼 프리필용 분해값 — '2026-05-26' / '14:00' / '15:30' */
  sessionDate: string
  startTime: string
  endTime: string
  placeType: MentoringPlaceType
  placeDetail: string
  actualMinutes: number
  recognizedHours: number | null
  excessHours: number
  /** 팀 시간 집계 — '4회차 멘토링 · 누적 6h / 배정 N시간 10h · 잔여 4h' */
  teamHours: {
    accumulatedHours: number
    allocatedHours: number
    remainingHours: number
  }
  attendees: MentoringLogAttendee[]
  attendedCount: number
  memberCount: number
  /** 항목 답변 — 스냅샷 순서, 미작성 선택 항목은 value '' */
  answers: { field: MentoringLogFieldSnapshot; value: string }[]
  submittedAtLabel: string | null
  changeRequest: MentoringLogChangeRequest | null
  photos: MentoringLogPhoto[]
}

/** GET /mentor/v1/mentoring-logs/targets 행 — 작성 폼 대상 팀 select·시간 산정 프리뷰. */
export interface MentoringLogTarget {
  teamId: string
  cohortLabel: string
  teamName: string
  /** 새 일지 회차(자동) — 동일 팀 일지 누적 + 1 */
  nextRound: number
  allocatedHours: number
  accumulatedHours: number
  recognizedHours: number
  remainingHours: number
  members: MentorTeamMember[]
}

export interface MentoringLogTargetsData {
  targets: MentoringLogTarget[]
}

/**
 * 일지 초안·제출 payload — MentoringLogDraftRequest(answers[].fieldSnapshotId) 대응.
 * 초안은 부분 입력 허용(자유 수정·인정 시간 미반영), 제출·재제출은 mock이 필수 항목 검증(422).
 */
export interface MentoringLogDraftPayload {
  teamId: string
  sessionDate?: string // '2026-05-16'
  startTime?: string // '14:00'
  endTime?: string // '15:30'
  placeType?: MentoringPlaceType
  placeDetail?: string
  attendedIds?: string[]
  answers?: { fieldSnapshotId: string; value: string }[]
}
