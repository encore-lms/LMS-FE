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
  /** 담당 파트 태그 — 'AI/ML'·'백엔드' 등(Figma 학생 상세·일지 참석 칩, 선택) */
  tagLabel?: string
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

/**
 * 예약 상태 — MentoringReservationStatus 6종(P0_32_35 API명세).
 * '진행 중'(팀당 1건 제약 대상) = requested · counter_proposed · confirmed.
 */
export type MentoringRequestStatus =
  | 'requested'
  | 'counter_proposed'
  | 'confirmed'
  | 'rejected'
  | 'canceled'
  | 'completed'

export const MENTORING_REQUEST_STATUS_LABEL: Record<
  MentoringRequestStatus,
  string
> = {
  requested: '요청 대기',
  counter_proposed: '조정 제안',
  confirmed: '확정',
  rejected: '거절',
  canceled: '취소',
  completed: '완료',
}

/** 장소 유형 — 오프라인/온라인/기타(03_멘토.md §4). */
export type MentoringPlaceType = 'offline' | 'online' | 'etc'

export const MENTORING_PLACE_TYPE_LABEL: Record<MentoringPlaceType, string> = {
  offline: '오프라인',
  online: '온라인',
  etc: '기타',
}

/**
 * 예약 일정 슬롯 — 수강생 희망·멘토 조정 제안·확정 일정 공용(수강생측 MentoringSlot 대응).
 * dateTimeLabel 은 디자인상 자유 텍스트('6/3(화) 19:00 ~ 21:00') — BE 확정 시
 * confirmedStartsAt(ISO) + confirmedDurationMinutes 로 정규화(날짜·시간 피커 도입) TODO.
 */
export interface MentoringRequestSlot {
  dateTimeLabel: string
  placeType: MentoringPlaceType
  placeDetail: string
  expectedMinutes: number
  memo?: string
}

/** GET /mentor/v1/mentoring-requests 행 — requestId = API reservationId. */
export interface MentoringRequestItem {
  requestId: string
  teamId: string
  cohortLabel: string
  teamName: string
  status: MentoringRequestStatus
  /** 처리 마감 D-day — 계산 규칙(기준일) BE 확정 대기, Figma 대표값 고정 */
  dDayLabel: string | null
  requestedAtLabel: string // '2026-05-26 19:42'
  requester: { name: string; role: MentorTeamMemberRole }
  /** 수강생 희망 일정(요청 원문 — 멘토 응답 후에도 보존) */
  desired: MentoringRequestSlot
  /** 내 조정 제안 — counter_proposed 상태에서만 존재 */
  proposal: MentoringRequestSlot | null
  /** 확정 일정 — confirmed·completed 상태에서만 존재 */
  confirmed: MentoringRequestSlot | null
  /** 거절·조정 응답 메모(수강생 공개 mentorResponseNote) — 필수/선택 정책 미확정(선택으로 구현) TODO */
  mentorResponseNote?: string
  /** 최근 활동 시각('YYYY-MM-DDTHH:mm') — 목록 정렬·기간 필터용 파생 */
  activityAt: string
}

/** GET /mentor/v1/mentoring-requests — 상태 탭·KPI 집계는 클라이언트 파생(목록 단일 응답). */
export interface MentoringRequestsData {
  requests: MentoringRequestItem[]
}

/**
 * 멘토 응답 payload — ReservationActionRequest 대응(확정·조정·확정 정보 변경 공용,
 * 거절·취소는 mentorResponseNote만). 일정은 라벨 문자열(BE 확정 시 ISO 정규화 TODO).
 */
export interface MentoringRequestActionPayload {
  dateTimeLabel?: string
  placeType?: MentoringPlaceType
  placeDetail?: string
  expectedMinutes?: number
  mentorResponseNote?: string
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
