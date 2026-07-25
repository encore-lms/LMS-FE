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

// 이력서(Resume, learning-service /resumes). 정본 §32 lean.
export type ResumeStatusCode = 'DRAFT' | 'COMPLETED'
export interface ResumeRow {
  id: string
  studentUserId: string
  title: string
  status: ResumeStatusCode
  feedbackCount: number
  updatedAt: string
}
export interface ResumeFeedbackItem {
  id: string
  authorUserId: string
  body: string
  createdAt: string
}
export interface ResumeDetail {
  id: string
  studentUserId: string
  title: string
  status: ResumeStatusCode
  content: string | null
  createdAt: string
  updatedAt: string
  feedbacks: ResumeFeedbackItem[]
}

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
