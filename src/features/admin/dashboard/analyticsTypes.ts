// 출석률 분석 응답 타입 — BE GET /admin/dashboard/attendance-analytics(AttendanceAnalytics) 계약과 일치.

export interface AttendanceAnalytics {
  hrdAvailable: boolean
  cohorts: CohortRef[]
  aggregate: AnalyticsStats
  perCohort: CohortStats[]
}

export interface CohortRef {
  cohortId: string
  name: string
}

export interface CohortStats {
  cohortId: string
  name: string
  stats: AnalyticsStats
}

export interface AnalyticsStats {
  statusCounts: StatusCounts
  dailyRates: DailyRate[]
  weekdayRates: WeekdayRate[]
  arrivalBuckets: ArrivalBucket[]
  studentStats: StudentStat[]
  heatmap: Heatmap
}

export interface StatusCounts {
  normal: number
  late: number
  absent: number
  excused: number
}

export interface DailyRate {
  date: string // yyyymmdd
  label: string // "M.D"
  rate: number // 0~100
}

export interface WeekdayRate {
  label: string // 월~금
  rate: number
}

export interface ArrivalBucket {
  label: string
  count: number
  late: boolean
  topStudents: { name: string; count: number }[]
}

export interface StudentStat {
  studentUuid: string
  name: string
  totalDays: number
  presentDays: number
  lateDays: number
  absentDays: number
  excusedDays: number
  rate: number // 0~100
}

export interface Heatmap {
  students: string[]
  days: string[] // yyyymmdd
  points: HeatmapCell[]
}

export interface HeatmapCell {
  x: number // day index
  y: number // student index
  v: number // 0 no-data, 1 normal, 2 late, 3 absent, 4 excused
  label: string
}
