// 증명서 AI 분석 진입점. 지금은 mock(stub) 반환.
// 나중에 이 함수 내부만 서버 API(Python/FastAPI) 호출로 교체하면 됨 — 호출부는 그대로.

import type { AiAnalysis } from './types'
import { ANALYSIS_STUBS } from './stubs/analysis'

/**
 * 학생별 AI 분석 결과. 현재 mock 반환.
 * TODO(BE 연동): 내부를 `fetch('/api/.../ai-analysis?studentId=...')`로 교체.
 */
export function getAiAnalysis(studentId: string): AiAnalysis {
  return ANALYSIS_STUBS[studentId] ?? ANALYSIS_STUBS['stu-001']
}

export type {
  AiAnalysis,
  AiVerdict,
  AiPersona,
  AiProjects,
  StudentDerived,
  PersonaBase,
} from './types'
export { PERSONA_GUIDE, AXIS_GUIDE, GENERATION_RULES } from './guide'
