// 과정·기수·교과목 (/admin/education) 도메인 타입 — 기능 로컬.
// BE 계약(P0_22 운영 과정·기수·교과목 마스터) 확정 전이라 mock 가정 + TODO 주석으로 선행한다.

// 상단 KPI 4종 — 과정 / 기수 / 교과목·모듈 / 주차 기준.
export interface EducationSummary {
  /** 과정 수 */
  courses: number
  /** 그중 HRD 연동 과정 수 */
  coursesHrdLinked: number
  /** 기수 수 */
  cohorts: number
  /** 그중 운영중 기수 수 */
  cohortsActive: number
  /** 교과목/모듈 수 (신규 설계 영역) */
  modules: number
  /** 주차 기준 수 (기록실/퀴즈 연결) */
  weeks: number
}

// 모듈 표 한 행 — 기수 하위 교과목/모듈 + 단위기간·담당·연결 기능.
export interface EducationModuleRow {
  id: string
  /** 과정/기수 라벨 — 예: "AI 캠프 22기" */
  cohortLabel: string
  /** 교과목/모듈명 — 예: "Java/Spring 기본" */
  moduleName: string
  /** 단위기간 — 예: "1단위" */
  unit: string
  /** 담당자(강사/멘토) — 예: "김강사" */
  owner: string
  /** 연결 기능 요약 — 예: "퀴즈 4 · 기록실 6주" */
  linkedFeatures: string
}

export interface EducationOverview {
  summary: EducationSummary
  rows: EducationModuleRow[]
}

// 과제(Assignment, learning-service /assignments). 정본 §20.
export interface AssignmentItem {
  id: string
  title: string
  description: string | null
  dueAt: string | null
  createdByUserId: string
  createdAt: string
}

// 이력서 타입은 3역할(운영·강사·수강생) 교차 계약이라 shared 로 승격(2026-08-01).
// admin 내부 임포트 표면 유지를 위한 재수출 — 신규 코드는 '@/shared/types'에서 직접 가져온다.
export type {
  ResumeStatusCode,
  ResumeRow,
  ResumeFeedbackItem,
  ResumeDetail,
} from '@/shared/types'

// 강사/운영 공용 과제(/instructor/assignments) — 실 BE. 과제 탭이 선택 기수로 스코프.
export interface AssignmentCounts {
  submitted: number
  notSubmitted: number
  supplementRequested: number
  reviewDone: number
}
export interface InstructorAssignmentRow {
  id: string
  title: string
  cohortLabel: string
  dueLabel: string
  closed: boolean
  createdByUserId: string
  counts: AssignmentCounts
  badgeStatus: string
  badgeCount: number | null
}
export interface InstructorAssignmentList {
  total: number
  kpi: AssignmentCounts
  items: InstructorAssignmentRow[]
}
export interface AssignmentFormDetail {
  id: string
  cohortId: string
  cohortLabel: string
  title: string
  dueAt: string // "yyyy-MM-dd HH:mm"
  description: string | null
  urls: string[]
  files: string[]
  submittedCount: number
}
export interface AssignmentSubmissionFeedback {
  authorUserId: string
  byStudent: boolean
  text: string
  timeLabel: string
}
export interface AssignmentSubmissionRow {
  id: string
  studentUserId: string
  status: string // submitted | supplement_requested | review_done
  submittedAtLabel: string | null
  bodyText: string | null
  url: string | null
  files: string[]
  feedbacks: AssignmentSubmissionFeedback[]
  history: string[]
}
export interface AssignmentSubmissionsData {
  assignmentId: string
  assignmentTitle: string
  description: string | null
  createdByUserId: string
  createdAtLabel: string
  dueAtLabel: string
  dueLabel: string
  closed: boolean
  counts: AssignmentCounts
  rows: AssignmentSubmissionRow[]
}

// 설명 탭 — HRD-Net 과정 상세(learning-service /detail).
export interface CourseDetail {
  title: string
  trainingType: string // 훈련과정 구분
  ncsName: string // NCS 분류
  institution: string // 훈련기관
  address: string // 소재지
  supportAmount: string // 지원 금액
  manager: string // 담당자
  trainingDays: string // 훈련 일수
  trainingHours: string // 훈련 시간
  // HRD 상세엔 날짜가 없어 BE 가 LMS 기수 운영 기간을 채워 준다.
  trainingStart?: string
  trainingEnd?: string
}

// 기수 프로젝트(정본 §42 Project·§43 ProjectMember) — 운영 조회
export interface CohortProjectMember {
  userId: string
  role: string // OWNER | MEMBER
}
export interface CohortProject {
  id: string
  title: string
  status: string // PLANNED | IN_PROGRESS | COMPLETED
  statusLabel: string // 예정 | 진행 중 | 완료
  createdAt: string
  period: string // "2026.09.01 ~ 2026.10.31"(일정 없으면 빈 문자열)
  tags: string[] // 기술 스택
  memberCount: number
  members: CohortProjectMember[]
  /** 동료 평가 개시 여부 — 프로젝트 종료 후 매니저·강사가 켠다(켜야 팀원이 제출 가능) */
  peerEvalEnabled: boolean
}

/** 동료 평가 결과 — 프로젝트 한 건의 진행 현황과 내용(매니저·강사 조회 전용). */
export interface PeerEvalResults {
  projectId: string
  projectTitle: string
  peerEvalEnabled: boolean
  memberCount: number
  /** 제출 완료 건수(임시저장 제외) */
  submitted: number
  /** 팀원이 서로를 모두 평가했을 때의 건수 — n명이면 n*(n-1) */
  expected: number
  members: PeerEvalMemberProgress[]
  evaluations: PeerEvaluation[]
}

export interface PeerEvalMemberProgress {
  userId: string | null
  name: string
  role: string
  givenSubmitted: number
  givenExpected: number
  receivedSubmitted: number
  /** 받은 평가 4축 평균(제출본만). 받은 게 없으면 null */
  receivedAverage: number | null
}

export interface PeerEvaluation {
  raterUserId: string | null
  raterName: string
  targetUserId: string | null
  targetName: string
  /** 4축 순서 = shared EVALUATION_AXIS_LABELS(2026-08-06 멘토 축 사전 통일) */
  scores: number[]
  average: number
  comment: string | null
  /** 임시저장 — 아직 제출되지 않았다 */
  draft: boolean
  submittedAt: string | null
}

// ── 수강생 평가('수강생 평가' 탭, 2026-08-06 신설) ──

/** 수강생 1명 — scores 는 4축 순서(shared EVALUATION_AXIS_LABELS), 평가 전이면 null. */
export interface StaffStudentEvalEntry {
  studentId: string
  name: string
  scores: number[] | null
  comment: string | null
  updatedAtLabel: string | null
}

/** 기수 평가 시트 — 로스터 전체 + 평가자 본인이 저장한 평가(강사·매니저 각자 독립). */
export interface StaffStudentEvalSheet {
  cohortId: string
  studentCount: number
  evaluatedCount: number
  students: StaffStudentEvalEntry[]
}

// ── 수강생 종합 데이터 탭(2026-08-07 신설) — 스태프 평가 전 평가자 조회 ──

/** 평가 1건 — 평가자(강사/매니저) 정보 포함. scores 순서 = shared EVALUATION_AXIS_LABELS. */
export interface StaffEvalRaterEntry {
  raterUserId: string
  raterName: string
  raterRole: string
  scores: number[]
  comment: string | null
  updatedAtLabel: string
}

export interface StaffEvalStudentEntries {
  studentId: string
  entries: StaffEvalRaterEntry[]
}

/** 기수 전체 — 평가가 있는 수강생만 담긴다. */
export interface StaffEvalAllData {
  cohortId: string
  students: StaffEvalStudentEntries[]
}

/** 수강생 활동 요약('수강생 종합 데이터' 탭) — 과제·퀴즈·QnA, 수강생 1명 기준. */
export interface StudentActivitySummary {
  assignments: {
    total: number
    submitted: number
    supplementRequested: number
    reviewDone: number
    notSubmitted: number
  }
  quizzes: {
    totalOpen: number
    attempted: number
    finalized: number
    avgScorePct: number | null
  }
  qna: { questionCount: number }
}
