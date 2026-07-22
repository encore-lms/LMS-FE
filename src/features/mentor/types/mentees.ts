// 멘토 도메인 타입 — 학생(멘티) 상세·참석 이력·평가 5축 표시(M3).
import type { MentoringLogStatus } from './logs'

// ───────────────────────── 학생 상세 (M3) ─────────────────────────

/** 참석 이력 행 — 멘토가 작성한 일지의 참석 멘티 정보에서 추출(§5). */
export interface MenteeAttendanceRow {
  logId: string
  round: number
  datetimeLabel: string // '2026-05-26(화) 14:00'
  placeLabel: string // '온라인 · Zoom'
  recognizedLabel: string // '1.5h' | '-'
  attended: boolean
  logStatus: MentoringLogStatus
}

/** 멘토 평가 5축 — 축·점수(1~5 가정, 범위 미확정 TODO). M5 평가 제출과 모델 공유 예정. */
export interface MenteeEvaluationAxis {
  label: string
  score: number
  max: number
}

/**
 * GET /mentor/v1/mentees/{studentProfileId} — 팀 상세에서만 진입하는 보조 상세(독립 목록 없음).
 * 평가·추천은 멘토 본인이 제출한 정본만(§6·§7) — 제출 전이면 null.
 */
export interface MenteeDetailData {
  student: {
    studentId: string
    name: string
    tagLabel?: string
    cohortLabel: string
    teamId: string
    teamName: string
    mentorName: string
    studentNo: string
  }
  permissionScopeLabel: string
  evaluation: {
    writtenAtLabel: string
    average: number
    axes: MenteeEvaluationAxis[]
    comment?: string
  } | null
  recommendation: {
    recommended: boolean
    submittedAtLabel: string
    reason: string
  } | null
  attendance: {
    attended: number
    total: number
    history: MenteeAttendanceRow[]
  }
}
