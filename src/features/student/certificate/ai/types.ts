// 증명서 AI 분석 모듈 — 계약(파생·블록 입출력). 기능 로컬(공유 파일 미오염).
// 지금은 mock 반환, 나중에 index.ts 내부만 서버 API(Python/FastAPI) 호출로 교체.
// 실제 6축 계산·LLM 생성은 추후 AI 서버 몫. FE는 결과 JSON을 렌더.

import type {
  CertAiProfile,
  CertAiVerdict,
  CertOntology,
  CertPersona,
  CertProblemAi,
  CertSentiment,
} from '../types'

// ── 파생 데이터 (결정 함수 산출, 서버에서 계산) ──
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

// ── AI 출력 (FE 타입 + 확장) ──

/** 블록1 확장: 멘토 추천 수강생 뱃지 */
export interface RecommendBadge {
  recommended: boolean
  summary: string
}
export type AiVerdict = CertAiVerdict & { recommendBadge?: RecommendBadge }

/** 페르소나 고정 base 카테고리(7) — 화면 미표시, 매칭·통계용 */
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

/**
 * 블록3 확장: 페르소나 = 풍부 표시 라벨(title) + 고정 base 카테고리 + 부연(호버).
 * subtitle = 아이콘 호버 툴팁. 실제 활동 근거(프로젝트·트슈 등), 계산 설명 아님.
 */
export type AiPersona = CertPersona & {
  subtitle: string
  baseCategory: PersonaBase
}

/** 블록4 확장: 전체 궤적 + 그룹별 요약 */
export interface AiProjects {
  summary: string
  groups: { label: string; summary: string }[]
}

// ── 최종 결과 (getAiAnalysis 반환) ──
export interface AiAnalysis {
  verdict: AiVerdict // 블록1 기술 종합 판단
  profile: CertAiProfile // 블록2 프로파일링
  personas: AiPersona[] // 블록3 페르소나 TOP3
  projects: AiProjects // 블록4 프로젝트 분석
  problem: CertProblemAi // 블록5 문제해결·협업
  sentiment: CertSentiment // 블록6 감성·키워드 버블
  ontology: CertOntology // 온톨로지 역량 맵
}
