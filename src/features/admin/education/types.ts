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
