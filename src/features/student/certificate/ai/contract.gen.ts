// ⚠️ 자동 생성 파일 — 직접 수정 금지.
// 원본(SSOT): LMS-AI/src/contract.ts
// 재생성: pnpm sync:ai-contract   (LMS-AI가 형제 폴더에 있거나 LMS_AI_DIR 지정)

// 증명서 AI 엔진 ↔ FE 공유 계약(SSOT). 순수 데이터 타입, 프레임워크·엔진 내부 의존 0.
//
// 이 파일이 FE↔LMS-AI 사이 "wire 계약"의 단일 출처(SSOT)다.
// FE는 이 파일을 그대로 복사해(`contract.gen.ts`) 렌더 타입으로 쓴다.
//   - 재생성(FE): pnpm sync:ai-contract
//   - 자족적으로 유지할 것: 다른 파일을 import 하지 않는다(복사 대상이므로).
//   - 서버 전용 입력 타입(StudentRaw 등)은 여기 두지 않는다 → `types.ts`.

// ── 파생 산출 (결정 함수 계산 결과) ──
export type SixAxisKey =
  | '기술'
  | '성장'
  | '팀워크'
  | '책임감'
  | '소통'
  | '문제해결'
export type SixAxis = Record<SixAxisKey, number> // 0~100

export interface StudentDerived {
  studentId: string
  sixAxis: SixAxis
  /** 표본 부족(N<30)이면 해당 축 생략 */
  percentile: Partial<SixAxis>
  grade: string
  /** 상호평가 5축 집계 */
  peerAgg: Record<string, number>
  /** 성취도/CS 카테고리 분포 */
  achieveDist: Record<string, number>
  growthTrend: { slope: number; normalized: number }
  problem3: { 데이터처리: number; 모델튜닝: number; 인프라배포: number }
  /** 프로젝트 도메인 비중 */
  domainWeight: Record<string, number>
  /** 교차 신호(파생) — 여러 소스가 가리키는 방향 잇기용 */
  cross: {
    tsCategoryDist: Record<string, number>
    projectStackFreq: Record<string, number>
    achieveBySubjectTime: { subject: string; score: number; at: string }[]
    tsDiversity: number
    tsDaysTrend: number
  }
}

// ── 페르소나 고정 base 카테고리(7) — 화면 미표시, 매칭·통계용 ──
export const PERSONA_BASE = [
  '백엔드',
  '프론트엔드',
  '풀스택',
  '데이터 엔지니어',
  '데이터 분석',
  'ML·AI',
  'DevOps·인프라',
] as const
export type PersonaBase = (typeof PERSONA_BASE)[number]

// ── AI 분석 출력 (블록1~6 + 온톨로지) ──
export type Tone = 'brand' | 'info' | 'warning' | 'danger' | 'accent' | 'success'

// 블록1 — 기술 종합 판단
export interface RecommendBadge {
  recommended: boolean
  summary: string
}
export interface AiVerdict {
  strength: string // 강점
  gap: string // 보완
  unique: string // 특이형
  recommendBadge?: RecommendBadge // 멘토 추천 뱃지
}

// 블록2 — 프로파일링
export interface AiProfileRow {
  label: string // 업무/리더십/학습/소통/기술
  value: string
}
export interface AiProfile {
  rows: AiProfileRow[]
  summary: string // AI 한줄 요약
  strengths: string // 핵심 강점
  growth: string // 성장 포인트
}

// 블록3 — 페르소나 TOP3 (풍부 표시 title + 고정 base + 부연)
export interface AiPersona {
  rank: number
  title: string
  subtitle: string // 아이콘 호버 근거(활동)
  baseCategory: PersonaBase
}

// 블록4 — 프로젝트 분석
export interface AiProjects {
  summary: string
  groups: { label: string; summary: string }[]
}

// 블록5 — 문제해결·협업
export interface ProblemCap {
  label: string
  score: number
  tag: string // 연결 PeerTag
  tone: Tone
}
export interface ProblemAi {
  caps: ProblemCap[]
  style: string // 스타일 종합
  scaling: string // 확장 종합
}

// 블록6 — 감성·키워드 버블
export type SentimentPhase = 'early' | 'mid' | 'late'
export interface SentimentBubble {
  label: string
  x: number // 0~100
  y: number // 0~100
  r: number // 반지름(px, viewBox 기준)
  phase: SentimentPhase
}
export interface Sentiment {
  bubbles: SentimentBubble[]
  trend: string
}

// 온톨로지 역량 맵
export type OntologyKind =
  | 'self'
  | 'subject'
  | 'skill'
  | 'method'
  | 'project'
  | 'domain'
export interface OntologyNode {
  id: string
  label: string
  x: number // 0~100 (viewBox 비율)
  y: number // 0~100
  kind: OntologyKind
}
export interface Ontology {
  nodes: OntologyNode[]
  edges: [string, string][] // 노드 id 쌍
}

// 최종 분석 결과 (getAnalysis 반환 / 서버 /analysis 응답)
export interface AiAnalysis {
  verdict: AiVerdict
  profile: AiProfile
  personas: AiPersona[]
  projects: AiProjects
  problem: ProblemAi
  sentiment: Sentiment
  ontology: Ontology
}
