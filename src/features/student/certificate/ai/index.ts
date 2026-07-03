// 증명서 AI 분석 진입점. 지금은 mock(stub) 반환.
// 계산 엔진(derive 등)은 별도 레포 LMS-AI로 이전됨 — 이 경계는 서버가 뜨면
// 내부만 `fetch('/api/.../ai-analysis?studentId=...')`로 교체(호출부·컴포넌트 불변).

import type { AiAnalysis, StudentDerived } from './types'
import { ANALYSIS_STUBS } from './stubs/analysis'
import { DERIVED_STUBS } from './stubs/derived'

/**
 * 학생별 AI 분석 결과(LLM 생성 블록). 현재 mock 반환.
 * TODO(서버 연동): 내부를 LMS-AI 서버 API 호출로 교체.
 */
export function getAiAnalysis(studentId: string): AiAnalysis {
  return ANALYSIS_STUBS[studentId] ?? ANALYSIS_STUBS['stu-001']
}

/**
 * 학생별 파생값(6축·집계·추세) — 결정 함수 계산 산출(LMS-AI 엔진 담당).
 * 현재 mock 반환. TODO(서버 연동): LMS-AI 계산 결과 fetch로 교체 — 호출부 불변.
 */
export function getAiDerived(studentId: string): StudentDerived {
  return DERIVED_STUBS[studentId] ?? DERIVED_STUBS['stu-001']
}

export type {
  AiAnalysis,
  AiVerdict,
  AiPersona,
  AiProjects,
  StudentDerived,
  PersonaBase,
} from './types'
