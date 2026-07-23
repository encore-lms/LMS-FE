// 강사 콘솔 골격 (P0 36) — 대시보드(§1)·담당 과정/기수(§2)·수강생 목록(§3).
// 공유 읽기전용 계약. 퀴즈 계약(instructorQuiz.ts)과 분리.

// ── §1 강사 대시보드 (Figma 1268:7456) ──
export interface InstructorCohortChip {
  id: string
  label: string // 'DA 4기 · 진행 중'
}

export type PriorityType =
  | 'supplement' // 보완
  | 'manual_grading' // 수동 채점
  | 'project_cert' // 프로젝트 인증
  | 'ts_review' // 트러블슈팅 검토

export interface PriorityItem {
  id: string
  type: PriorityType
  title: string // '점수 재검토 보완 응답'
  subtitle: string // '박지훈 · FE 7기'
  dday: string // 'D+5'
  urgent: boolean // D+N 클수록 긴급 — 행 강조·primary 버튼
  actionLabel: string // 확인 / 채점 시작 / 검토
  to: string // 이동 라우트
}

export interface DashboardKpi {
  value: number
  hint: string // '수동 채점 9 · 자동 재검토 5'
  /** 우상단 보조 배지 — '오늘 +3' | '긴급' (없으면 미노출) */
  badge?: string
}

export interface InstructorDashboardData {
  instructorName: string
  cohortCount: number
  cohorts: InstructorCohortChip[]
  kpiGrading: DashboardKpi
  kpiProjects: DashboardKpi
  kpiSupplements: DashboardKpi
  priorities: PriorityItem[]
  shortcuts: {
    quizzes: { badge: number; hint: string }
    students: { hint: string }
    reviews: { badge: number; hint: string }
  }
}

// ── §2 담당 과정/기수 (Figma 1324:9636) ──
export type CohortStatus = 'operating' | 'upcoming' | 'ended' // 진행 중 / 예정 / 종료
export type InstructorRole = 'lead' | 'assist' | 'mentor' // 강사 / 보조 강사 / 멘토

export interface InstructorCohortRow {
  id: string
  name: string // 'DA 4기'
  subtitle: string // '데이터 분석 · 4회차'
  period: string // '2026.03.01 ~ 2026.05.31'
  dday: string // 'D-12'
  role: InstructorRole
  students: number
  riskCount: number
  evalSummary: string // '미응시 3 · 제출 18'
  evalPending: string // '채점 대기 9'
  reviewSummary: string // '기록 4 · 프로젝트 2 · 트러블 1'
  reviewPending: string // '대기 7건'
  status: CohortStatus
}

export interface InstructorCohortsData {
  total: number
  operating: number
  upcoming: number
  ended: number
  summary: {
    operatingCourses: { value: number; hint: string }
    students: { value: number; hint: string }
    gradingPending: { value: number; hint: string }
    reviewPending: { value: number; hint: string }
  }
  rows: InstructorCohortRow[]
}

// ── §3 수강생 목록 (Figma 1330:9675) ──
export type StudentCertStatus =
  | 'requested' // 요청됨
  | 'reviewing' // 검토 중
  | 'changes_requested' // 보완 요청
  | 'certified' // 인증 완료
  | 'drafting' // 작성 중

export interface CohortStudentRow {
  id: string
  name: string
  emailUuid: string // 'park.jh@playdata · ghi-9012'
  cohortLabel: string
  certStatus: StudentCertStatus
  quizAvg: string // '평균 78.2'
  quizDetail: string // '미응시 0 · 채점 1'
  recordApproved: string // '승인 8'
  recordDetail: string // '대기 0 · 반려 1'
  projectStatus: StudentCertStatus // 프로젝트 상태도 동일 pill 5종 사용
  /** 위험 플래그 — 결측/점수 재검토/개인정보/미승인 산출물 (빈 배열 = 없음) */
  riskFlags: string[]
}

export interface CohortStudentsData {
  cohortLabel: string // 'DA 4기'
  total: number
  riskTotal: number
  rows: CohortStudentRow[]
}
