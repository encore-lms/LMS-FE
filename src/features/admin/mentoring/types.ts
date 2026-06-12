// 운영 멘토링 관리 — 기능 로컬 read model.
// 정본: P0_25_26 운영 평판 멘토링 API명세(prefix /api/admin) + 04_운영.md §29~30 +
// 2026-05-26(05-31 갱신) 멘토 업무 정책 결정 보고서.
// shared/types 무수정 — MentorTeamAssignment 등 역할 교차 모델은 BE 계약 확정 시
// 단일 소유 + shared PR 규약으로 승격 검토(CONTRIBUTING.md).

/** 배정 수명주기(노출분) — replaced/inactive 는 보드 비노출(mock 내부 보존). */
export type MentorAssignmentStatus = 'active' | 'early_ended'

export interface AdminMentorOption {
  mentorId: string
  name: string
}

/** 배정 폼 선택지 — 전체 템플릿(adminMentoringDb.logTemplates)에서 활성만 파생. */
export interface AdminLogTemplateOption {
  templateId: string
  /** 'AI 캠프 기본 v2.1' */
  name: string
  isDefault: boolean
}

/** 반(cohort) 선택지 — 한 반에 한 팀만 배정(409 MENTOR_ASSIGNMENT_DUPLICATED_COHORT)의 단위. */
export interface AdminMentoringCohortOption {
  cohortId: string
  /** 'AI 캠프' */
  courseName: string
  /** 'AI 5기' — 테이블 반/기수 셀 표기 */
  cohortLabel: string
  /** 'AI 5기 A반' — 배정 폼 반 선택 표기(같은 기수 복수 반 구분) */
  cohortName: string
}

/** 배정 보드 행 — 팀 단위(미배정 팀 포함 노출, Figma 2744:7725). */
export interface MentorAssignmentRow {
  teamId: string
  teamName: string
  cohortId: string
  cohortLabel: string
  courseName: string
  memberCount: number
  /** 미배정 팀이면 null */
  assignmentId: string | null
  mentor: AdminMentorOption | null
  allocatedHours: number | null
  recognizedHours: number | null
  /** 인정 ÷ 배정 (%) — 미배정·N시간 미설정이면 null */
  recognizedPct: number | null
  /** 현 배정에 일지 존재 — 멘토 교체 시 409 MENTOR_ASSIGNMENT_HAS_LOGS 분기 */
  hasLogs: boolean
  status: MentorAssignmentStatus | null
  /** 'N시간 완료' — 상태가 아닌 보조 라벨(05-26 결정) */
  nHoursDone: boolean
  logTemplateId: string | null
}

export interface MentorAssignmentsData {
  kpis: {
    activeMentors: number
    activeAssignments: number
    /** 'AI 2 · DA 1' — 과정별 활성 배정 분포 */
    activeAssignmentsHint: string
    unassignedTeams: number
    /** 'AI 5기 1 · DA 4기 1' — 기수별 미배정 분포 */
    unassignedTeamsHint: string
    earlyEnded: number
  }
  cohorts: AdminMentoringCohortOption[]
  mentors: AdminMentorOption[]
  templates: AdminLogTemplateOption[]
  rows: MentorAssignmentRow[]
  summary: { total: number; active: number; unassigned: number }
}

/** POST /admin/mentors/assignments — 반→팀→멘토·N시간·기본 템플릿 필수(§29). */
export interface MentorAssignmentCreateRequest {
  teamId: string
  mentorId: string
  allocatedHours: number
  logTemplateId: string
}

// ───────────────────────── 멘토링 일지 관리 (§30) ─────────────────────────

/** 일지 상태 — 폐기·반려 없음(05-31 확정). '재제출 후 유효'는 valid + resubmitted 보조 라벨. */
export type AdminMentoringLogStatus = 'draft' | 'valid' | 'change_requested'

/** 수정 요청 사유 코드 6종(05-31 확정) — 멘토 콘솔 types 와 동일 값(기능 로컬 복제, BE 확정 시 단일 소유 승격). */
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

export const MENTORING_LOG_CHANGE_REASON_CODES = Object.keys(
  MENTORING_LOG_CHANGE_REASON_LABEL,
) as MentoringLogChangeReasonCode[]

export interface AdminMentoringLogRow {
  logId: string
  teamId: string
  teamName: string
  mentorName: string
  /** '05-26 14:00' — 진행 일시 */
  performedAtLabel: string
  actualMinutes: number
  /** 초안·수정 요청(재제출 전)은 인정 미확정 null */
  recognizedHours: number | null
  /** 잔여 초과분 — 0 이면 '-' 표기 */
  excessHours: number
  status: AdminMentoringLogStatus
  /** 재제출 후 유효 보조 라벨 */
  resubmitted: boolean
}

export interface AdminMentoringLogsData {
  kpis: {
    valid: number
    changeRequested: number
    draft: number
    resubmitted: number
  }
  /** 제출(비초안) 누계 — hero '이번 달 제출 N' (mock 단순화: 전체 = 이번 달) */
  monthlySubmitted: number
  /** 수정 요청(재제출 대기) 건수 — hero '처리 대기 N건' */
  pendingCount: number
  rows: AdminMentoringLogRow[]
}

export interface AdminMentoringLogSnapshotItem {
  order: number
  title: string
  required: boolean
  /** 빈 문자열 = 미입력(선택 항목) */
  answer: string
}

export interface AdminMentoringLogHistoryEntry {
  /** '05-26 16:05' */
  atLabel: string
  /** '제출 (유효)' · '임시 저장 완료' · '수정 요청' */
  actionLabel: string
  tone: 'success' | 'info' | 'neutral'
  actor: string
}

export interface AdminMentoringLogChangeRequestView {
  reasonCode: MentoringLogChangeReasonCode
  reasonLabel: string
  note: string
  requestedAtLabel: string
}

export interface AdminMentoringLogDetail {
  logId: string
  teamId: string
  teamName: string
  /** '4회차' */
  roundLabel: string
  mentorName: string
  /** '2026-05-26 14:00 → 15:30' */
  conductedRangeLabel: string
  actualMinutes: number
  recognizedHours: number | null
  excessHours: number
  /** '온라인 · Zoom' */
  locationLabel: string
  /** 'template v2.1 · 6항목' — 작성 당시 스냅샷 식별 */
  templateLabel: string
  status: AdminMentoringLogStatus
  resubmitted: boolean
  snapshotItems: AdminMentoringLogSnapshotItem[]
  history: AdminMentoringLogHistoryEntry[]
  /** 미해결 수정 요청(change_requested 상태에서만) */
  changeRequest: AdminMentoringLogChangeRequestView | null
}

/** POST /admin/mentoring/logs/{logId}/change-requests — 사유 코드 + 상세 메모 필수(422). */
export interface MentoringLogChangeRequestPayload {
  reasonCode: MentoringLogChangeReasonCode
  note: string
}

// ───────────────────────── 일지 템플릿 (§31) ─────────────────────────

/** 항목 타입 — short_text/long_text 만(선택형·점수형·체크리스트 금지, 422). */
export type AdminTemplateFieldType = 'short_text' | 'long_text'

/** 일지 항목 = 항목명·설명/도움말·필수 여부·표시 순서·타입(§31 도메인 모델). */
export interface AdminTemplateField {
  fieldId: string
  /** 표시 순서 1~N */
  order: number
  name: string
  helpText: string
  required: boolean
  type: AdminTemplateFieldType
}

export interface AdminLogTemplate {
  templateId: string
  name: string
  description: string
  /** 기본 템플릿 — 1개만 가능(단일성 규칙은 BE 미확정 TODO, mock 은 1개 고정) */
  isDefault: boolean
  isActive: boolean
  /** 현 노출 배정(active·early_ended)의 적용 수 — mock 상태 파생 */
  appliedTeamCount: number
  /** '05-19' — 목록 'MM-DD 수정' 표기 */
  updatedAtLabel: string
  fields: AdminTemplateField[]
}

export interface AdminLogTemplatesData {
  /** hero '총 N 템플릿 · 기본 M' */
  summary: { total: number; defaults: number }
  templates: AdminLogTemplate[]
}

/** POST /admin/mentoring/log-templates — 이름 필수. */
export interface TemplateCreatePayload {
  name: string
  description: string
}

/** PATCH /admin/mentoring/log-templates/{templateId} — 항목 전체 교체(추가·수정·삭제·순서). */
export interface TemplateFieldsUpdatePayload {
  fields: AdminTemplateField[]
}

// ───────────────────────── 팀별 일지 항목 (§32) ─────────────────────────

/**
 * 템플릿 대비 차이 — 행 배지·AMBER strip 노출 키.
 * disabled > added > required_changed > desc_changed 우선순위로 단일 표시.
 */
export type TeamLogFieldDiffStatus =
  | 'same'
  | 'desc_changed'
  | 'added'
  | 'required_changed'
  | 'disabled'

/** 팀 일지 항목 — 템플릿 항목 + 팀 오버라이드(비활성 포함). */
export interface AdminTeamLogField extends AdminTemplateField {
  /** 비활성화 항목 — 작성된 답변은 보존(§32) */
  isActive: boolean
}

/** GET /admin/mentoring/assignments/{assignmentId}/log-fields 응답. */
export interface AdminTeamLogFieldsData {
  assignmentId: string
  teamId: string
  teamName: string
  /** 'AI 5기 A반' — hero 컨텍스트 미니 칩 */
  cohortName: string
  mentorName: string
  memberCount: number
  baseTemplateName: string
  /** diff 비교·'템플릿 값 복원' 기준이 되는 기본 템플릿 항목(배정 템플릿) */
  templateFields: AdminTemplateField[]
  /** 현재 저장된 팀 항목(오버라이드 없으면 템플릿 항목 그대로) */
  fields: AdminTeamLogField[]
}

/** PUT /admin/mentoring/assignments/{assignmentId}/log-fields — 변경 일괄 저장. */
export interface TeamLogFieldsSavePayload {
  fields: AdminTeamLogField[]
}

// ───────────────────────── 멘토 통계 (§33) — 조회 전용 ─────────────────────────

/**
 * 통계 요약·필터의 팀 상태 — 정책 enum 7종 중 통계 화면 노출 5종(3206:3024 오버레이).
 * reservation_waiting·early_ended 는 운영 통계 mock 파생 범위 밖(예약은 멘토 콘솔 소관,
 * 조기 종료는 평가 필요/완료로 흡수) — BE 확정 시 정합 TODO.
 */
export type MentoringTeamStatKey =
  | 'in_progress'
  | 'log_needed'
  | 'change_requested'
  | 'evaluation_needed'
  | 'completed'

export type StatEvaluationState = 'submitted' | 'needed' | 'not_eligible'
export type StatRecommendationState =
  | 'recommended'
  | 'not_recommended'
  | 'pending'
export type StatCertificateState = 'reflected' | 'waiting_source' | 'not_target'

/** 멘토/팀별 통계 행 — 수정·변경 요청·보정 액션 없음(403 MENTORING_STATISTICS_READ_ONLY). */
export interface MentorTeamStatRow {
  assignmentId: string
  teamId: string
  teamName: string
  mentorId: string
  mentorName: string
  courseName: string
  cohortLabel: string
  allocatedHours: number
  recognizedHours: number
  /** 제출(비초안) 일지 수 */
  logCount: number
  /** 현재 수정 요청(재제출 대기) 건수 */
  changeRequestCount: number
  teamStatus: MentoringTeamStatKey
  evaluation: StatEvaluationState
  recommendation: StatRecommendationState
  certificate: StatCertificateState
  earlyEnded: boolean
}

export interface AdminMentoringStatisticsData {
  summary: Record<MentoringTeamStatKey, number>
  rows: MentorTeamStatRow[]
}
