// 수강생 대시보드 도메인 계약 — 기능 로컬(공유 파일 미오염). BE 합류 시 페어가 정합.
// 대시보드는 여러 도메인 요약을 한 endpoint로 합쳐 받는다(StudentDashboardSummary).
// 정책(§2): 증명서 위젯·6축 역량·강의 진도율·채점 대기·랭킹·커뮤니티 피드는 대시보드에 노출 안 함.
import type { AppNotification } from '@/shared/types'
import type { Tone as BaseTone } from '@/shared/lib/tone'

/** 시맨틱 색조 — 칩/배지/점/막대의 @theme 토큰 매핑 키(components/tone.ts) */
export type Tone = BaseTone | 'neutral'

/** 상단 환영 배너 */
export interface DashboardHero {
  studentName: string
  courseName: string
  cohortName: string
  totalWeeks: number
  currentWeek: number
  progressPct: number // 0~100
  todayLabel?: string // "MONDAY · 2026.05.13" — Figma 시안의 상단 날짜 줄
}

/** 요약 KPI 카드(Figma 2455:5068) — 라벨+색점 / 숫자+델타칩 / 진행 트랙바 / 캡션 */
export type KpiTone = Exclude<Tone, 'neutral'>
export interface DashboardKpiDelta {
  label: string // "+2%p" | "D-1" | "✓ 클리어"
  tone: 'success' | 'warning' | 'danger'
}
export interface DashboardKpiItem {
  key: string
  label: string
  value: string
  unit?: string // "%" | "건"
  tone: KpiTone // 색점·트랙바 색
  barPct: number // 0~100 트랙 채움
  delta?: DashboardKpiDelta
  caption: string // 하단 보조 한 줄
}
export interface DashboardKpis {
  items: DashboardKpiItem[]
}

/** 할 일 1건 (오늘/이번 주) */
export interface DashboardTodo {
  id: string
  category: string // 퀴즈 / 과제 / 프로젝트 / 학습
  categoryTone: Tone // 카테고리 라벨 색
  title: string
  due: string // "오늘 23:59" / "D-1 · 5/14" / "이번 주말"
  dueKind: 'today' | 'soon' | 'week' // today=빨강 채움칩 · week=회색칩 · soon=무지칩 텍스트
  to: string
}

/** 마감 임박 퀴즈 1건 */
export interface DashboardDeadlineQuiz {
  id: string
  category: string // BACKEND / DATABASE 등 과목 태그
  categoryTone: Tone
  title: string
  meta: string // "30분 · 15문항"
  due: string // "D-1" 등
  dueTone: Tone // D-day 칩 색(임박할수록 danger)
  to: string
}

/** 멘토링 요약 통계 1셀 */
export interface DashboardMentoringStat {
  key: string
  label: string // 요청 대기 / 조정 제안 / 확정 예약 / 최근 완료
  caption: string // 팀 요청 후 미응답 등
  value: number
  tone: Tone // 숫자·배경 색조
}
/** 멘토링 요약 — 통계 4셀 + 안내 셀 */
export interface DashboardMentoring {
  stats: DashboardMentoringStat[]
  note: { title: string; caption: string }
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
  calendar: {
    year: number
    month: number
    today: string // YYYY-MM-DD — "오늘" 강조 + 현재 주 행 강조 기준
    days: DashboardAttendanceDay[]
  }
  summary: {
    presentDays: number
    totalDays: number
    attendanceRate: number // 0~100
    streakDays: number // 연속 출석
    lateCount: number
    absentCount: number
    earlyLeaveCount: number
    outingCount: number
  }
  trend: { week: string; rate: number }[] // 최근 8주 출석률
}

/** 공지 1건 (운영/강사) */
export interface DashboardNotice {
  id: string
  tag: string // 긴급 / 공지 / 일반
  tagTone: Tone
  dateLabel: string // "5/20"
  title: string
  relativeTime: string // "1시간 전"
}

/** 시스템 알림 1건 (본인 관련 이벤트) — 헤더 알림 벨과 공용 계약(shared/types) 단일 타입 */
export type DashboardNotification = AppNotification

/** 진행 중 프로젝트 1건 */
export interface DashboardProject {
  id: string
  title: string
  subtitle: string // "PM · 백엔드 2주차"
  accentTone: Tone // 좌측 액센트 바 색
  progressPct: number // 0~100
  status: { label: string; tone: Tone } // 인증 중 / 검토 중 / 인증
  to: string
}

/** 최근 트러블슈팅 1건 */
export interface DashboardTroubleshooting {
  id: string
  tag: string // BACKEND / DEPLOY / PERF 등
  tagTone: Tone
  title: string
  resolved: boolean // 독립 해결(✓ 표시)
  dayLabel: string // "3일"
  to: string
}

/** 대시보드 전체 요약 (한 endpoint 응답) */
export interface StudentDashboardSummary {
  hero: DashboardHero
  kpis: DashboardKpis
  todos: DashboardTodo[]
  deadlineQuizzes: DashboardDeadlineQuiz[]
  mentoring: DashboardMentoring
  attendance?: DashboardAttendance | null
  notices: DashboardNotice[]
  notifications: DashboardNotification[]
  projects: DashboardProject[]
  troubleshooting: DashboardTroubleshooting[]
}
