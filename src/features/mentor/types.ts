// 멘토 콘솔 도메인 타입 — feature-local(shared/types 무수정 컨벤션, student/mentoring 선례).
// BE 계약 확정 시 shared/types 승격 후보: 특히 MentorTeamAssignment 는 CONTRIBUTING 의
// 역할 교차 단일 소유 모델(수강생 멘토링 화면과 공유) — 승격은 shared PR 합의로 진행.
// 정본: P0_32_35 멘토 콘솔 API명세(/api/mentor/v1) · 2026-05-26(05-31 확정) 멘토 정책 결정 보고서.

/**
 * 팀 상태 — API enum 7종(03_멘토.md).
 * 'N시간 완료'와 '초과 멘토링'은 상태가 아닌 보조 라벨(nHoursDone·excessHours)이다.
 */
export type MentorTeamStatus =
  | 'in_progress'
  | 'reservation_waiting'
  | 'log_needed'
  | 'change_requested'
  | 'evaluation_needed'
  | 'completed'
  | 'early_ended'

/** 팀 상태 화면 표기 — 진행 중·예약 대기·일지 필요·평가 필요·수정 요청·완료(+조기 종료). */
export const MENTOR_TEAM_STATUS_LABEL: Record<MentorTeamStatus, string> = {
  in_progress: '진행 중',
  reservation_waiting: '예약 대기',
  log_needed: '일지 필요',
  change_requested: '수정 요청',
  evaluation_needed: '평가 필요',
  completed: '완료',
  early_ended: '조기 종료',
}

/** 일지 상태 — 초안/유효/수정 요청(폐기·반려 없음, 05-31 확정). 재제출 시 즉시 valid 복귀. */
export type MentoringLogStatus = 'draft' | 'valid' | 'change_requested'

/** 멘토-팀 배정 + 시간 집계 read model — 대시보드·내 배정 팀 공용 행. */
export interface MentorTeamAssignment {
  assignmentId: string
  teamId: string
  cohortLabel: string
  teamName: string
  memberCount: number
  status: MentorTeamStatus
  /** 배정 N시간 */
  allocatedHours: number
  /** 실제 누적 — 유효 일지 actualMinutes 합산(시간 단위) */
  accumulatedHours: number
  /** 활동 인정 시간 — 잔여까지만 인정(비용·정산 표현 금지, '활동 인정 요건'으로만 안내) */
  recognizedHours: number
  remainingHours: number
  /** 초과 멘토링 시간 — 기록은 보존하되 인정 없음 */
  excessHours: number
  /** 보조 라벨 'N시간 완료' — 인정 합계 ≥ 배정 N시간 */
  nHoursDone: boolean
}

export type MentorTodoType =
  | 'log_write'
  | 'evaluation'
  | 'recommendation'
  | 'change_response'

export interface MentorTodoItem {
  type: MentorTodoType
  /** '2건' | '1팀' — 집계 단위가 달라 라벨로 전달(집계 규칙 BE 확정 대기) */
  countLabel: string
  required: boolean
}

/** 예정된 멘토링 — CONFIRMED 예약만(예정 시간은 인정 시간 미반영, P0_32). */
export interface UpcomingMentoringSession {
  reservationId: string
  teamId: string
  cohortLabel: string
  teamName: string
  dateLabel: string // '5/28'
  dayOfWeekLabel: string // '수'
  timeLabel: string // '14:00'
  locationTypeLabel: string // '온라인' | '오프라인'
  locationDetailLabel: string // 'Zoom' | '강의장 B'
  expectedMinutes: number
  /** 가장 임박한 확정 건에만 부여 — 'D-1' */
  dDayLabel: string | null
  requesterName: string
}

export interface MentorRecentLog {
  logId: string
  teamId: string
  cohortLabel: string
  teamName: string
  dateLabel: string // '5/26'
  yearLabel: string // '2026'
  actualMinutes: number
  /** 인정 시간 — 수정 요청(재제출 전) 등 미확정이면 null('-' 표기) */
  recognizedHours: number | null
  status: MentoringLogStatus
  /** 상태 칩에 덧붙는 메모 — '일지 보강 필요' */
  statusNote?: string
}

/** GET /mentor/v1/dashboard — MentorDashboardResponse 대응 read model. */
export interface MentorDashboardData {
  mentor: { name: string; assignedTeamCount: number; todoCount: number }
  teamCards: MentorTeamAssignment[]
  todos: MentorTodoItem[]
  upcoming: { confirmedCount: number; sessions: UpcomingMentoringSession[] }
  teamTable: MentorTeamAssignment[]
  recentLogs: MentorRecentLog[]
}

export interface MentorTeamsKpis {
  inProgress: number
  reservationWaiting: number
  evaluationNeeded: number
  changeRequested: number
}

/** GET /mentor/v1/teams */
export interface MentorTeamsData {
  kpis: MentorTeamsKpis
  totalTeamCount: number
  teams: MentorTeamAssignment[]
}

export type MentorTeamMemberRole = 'pm' | 'member'

export interface MentorTeamMember {
  studentId: string
  name: string
  role: MentorTeamMemberRole
}

export interface MentorNextReservation {
  reservationId: string
  dateLabel: string // '5/28'
  dayOfWeekLabel: string // '수'
  timeLabel: string // '14:00'
  locationTypeLabel: string
  locationDetailLabel: string
  expectedMinutes: number
  requesterName: string
  dDayLabel: string | null
}

export interface MentorTeamEvaluationSummary {
  /** N시간 미완료 + 조기 종료 아님 = 잠금(422 MENTOR_EVALUATION_NOT_ELIGIBLE) — 잠금 사유 표시 */
  locked: boolean
  lockReasonLabel: string
  progressHours: number
  allocatedHours: number
  percent: number
  evaluationStatusLabel: string
  recommendationStatusLabel: string
}

export interface MentorTeamLogRow {
  logId: string
  datetimeLabel: string // '5/26 14:00'
  locationLabel: string // '온라인 · Zoom'
  actualMinutes: number
  recognizedHours: number | null
  summary: string
  status: MentoringLogStatus
  statusNote?: string
}

/** GET /mentor/v1/teams/{teamId} */
export interface MentorTeamDetailData {
  assignment: MentorTeamAssignment
  periodLabel: string // '2026-04-01 ~ 2026-07-15'
  mentorName: string
  members: MentorTeamMember[]
  reservationSummary: {
    inProgress: number
    confirmed: number
    completed: number
  }
  nextReservation: MentorNextReservation | null
  evaluation: MentorTeamEvaluationSummary
  recentLogs: MentorTeamLogRow[]
}
