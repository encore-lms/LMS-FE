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

export interface AiJobFitSourceData {
  interestedJobs: string[]
  skillTags: string[]
  projectDomains: string[]
  assessments: Array<{
    assessmentType: 'ACHIEVEMENT' | 'CS'
    category: string
    score: number
  }>
  theoryCategories: AiTheoryUnderstandingCategory[]
  certifications: string[]
}

export interface AiTroubleshootingSourceCase {
  id: string
  title: string
  category: string
  situation: string
  resolution: string
  result: string
  days: number | null
  independent: boolean
}

export interface AiTroubleshootingSourceData {
  categories: Array<{ label: string; count: number }>
  cases: AiTroubleshootingSourceCase[]
  averageDays: number | null
  medianDays: number | null
  independentCaseCount: number
  supportedCaseCount: number
}

export type AiProjectPeerAxisKey =
  | '기술/기술기여'
  | '소통·협업·팀워크'
  | '문제해결'
  | '책임감'

export interface AiProjectRolePattern {
  label: string
  projectCount: number
  taskCount: number
}

export interface AiProjectPeerAxisAnalysis {
  key: AiProjectPeerAxisKey
  score: number | null
  summary: string[]
}

export interface AiProjectGrowthAnalysis {
  projectId: string
  projectName: string
  summary: string[]
}

export interface AiProjectAggregateAnalysis {
  summary: string[]
  rolePatterns: AiProjectRolePattern[]
  commonTasks: string[]
  selfReviewStatements: string[]
  contribution: {
    totalBoardTaskCount: number | null
    assignedTaskCount: number
    completedAssignedTaskCount: number
    summary: string[]
  }
  peerAxes: AiProjectPeerAxisAnalysis[]
  projectGrowth: AiProjectGrowthAnalysis[]
  strengths: string[]
  evaluationSource: 'PEER_ONLY'
}

// Python 기반 LMS-AI 응답에 먼저 추가된 점진적 계약 필드다. 이전 응답과도
// 호환되도록 선택값으로 두고, contract codegen이 복구되면 원본 계약으로 이동한다.
declare module './contract.gen' {
  interface AiJobFitRoleCandidate {
    theoryUnderstanding?: AiTheoryUnderstanding
  }

  interface AiJobFit {
    sourceData?: AiJobFitSourceData
  }

  interface AiProjects {
    aggregateAnalysis?: AiProjectAggregateAnalysis
  }

  interface AiTroubleshooting {
    sourceData?: AiTroubleshootingSourceData
  }
}

export * from './contract.gen'
