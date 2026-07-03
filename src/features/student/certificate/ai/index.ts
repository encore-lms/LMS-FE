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
 * 학생별 파생값(6축·집계·추세) — 동기 mock. 동기 접근이 필요한 곳용.
 */
export function getAiDerived(studentId: string): StudentDerived {
  return DERIVED_STUBS[studentId] ?? DERIVED_STUBS['stu-001']
}

// LMS-AI 엔진 서버 주소. 설정 시 실제 계산값 fetch, 없으면 mock.
// 로컬 확인: .env.local 에 VITE_AI_API_URL=http://localhost:5177
const AI_API = import.meta.env.VITE_AI_API_URL as string | undefined

/**
 * 파생값을 LMS-AI 엔진 서버에서 가져온다(결정 함수 계산 결과).
 * 서버 미설정이면 mock 반환 → 커밋/배포본은 그대로 동작.
 */
export async function fetchAiDerived(
  studentId: string,
): Promise<StudentDerived> {
  if (!AI_API) return DERIVED_STUBS[studentId] ?? DERIVED_STUBS['stu-001']
  const res = await fetch(`${AI_API}/derived/${encodeURIComponent(studentId)}`)
  if (!res.ok) throw new Error(`LMS-AI 서버 오류: ${res.status}`)
  return (await res.json()) as StudentDerived
}

export type {
  AiAnalysis,
  AiVerdict,
  AiPersona,
  AiProjects,
  StudentDerived,
  PersonaBase,
} from './types'
