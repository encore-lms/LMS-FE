// 강사 과제·실습 Main Flow (/instructor/assignments*) 타입. (Figma 2236:10561·10651, 2750:1547~1974)
// 점수 없음 — 상태 전이(제출완료→보완요청/검토완료)와 피드백 스레드만 다룬다 (P0 30).

/** 학생 제출 상태. 행 대표 배지에도 동일 enum을 쓴다. */
export type AssignmentSubmissionStatus =
  | 'not_submitted'
  | 'submitted'
  | 'supplement_requested'
  | 'review_done'

/** 제출/미제출/보완요청/검토완료 카운트 — 목록 KPI·제출 현황 헤더 공용. */
export interface AssignmentCounts {
  submitted: number
  notSubmitted: number
  supplementRequested: number
  reviewDone: number
}

export interface InstructorAssignmentRow {
  id: string
  title: string
  /** 과목/회차 — 예: '백엔드 5회차' */
  subject: string | null
  cohortLabel: string
  /** 'D-2' 등 — closed면 '마감됨'으로 표기 */
  dueLabel: string
  closed: boolean
  /** 작성자 사용자 ID — FE에서 운영 계정명으로 join */
  createdByUserId: string
  counts: AssignmentCounts
  /** 행 대표 배지 — 지배 상태 + 건수(null이면 라벨만) */
  badgeStatus: AssignmentSubmissionStatus
  badgeCount: number | null
}

export interface InstructorAssignmentListData {
  total: number
  kpi: AssignmentCounts
  items: InstructorAssignmentRow[]
}

/** 생성/수정 폼 상세 (/instructor/assignments/:assignmentId) */
export interface AssignmentFormDetail {
  id: string
  cohortId: string
  cohortLabel: string
  subject: string | null
  title: string
  dueAt: string
  description: string | null
  urls: string[]
  files: string[]
  submittedCount: number
}

export interface AssignmentFeedbackItem {
  /** 작성자 사용자 ID — FE에서 이름 join */
  authorUserId: string
  timeLabel: string
  text: string
  byStudent: boolean
}

export interface AssignmentSubmissionRow {
  id: string
  /** 제출자 사용자 ID — FE에서 이름/코드 join */
  studentUserId: string
  status: AssignmentSubmissionStatus
  /** 제출 시각 — 미제출은 null */
  submittedAtLabel: string | null
  bodyText: string | null
  url: string | null
  files: string[]
  feedbacks: AssignmentFeedbackItem[]
  history: string[]
}

export interface AssignmentSubmissionsData {
  assignmentId: string
  assignmentTitle: string
  subject: string | null
  description: string | null
  createdByUserId: string
  createdAtLabel: string
  dueAtLabel: string
  dueLabel: string
  closed: boolean
  counts: AssignmentCounts
  rows: AssignmentSubmissionRow[]
}
