// 운영 대시보드 응답 타입 — BE GET /admin/dashboard (AdminOperatorDashboard) 계약과 일치.
// 이전 LMS 매니저 대시보드 IA를 현재 데이터에 맞춰 포팅.

export interface AdminOperatorDashboard {
  today: string // yyyy-MM-dd (KST)
  hrdAvailable: boolean // 활성 HRD-Net 키 존재 여부 — false면 출석 지표가 비어있음
  cohorts: DashboardCohort[]
  repeatedIssues: RepeatedIssue[]
  pending: PendingApprovals
  upcoming: Upcoming
}

export interface DashboardCohort {
  cohortId: string
  name: string // "{과정명} N기"
  totalStudents: number | null // HRD 미가용 시 null
  checkedInToday: number | null // HRD 미가용 시 null
  absentToday: Absentee[] // HRD 미가용 시 []
  weeklyAttendanceRate: number[] // 최근 영업일 출석률(0~100), 없으면 []
}

export interface Absentee {
  id: string
  name: string
}

export interface RepeatedIssue {
  studentId: string
  name: string
  cohortName: string
  lateCount: number
  absenceCount: number
}

export interface PendingApprovals {
  mileage: number
  blog: number
  study: number
  certificate: number
  recordsTotal: number
  topCohort: {
    mileage: string | null
    blog: string | null
    study: string | null
    certificate: string | null
  }
}

export interface Upcoming {
  quizzes: UpcomingQuiz[]
  cohortEndings: CohortEnding[]
}

export interface UpcomingQuiz {
  id: string
  title: string
  cohortName: string
  endAt: string // ISO datetime
  questionCount: number
  totalScore: number
}

export interface CohortEnding {
  cohortId: string
  name: string
  endDate: string // yyyy-MM-dd
  daysLeft: number
}
