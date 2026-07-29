// 수강 역량 증명서 도메인 계약 — 기능 로컬(공유 파일 미오염). Figma 249:27 외.
// 증명서 미리보기(5탭) + 보완 요청 상세 + 공개 설정.

export type CertTab =
  | 'summary'
  | 'tech'
  | 'projects'
  | 'problem-solving'
  | 'growth-reputation'
  | 'resume' // 이력서 프로필 뷰 — /student/resume 작성분을 링크드인식으로 표시
  | 'ai-analysis' // v2 (CERT_V2): AI 분석 통합 탭

import type { Tone } from '@/shared/lib/tone'
export type { Tone }

/** 증명서 라이프사이클 상태 (draft→under_review→issued/changes_requested) */
export type CertStatus =
  | 'draft' // 정식 인증 전(미리보기)
  | 'under_review' // 요청 접수 · 매니저 검토 중
  | 'changes_requested' // 보완 요청
  | 'issued' // 정식 인증 완료

/** 헤더/히어로 */
export interface CertHeader {
  studentName: string
  courseName: string
  cohortName: string
  periodLabel: string // "2025-03-04 — 2025-09-12 · 총 960h"
  certId: string // "abc-1234"
  isPublic: boolean
  status: CertStatus
}

/** 보완이 필요한 항목(미리보기 상단 카드) */
export interface CertChangeFlag {
  id: string
  badge: string // "필수" | "주의"
  badgeTone: Tone
  title: string
  detail: string
  cta: string // "프로필 이동" | "기록실 이동" | "공개 항목 수정"
}

/** 요청 전 체크리스트(미리보기 하단) — 5개 충족 시 정식 인증 요청 가능 */
export interface CertReqCheck {
  id: string
  pass: boolean // ✓ 통과 / ! 미충족
  label: string
  sub: string
  cta?: string // 미충족 시 이동 라벨("프로필 이동")
}

/** KPI 카드 */
export interface CertKpi {
  key: string
  label: string
  value: string
  unit?: string
  // 구 데이터 탭 KPI — 델타 칩 (tech/projects/problem/growth, 점진 마이그레이션 대상)
  delta?: string
  deltaTone?: Tone
  // 신 종합요약 KPI (Figma '탭1 종합요약 상세') — 색점 + 진행바 + 보조설명
  tone?: Tone // 색점 + 진행바 색
  bar?: number // 0~100 진행바 채움
  sub?: string // 하단 보조 설명 (예: "768 / 800 시간 · 지각 2회")
}

/** 360° 비교 역량축 (기술/책임감/소통/성장/팀워크/문제해결) */
export interface CertSkillAxis {
  key: string
  score: number
  peer: number // 360 비교용 동료/기준 (표시값 = peer/20, 5점 만점)
  confirmed: boolean
  note?: string // 360 강사·근거 열 텍스트 (없으면 confirmed 배지)
}

/** 6축 절대점수·기수 상대 위치 비교 레이더 축 */
export interface CertRadarAxis {
  key: string
  score: number | null
  relativePercentile: number | null
  relativeTopPercent: number | null
  detail: string
  source: string
  status: 'READY' | 'NOT_READY' | 'ERROR'
  relativeStatus: 'READY' | 'NOT_READY'
  relativeScope: 'COHORT' | 'ALL_STUDENTS'
  relativePopulationSize: number
  relativeDetail: string
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
  scoreDelta?: string // "+4점 지난주" — 종합 점수 카드 델타 칩
  confirmedLabel: string
  ratioLabel: string // "4 / 5"
  sourceLabel: string // "자동 + 360°"
  kpis: CertKpi[]
  skillAxes: CertSkillAxis[] // 6축 자동 산정 레이더 + 360° 비교 공용 축
  skillAvg: number
  quizCategories: CertScoreBar[]
  evidence: CertEvidence[]
  projects: CertProject[]
  checklist: CertCheckItem[]
  checkDoneLabel: string // "4 / 5"
  // v2 (CERT_V2): AI 프로파일링·페르소나·도메인 도넛·온톨로지 맵
  aiProfile?: CertAiProfile
  personas?: CertPersona[]
  domains?: CertDomain[]
  ontology?: CertOntology
}

// ── v2 공통 타입 (CERT_V2 플래그 — AI 분석·동료 대비·관계 시각화. 끄면 무시됨) ──
export interface CertAiProfileRow {
  label: string // 업무/리더십/학습/소통/기술
  value: string
}
export interface CertAiProfile {
  rows: CertAiProfileRow[]
  summary: string // AI 한줄 요약
  strengths: string // 핵심 강점
  growth: string // 성장 포인트
}
export interface CertPersona {
  rank: number
  title: string
}
export interface CertDomain {
  label: string
  pct: number
  projectCount?: number
  tone: Tone
}
export interface CertAiVerdict {
  strength: string // 강점
  gap: string // 보완
  unique: string // 특이형
}
export type OntologyKind =
  | 'self'
  | 'subject'
  | 'skill'
  | 'method'
  | 'project'
  | 'domain'
export interface CertOntologyNode {
  id: string
  label: string
  x: number // 0~100 (viewBox 비율)
  y: number // 0~100
  kind: OntologyKind
}
export interface CertOntology {
  nodes: CertOntologyNode[]
  edges: [string, string][] // 노드 id 쌍
}
/** 탭3 프로젝트 v2 */
export interface CertProjectsAi {
  summary: string
}
/** 탭4 문제해결·협업 v2 */
export interface CertProblemCap {
  label: string
  score: number
  tag: string // 연결 PeerTag
  tone: Tone
}
export interface CertProblemAi {
  caps: CertProblemCap[]
  style: string // 스타일 종합
  scaling: string // 확장 종합
}
/** 탭5 성장·평판 v2 — AI 상담 감성·키워드 버블 */
export type SentimentPhase = 'early' | 'mid' | 'late'
export interface CertSentimentBubble {
  label: string
  x: number // 0~100
  y: number // 0~100
  r: number // 반지름(px, viewBox 기준)
  phase: SentimentPhase
}
export interface CertSentiment {
  bubbles: CertSentimentBubble[]
  trend: string // "V자 변동형: 위기(4회차)→멘토링→급반등"
}

/** 탭2 기술·검증 */
export interface CertCategoryScore {
  label: string
  sub: string
  score: number
  percentile?: string // v2: 동료 대비 "상위 5%" (CERT_V2)
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
  aiVerdict?: CertAiVerdict // v2: AI 기술 종합 판단 (CERT_V2)
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
export interface CertProjectsTab {
  certifiedLabel: string
  contribAvg: string
  projects: CertProjectCard[]
  matrix: number[] // 0~3 강도, 주차 순
  ai?: CertProjectsAi // v2 (CERT_V2)
  commitActivity?: CertProjectActivity[] // v2: 프로젝트별 커밋 잔디밭(선택형)
}
/** 탭3 v2 — 프로젝트별 커밋 활동(레포 단위 잔디밭 + 참여 일관성 지표) */
export interface CertProjectActivity {
  id: string
  name: string
  period: string // "2026.02.03 ~ 2026.04.18"
  weeksLabel: string // "11주"
  certified: boolean
  grid: number[][] // weeks × 7(요일), 칸당 커밋 수
  totalCommits: number
  activeDays: number
  totalDays: number
  longestStreak: number
  weeklyAvg: number
  contrib: string // "38%"
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
  ai?: CertProblemAi // v2 (CERT_V2)
}

/** 탭5 성장·평판 */
export interface CertGrowthTimelinePoint {
  date: string
  type: string
  title: string
  score: number
}
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
  timeline: CertGrowthTimelinePoint[]
  startScore?: number
  currentScore?: number
  peerAverage?: number
  peerEvaluationCount?: number
  reputation: CertReputation[]
  shortComments: CertShortComment[]
  recommendations: CertRecommendation[]
  sentiment?: CertSentiment // v2 (CERT_V2)
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
  requestedAt: string // "2026-05-12 14:30"
  reviewer: string // "매니저 박지수"
  replyWithin: string // "1영업일 이내"
  reasons: CertReasonItem[]
  relatedAreas: CertRelatedArea[]
  checklist: CertCheckItem[]
  checkDoneLabel: string // "0 / 3"
}

// ── 공개 설정(/student/certificate/publication) — Figma 255:27 ──
export interface CertPublicToggle {
  id: string
  label: string
  sub: string
  on: boolean
  locked?: boolean
}
export interface CertPubItem {
  mark: 'check' | 'dot' // ✓ 노출 / · 비노출
  text: string
}
export interface CertPublicationData {
  issuedBadge: string // "CERTIFIED · 정식 인증 완료"
  issuedLabel: string // "수강 역량 증명서 발급 완료"
  issuedSub: string // "김수강 · 백엔드 부트캠프 3기 · 인증일 2026.05.14"
  verifyId: string // "VERIFY-2026-BB23-K1234"
  urlIssueDate: string // "2026-05-15 · 다음날 자동 활성"
  verifyUrl: string // "/verify/..." (새 탭 이동용 토큰 경로)
  publicUrl: string // "https://verify.playdata.io/v/abc123ef9456" (표시·복사용)
  // 외부 검증 URL 공개 토글(별도 카드 + 안내 행)
  urlToggle: CertPublicToggle & { badge: string; info: string }
  // 성장·평판 공개 항목(PeerReputation / ShortComment)
  growthToggles: CertPublicToggle[]
  // 강사·멘토 추천서 — 개별 토글 없음(자동 포함)
  recommendRow: { label: string; tag: string; sub: string; chip: string }
  preview: {
    name: string
    period: string // "백엔드 부트캠프 · 3기 · 2025.11 ~ 2026.05"
    metrics: { v: string; l: string }[] // 86 종합 점수 / 96% 출석률 / 2 인증 프로젝트 / A 등급
  }
  onItems: CertPubItem[]
  offItems: CertPubItem[]
}

/** 증명서 미리보기 전체(헤더 + 보완 플래그 + 5탭). */
export interface CertificateOverview {
  header: CertHeader
  changeFlags: CertChangeFlag[]
  requestChecklist: CertReqCheck[]
  summary: CertSummaryTab
  tech: CertTechTab
  projects: CertProjectsTab
  problem: CertProblemTab
  growth: CertGrowthTab
}
