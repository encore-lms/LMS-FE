// 과정별 역량 리포트 도메인 계약 — 기능 로컬. Figma 3345:5971.
// 과정/기수 단위 학습 진단(증명서 5탭과는 별도).

export type NoteTone = 'positive' | 'warning'

/** 과정 핵심 지표 카드 */
export interface CompetencyMetric {
  key: string
  label: string
  value: string // "96%" | "84.5" | "17건"
  note: string // "정상 범위" | "보완요청 2건"
  noteTone: NoteTone
}

/** 점수 막대(6축 / 퀴즈 카테고리 공통) */
export interface ScoreBar {
  label: string
  score: number // 0~100
}

export type EvidenceTone = 'warning' | 'info' | 'success'
/** 근거 목록 한 줄 */
export interface EvidenceItem {
  id: string
  title: string
  sub: string
  chipLabel: string
  chipTone: EvidenceTone
}

export type RemediationTone = 'warning' | 'danger'
/** 보완 항목 한 줄 */
export interface RemediationItem {
  id: string
  chipLabel: string
  chipTone: RemediationTone
  desc: string
}

export interface CompetencyReport {
  courseName: string
  cohortName: string
  collectedAtLabel: string // "최신 집계 2026-06-01 09:00 KST · 과정 단위"
  metrics: CompetencyMetric[]
  skillAxes: ScoreBar[]
  quizCategories: ScoreBar[]
  evidence: EvidenceItem[]
  remediation: RemediationItem[]
}
