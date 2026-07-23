// 강사 검토 3종 (P1) — 학습 기록 조회(§13)·프로젝트 검토(§14)·트러블슈팅 검토(§15).
// 공유 읽기전용 계약. 세 화면 모두 KPI 4 + 탭 4 + 7컬럼 큐 골격을 공유한다.

/** KPI 스탯 카드 한 칸 — 값 단위는 표기 문자열에 포함 ('14건' 아님: value=14, unit='건') */
export interface ReviewStat {
  label: string
  value: string
  unit: string
}

// ── §13 학습 기록 조회 (Figma 1422:10009) — 강사 조회 전용 그리드 ──
// 강사는 조회만: 운영(매니저)가 내린 승인/반려/검토중 결정과 마일리지·지급 상태를
// 확인만 한다. 승인·반려 액션 없음(canReviewRecord=false — 02_강사.md §13).
// 블로그·스터디는 수강생×주차 히트맵 + 셀 클릭 모달, 자격증은 PCCE/PCCP/PCSQL 매트릭스.
export type InstructorRecordCategory = 'blog' | 'study' | 'cert'

// 매니저 결정 = 셀 색: 승인(초록)·검토중(주황)·반려(빨강)·미제출(회색)
export type RecordCellStatus = 'approved' | 'pending' | 'rejected' | 'none'

// 상단 기수 탭 (예: '29기')
export interface RecordCohortTab {
  id: string
  label: string
}

// 과정 선택 — 과정마다 소속 기수 목록을 함께 가진다(과정 전환 시 기수 갱신).
export interface RecordCourseTab {
  id: string
  label: string // 'SK네트웍스 Family AI 캠프'
  cohorts: RecordCohortTab[]
}

// 그리드 열 = 주차 (예: {no:1, label:'3월 1주차'})
export interface RecordWeek {
  no: number
  label: string
}

export interface RecordGridStudent {
  id: string
  name: string // '김은진'
  birth: string // '1995-09-08'
  atRisk?: boolean // 위험 강조 행(핑크 배경) — 미제출/이탈 우려
}

// 블로그 탭 행 — 주차별 제출 현황 + 완주 수
export interface BlogGridRow {
  student: RecordGridStudent
  cells: Record<number, RecordCellStatus> // weekNo → 상태
  submissionIds: Record<number, string> // weekNo → 모달 열기용 제출 id
  completed: number // 완주(승인) 수
  total: number // 목표 회차 (예: 26)
}

// 스터디 탭 행 — 주차별 현황 + 연속 주차 + 마일리지 지급
export interface StudyGridRow {
  student: RecordGridStudent
  cells: Record<number, RecordCellStatus>
  submissionIds: Record<number, string>
  streakWeeks: number // 연속 N주
  mileagePaid: boolean // 마일리지 지급 완료 여부
}

// 자격증 탭 — 주차 무관, 자격증 종류별 검토 상태 매트릭스
export type CertType = 'PCCE' | 'PCCP' | 'PCSQL'

export interface CertGridRow {
  student: RecordGridStudent
  certs: Record<CertType, RecordCellStatus> // 종류별 매니저 결정 상태
  submissionIds: Partial<Record<CertType, string>> // 제출 있는 종류 → 상세 패널 id
  mileage: number // 지급/후보 마일리지 합계(P) · 0 = 없음
  paid: boolean // 지급 완료 여부
}

// 블로그 모달 상세 (읽기 전용 + 매니저 결정)
export interface BlogRecordDetail {
  studentName: string
  weekLabel: string // '6월 4주차'
  status: RecordCellStatus // 매니저 결정
  url: string
  submittedAt: string // '2026-06-29'
  managerComment: string | null
}

// 스터디 모달 상세 (읽기 전용 + 매니저 결정)
export interface StudyRecordDetail {
  studentName: string
  title: string // 'skn29기 예복습 스터디 7회차'
  status: RecordCellStatus
  submittedAt: string // '2026-05-08'
  timeRange: string // '18:00 ~ 19:00'
  attachmentCount: number
  evidenceImageUrl: string | null // 증빙 사진(없으면 플레이스홀더)
  managerComment: string | null
}

// 자격증 모달 상세 (읽기 전용 + 매니저 결정)
// ⚠️ 증빙 링크·이미지 열람 가능 여부는 운영·수강생 화면과 정합 확인 필요(BE 계약 대기).
export interface CertRecordDetail {
  studentName: string
  certType: CertType // 'PCSQL'
  grade: string // 'Lv.3' — 등급(합격 표기용)
  status: RecordCellStatus // 매니저 결정
  holderName: string // 응시자명(OCR 후보)
  acquiredAt: string // 취득일 '2026-05-27'
  submittedAt: string // 제출일
  fileName: string // 증빙 파일명 'PCSQL.png'
  url: string | null // 증빙 링크(있으면)
  evidenceImageUrl: string | null // 증빙 이미지(없으면 플레이스홀더)
  mileage: number // 이 수강생 자격증 마일리지 총액(P)
  mileageBreakdown: string // 지급 근거 자격증 표기 'PCCP 50,000P' · 없으면 ''
  paid: boolean // 지급 완료 여부
  managerComment: string | null
}

// 강사 학습 기록 조회 — 한 (과정·기수) 전체 데이터
export interface InstructorRecordReviewData {
  courses: RecordCourseTab[] // 상단 과정 선택 목록(각 과정이 기수 목록 보유)
  activeCourseId: string // 응답 기준 과정
  activeCohortId: string // 응답 기준 기수
  weeks: RecordWeek[] // 그리드 열(블로그·스터디 공용)
  blog: BlogGridRow[]
  study: StudyGridRow[]
  cert: CertGridRow[]
  blogDetails: Record<string, BlogRecordDetail> // submissionId → 상세
  studyDetails: Record<string, StudyRecordDetail> // submissionId → 상세
  certDetails: Record<string, CertRecordDetail> // submissionId → 상세
}

// ── §14 프로젝트 검토 (Figma 1422:10276) — 발표 후 인증 큐 ──
export type ProjectCertReviewStatus =
  | 'requested' // 인증 요청
  | 'supplementing' // 보완 중
  | 'certified' // 인증 완료

export interface ProjectReviewRow {
  id: string
  name: string // '팀 Nexus · 데이터 파이프라인'
  cohortId?: string | null // 실 기수 UUID(허브 임베드 스코프용) — mock/구버전은 없을 수 있음
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
