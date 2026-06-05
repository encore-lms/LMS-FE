// 수강 역량 증명서 도메인 계약 — 기능 로컬(공유 파일 미오염). Figma 249:27 외.
// 증명서 미리보기(5탭) + 보완 요청 상세 + 공개 설정.

export type CertTab =
  | 'summary'
  | 'tech'
  | 'projects'
  | 'problem-solving'
  | 'growth-reputation'

export type Tone =
  | 'brand'
  | 'info'
  | 'warning'
  | 'danger'
  | 'accent'
  | 'success'

/** 헤더/히어로 */
export interface CertHeader {
  studentName: string
  courseName: string
  cohortName: string
  periodLabel: string // "2025-03-04 — 2025-09-12 · 총 960h"
  certId: string // "abc-1234"
  isPublic: boolean
  status: 'draft' | 'changes_requested' | 'issued'
}

/** 보완이 필요한 항목(미리보기 상단 카드) */
export interface CertChangeFlag {
  id: string
  badge: string // "점수" | "산출물" | "개인정보"
  badgeTone: Tone
  title: string
  detail: string
}

/** KPI 카드 */
export interface CertKpi {
  key: string
  label: string
  value: string
  unit?: string
  delta?: string
  deltaTone?: Tone
}

/** 6축 역량(레이더 + 360 비교) */
export interface CertSkillAxis {
  key: string // 기술/책임감/소통/성장/팀워크/문제해결
  score: number
  peer: number // 360 비교용 동료/기준
  confirmed: boolean
}

/** 점수 막대(퀴즈 카테고리 등) */
export interface CertScoreBar {
  label: string
  score: number
}

/** 근거 요약 한 줄 */
export interface CertEvidence {
  id: string
  label: string
  detail: string
  tone: Tone
}

/** 대표 프로젝트/기록 카드 */
export interface CertProject {
  id: string
  kind: string // "PROJECT" | "RECORD"
  title: string
  meta: string
}

/** 요청 전 체크리스트 */
export interface CertCheckItem {
  id: string
  label: string
  sub: string
  done: boolean
  actionLabel?: string
}

/** 탭1 종합 요약 */
export interface CertSummaryTab {
  overallScore: number
  scoreMax: number
  grade: string
  confirmedLabel: string
  ratioLabel: string // "4 / 5"
  sourceLabel: string // "자동 + 360°"
  kpis: CertKpi[]
  skillAxes: CertSkillAxis[]
  skillAvg: number
  quizCategories: CertScoreBar[]
  evidence: CertEvidence[]
  projects: CertProject[]
  checklist: CertCheckItem[]
  checkDoneLabel: string // "4 / 5"
}

/** 탭2 기술·검증 */
export interface CertCategoryScore {
  label: string
  sub: string
  score: number
}
export interface CertCert {
  name: string
  detail: string
  statusLabel: string
  statusTone: Tone
}
export interface CertAssignmentRow {
  week: string
  title: string
  type: string
  status: string
}
export interface CertTechTab {
  avgScore: number
  certCount: number
  categories: CertCategoryScore[]
  examTrend: number[]
  certs: CertCert[]
  assignments: CertAssignmentRow[]
}

/** 탭3 프로젝트 */
export interface CertProjectCard {
  id: string
  badge: string
  certified: boolean
  title: string
  period: string
  role: string
  contrib: string
  tags: string[]
  outcomes: string[]
}
export interface CertBeforeAfter {
  label: string
  before: string
  after: string
  delta: string
  good: boolean
}
export interface CertArtifact {
  title: string
  meta: string
}
export interface CertProjectsTab {
  certifiedLabel: string
  contribAvg: string
  projects: CertProjectCard[]
  matrix: number[] // 0~3 강도, 주차 순
  beforeAfter: CertBeforeAfter[]
  artifacts: CertArtifact[]
}

/** 탭4 문제해결·협업 */
export interface CertCase {
  id: string
  badge: string
  badgeTone: Tone
  resolved: boolean
  days: string
  title: string
  detail: string
}
export interface CertDistribution {
  label: string
  count: string
  pct: number
  tone: Tone
}
export interface CertTagCloud {
  tag: string
  count: number
  tone: Tone
}
export interface CertTagCase {
  tag: string
  tone: Tone
  detail: string
}
export interface CertProblemTab {
  kpis: CertKpi[]
  cases: CertCase[]
  distribution: CertDistribution[]
  tags: CertTagCloud[]
  tagCases: CertTagCase[]
}

/** 탭5 성장·평판 */
export interface CertReputation {
  key: string
  score: number
  detail: string
}
export interface CertShortComment {
  quote: string
  by: string
  tag: string
}
export interface CertRecommendation {
  role: string
  name: string
  meta: string
  quote: string
  date: string
}
export interface CertGrowthTab {
  timeline: number[]
  startScore: number
  currentScore: number
  reputation: CertReputation[]
  shortComments: CertShortComment[]
  recommendations: CertRecommendation[]
}

// ── 보완 요청 상세(/student/certificate/changes-requested) ──
export interface CertReasonItem {
  id: string
  no: number
  tags: { label: string; tone: Tone }[]
  title: string
  detail: string
  actionLabel: string
}
export interface CertRelatedArea {
  id: string
  letter: string // P/S/R/Pj/Pi
  letterTone: Tone
  label: string
  status: string // "보완 항목 1건" | "보완 사항 없음"
  done: boolean
}
export interface CertChangesData {
  roundLabel: string // "1차 보완 요청"
  summaryTitle: string
  summarySub: string
  reasons: CertReasonItem[]
  relatedAreas: CertRelatedArea[]
  checklist: CertCheckItem[]
  checkDoneLabel: string // "0 / 3"
}

// ── 공개 설정(/student/certificate/publication) ──
export interface CertPublicToggle {
  id: string
  label: string
  sub: string
  on: boolean
  locked?: boolean
}
export interface CertPublicationData {
  issuedLabel: string
  issuedSub: string
  verifyUrl: string
  toggles: CertPublicToggle[]
  preview: {
    name: string
    course: string
    score: number
    attendance: string
    projects: number
    grade: string
  }
  onItems: string[]
  offItems: string[]
}

/** 증명서 미리보기 전체(헤더 + 보완 플래그 + 5탭). */
export interface CertificateOverview {
  header: CertHeader
  changeFlags: CertChangeFlag[]
  summary: CertSummaryTab
  tech: CertTechTab
  projects: CertProjectsTab
  problem: CertProblemTab
  growth: CertGrowthTab
}
