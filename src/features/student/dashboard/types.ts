// 수강생 대시보드 도메인 계약 — 기능 로컬(공유 파일 미오염). BE 합류 시 페어가 정합.
// 대시보드는 여러 도메인 요약을 한 endpoint로 합쳐 받는다(StudentDashboardSummary).
// 정책(§2): 증명서 위젯·6축 역량·강의 진도율·채점 대기·랭킹·커뮤니티 피드는 대시보드에 노출 안 함.

/** 상단 환영 배너 */
export interface DashboardHero {
  studentName: string
  courseName: string
  cohortName: string
  totalWeeks: number
  currentWeek: number
  progressPct: number // 0~100
}

/** 요약 KPI 4종 */
export interface DashboardKpis {
  attendanceRate: number // 출석률 %
  pendingQuizzes: number // 미응시 퀴즈
  pendingRecords: number // 승인 대기 기록
  changeRequests: number // 보완 요청
}

/** 할 일 1건 (오늘/이번 주) */
export interface DashboardTodo {
  id: string
  category: string // 퀴즈 / 블로그 / 과제 등
  title: string
  due: string // "오늘" / "D-3" 등 표시 문자열
  to: string // 이동 경로
}

/** 마감 임박 퀴즈 1건 */
export interface DashboardDeadlineQuiz {
  id: string
  category: string // BACKEND 등 과목 태그
  title: string
  due: string // "D-1" 등
  to: string
}

/** 멘토링 요약 카운트 */
export interface DashboardMentoring {
  waiting: number // 대기
  reserved: number // 예약
  completed: number // 완료
  recent: number // 최근 활동
}

/** 출결 영역 — 미니 캘린더 + 누적 + 8주 추이 */
export type DashboardAttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'EARLY_LEAVE'
  | 'OUTING'
  | 'ABSENT'

export interface DashboardAttendanceDay {
  date: string // YYYY-MM-DD
  status: DashboardAttendanceStatus | null
}

export interface DashboardAttendance {
  calendar: { year: number; month: number; days: DashboardAttendanceDay[] }
  cumulative: {
    presentDays: number
    lateCount: number
    earlyLeaveCount: number
    outingCount: number
    absentCount: number
  }
  trend: { week: string; rate: number }[] // 최근 8주 출석률
}

/** 공지 1건 (운영/강사) */
export interface DashboardNotice {
  id: string
  tag: string // 시스템 / 공지 등
  title: string
  date: string
}

/** 시스템 알림 1건 (본인 관련 이벤트) */
export interface DashboardNotification {
  id: string
  title: string
  date: string
}

/** 진행 중 프로젝트 1건 */
export interface DashboardProject {
  id: string
  title: string
  members: number
  certified: boolean // 인증 여부 배지
  to: string
}

/** 최근 트러블슈팅 1건 */
export interface DashboardTroubleshooting {
  id: string
  tag: string // BACKEND 등
  title: string
  date: string
  to: string
}

/** 대시보드 전체 요약 (한 endpoint 응답) */
export interface StudentDashboardSummary {
  hero: DashboardHero
  kpis: DashboardKpis
  todos: DashboardTodo[]
  deadlineQuizzes: DashboardDeadlineQuiz[]
  mentoring: DashboardMentoring
  attendance: DashboardAttendance
  notices: DashboardNotice[]
  notifications: DashboardNotification[]
  projects: DashboardProject[]
  troubleshooting: DashboardTroubleshooting[]
}
