// 강사 검토 3종 (P1) — 학습 기록 조회(§13)·프로젝트 검토(§14)·트러블슈팅 검토(§15).
// 공유 읽기전용 계약. 세 화면 모두 KPI 4 + 탭 4 + 7컬럼 큐 골격을 공유한다.

/** KPI 스탯 카드 한 칸 — 값 단위는 표기 문자열에 포함 ('14건' 아님: value=14, unit='건') */
export interface ReviewStat {
  label: string
  value: string
  unit: string
}

// ── §13 학습 기록 조회 (Figma 1422:10009) — 조회 전용, 승인·반려는 매니저 단독 ──
export type InstructorRecordCategory = 'blog' | 'study' | 'cert'
export type InstructorRecordStatus =
  | 'pending' // 대기
  | 'changes_requested' // 보완 요청
  | 'approved' // 승인
  | 'rejected' // 반려

export interface InstructorRecordRow {
  id: string
  studentName: string
  cohortLabel: string
  category: InstructorRecordCategory
  title: string
  submittedAt: string | null // '05-17 21:14'
  status: InstructorRecordStatus
  attachments: number | null // 📎 N (null = '-')
}

export interface InstructorRecordReviewData {
  stats: ReviewStat[] // 제출 현황·보완 요청 중·최근 승인·최근 반려
  counts: { all: number; blog: number; study: number; cert: number }
  rows: InstructorRecordRow[]
}

// ── §14 프로젝트 검토 (Figma 1422:10276) — 발표 후 인증 큐 ──
export type ProjectCertReviewStatus =
  | 'requested' // 인증 요청
  | 'supplementing' // 보완 중
  | 'certified' // 인증 완료

export interface ProjectReviewRow {
  id: string
  name: string // '팀 Nexus · 데이터 파이프라인'
  cohortLabel: string
  team: string // '5명 (PM 박지훈)'
  stack: string // 'Airflow · BigQuery · dbt'
  artifacts: string | null // 'GitHub · 발표' (null = '-')
  status: ProjectCertReviewStatus
}

export interface ProjectReviewData {
  stats: ReviewStat[] // 인증 요청 대기·보완 중·이번 달 인증·평균 검토 일수
  counts: {
    all: number
    requested: number
    supplementing: number
    certified: number
  }
  rows: ProjectReviewRow[]
}

// ── §15 트러블슈팅 검토 (Figma 1422:10543) — STAR 사례 인증 큐 ──
export type TsReviewStatus =
  | 'pending' // 검토 대기
  | 'supplementing' // 보완 중
  | 'certified' // 인증 완료

export interface TsReviewRow {
  id: string
  studentName: string
  cohortLabel: string
  title: string // 'Airflow DAG 메모리 누수 추적'
  category: string // '성능최적화'
  solvedBy: string | null // '독립' | '협업' (null = '-')
  durationDays: string | null // '3일'
  project: string | null // '팀 Nexus' (null = '-')
  status: TsReviewStatus
}

export interface TsReviewData {
  stats: ReviewStat[] // 검토 대기·독립해결 비율·평균 소요일수·이번 달 인증
  counts: {
    all: number
    pending: number
    supplementing: number
    certified: number
  }
  rows: TsReviewRow[]
}
