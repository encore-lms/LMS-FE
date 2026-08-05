// 운영 대시보드(관제탑형) 타입.
// 담당 기수 스코프: auth 배정(cohortId) + learning 기수 메타를 합친 서술자(MyCohortRef)에
// learning-service 의 HRD-Net 라이브 집계를 얹어 만든다. CSV 인입(staging) 집계는 폐지했다.

/** 담당 기수 서술자 — useMyCohorts()가 auth+learning을 합쳐 만든다. */
export interface MyCohortRef {
  cohortId: string
  courseId: string
  courseName: string
  cohortNo: string
  startDate: string // yyyy-MM-dd
  endDate: string // yyyy-MM-dd
}

export type CohortStatus = 'upcoming' | 'operating' | 'ended'

/** 기수 1개의 집계 묶음. hasData=false면 HRD 라이브가 아직 안 온 기수(지표 null). */
export interface CohortBoard {
  /** 클라이언트 병합 시 표기용 데이터 원천 — staging(인입큐) | hrd-live(HRD-Net 실시간) */
  source?: 'staging' | 'hrd-live'
  cohortId: string
  courseName: string
  cohortLabel: string // "24기"
  startDate: string
  endDate: string
  status: CohortStatus
  /** 종료까지 남은 일수(오늘 기준). 종료 후 음수. */
  daysLeft: number
  hasData: boolean
  students: CohortStudents | null
  attendance: CohortAttendance | null
  assessment: CohortAssessment | null
  weeklyCheck: CohortWeeklyCheck | null
  issues: IssueStudent[]
  /** issues 일별 마크의 날짜 축(최근 5영업일, ISO) — HRD 라이브 병합 시 채움. */
  issueDays?: string[]
}

export interface CohortStudents {
  total: number
  active: number
  dropout: number
}

export interface CohortAttendance {
  todayPresent: number | null
  todayTotal: number | null
  avgRate: number | null
  weekly: DailyRate[]
  todayAbsentees: Absentee[]
}

export interface DailyRate {
  date: string
  rate: number
}

export interface Absentee {
  studentUuid: string
  name: string
  detail: string
}

export interface CohortAssessment {
  avg: number | null
  rounds: RoundAvg[]
  latestRound: number | null
  latestAvg: number | null
  /** 최신 회차 - 직전 회차 평균(회차 1개면 null) */
  delta: number | null
  /** 최신 회차 60점 미만 응시자 수 */
  lowPerformers: number
  /** 최신 회차 미응시자 수 */
  nonTakers: number
}

export interface RoundAvg {
  round: number
  avg: number
}

/** 지각 3회 이상 또는 결석 2회 이상 반복자. */
export interface IssueStudent {
  studentUuid: string
  name: string
  lateCount: number
  absentCount: number
  /** issueDays 축과 같은 길이의 일별 상태('ok'|'late'|'absent'|'none') — 구 BE 응답엔 없음. */
  marks?: string[]
}

/** learning-service 기수 출결 요약(HRD-Net 라이브) — CSV 미인입 기수 병합용. */
export interface CohortHrdSummary {
  cohortLabel: string
  date: string
  students: CohortStudents
  todayPresent: number | null
  todayTotal: number | null
  todayAbsentees: Absentee[]
  avgRate: number | null
  weekly: DailyRate[]
  issues: IssueStudent[]
  /** issues 일별 마크의 날짜 축(최근 5영업일, ISO) — 구 BE 응답엔 없음. */
  issueDays?: string[]
}

/** 위클리 체크 조기경보 — 각 학생의 가장 최근 응답 기준. 데이터 없으면 null. */
export interface CohortWeeklyCheck {
  respondents: number
  lowCondition: number
  counselRequests: number
  flagged: { studentUuid: string; name: string; reason: string }[]
}
