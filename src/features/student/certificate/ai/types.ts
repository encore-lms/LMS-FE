// 증명서 AI 분석 모듈 — 계약 타입 재수출(배럴).
//
// 실제 정의는 contract.gen.ts이며 SSOT는 LMS-AI Python 응답 구현과 API.md다.
// FE에서는 계약 타입을 이 배럴에서 그대로 재수출한다.
//
// 파생(StudentDerived·SixAxis) + AI 출력(AiAnalysis·AiVerdict·AiPersona·AiProfile·
// AiProjects·ProblemAi·Sentiment·Ontology 등) + PERSONA_BASE/PersonaBase 포함.
export type AiTheoryUnderstandingLevel =
  | 'VERY_HIGH'
  | 'HIGH'
  | 'MEDIUM'
  | 'FOUNDATIONAL'
  | 'NOT_READY'

export interface AiTheoryUnderstandingCategory {
  key: string
  category: string
  score: number
  weightPercent: number
}

export interface AiTheoryUnderstanding {
  status: 'READY' | 'PARTIAL' | 'NOT_READY'
  score: number | null
  level: AiTheoryUnderstandingLevel
  label: string
  summary: string
  categories: AiTheoryUnderstandingCategory[]
}

// Python 기반 LMS-AI 응답에 먼저 추가된 점진적 계약 필드다. 이전 응답과도
// 호환되도록 선택값으로 두고, contract codegen이 복구되면 원본 계약으로 이동한다.
declare module './contract.gen' {
  interface AiJobFitRoleCandidate {
    theoryUnderstanding?: AiTheoryUnderstanding
  }
}

export * from './contract.gen'
