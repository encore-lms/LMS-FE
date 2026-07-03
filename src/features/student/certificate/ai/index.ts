// 증명서 AI 분석 진입점. 지금은 mock(stub) 반환.
// 나중에 이 함수 내부만 서버 API(Python/FastAPI) 호출로 교체하면 됨 — 호출부는 그대로.

import type { AiAnalysis, StudentDerived } from './types'
import { ANALYSIS_STUBS } from './stubs/analysis'
import { derive } from './derive'
import { RAW_STUBS } from './stubs/raw'

/**
 * 학생별 AI 분석 결과(LLM 생성 블록). 현재 mock 반환.
 * TODO(BE 연동): 내부를 `fetch('/api/.../ai-analysis?studentId=...')`로 교체.
 */
export function getAiAnalysis(studentId: string): AiAnalysis {
  return ANALYSIS_STUBS[studentId] ?? ANALYSIS_STUBS['stu-001']
}

/**
 * 학생별 파생값(6축·집계·추세) — 결정 함수 계산 산출(LLM 아님).
 * 지금은 raw stub을 즉시 계산. 나중에 서버 계산 결과 fetch로 교체 — 호출부 불변.
 */
export function getAiDerived(studentId: string): StudentDerived {
  const raw = RAW_STUBS[studentId] ?? RAW_STUBS['stu-001']
  return derive(raw)
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
