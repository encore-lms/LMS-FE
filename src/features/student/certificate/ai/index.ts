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
 * 서버 미설정·오류·다운 시 mock 반환 → 화면 blank 방지, 커밋/배포본 그대로 동작.
 */
export async function fetchAiDerived(
  studentId: string,
): Promise<StudentDerived> {
  const mock = DERIVED_STUBS[studentId] ?? DERIVED_STUBS['stu-001']
  if (!AI_API) return mock
  try {
    const res = await fetch(
      `${AI_API}/derived/${encodeURIComponent(studentId)}`,
    )
    if (!res.ok) return mock
    return (await res.json()) as StudentDerived
  } catch {
    return mock // 서버 다운/네트워크 오류 → mock
  }
}

/**
 * AI 분석(블록1~6 + 온톨로지)을 LMS-AI 엔진 서버에서 가져온다.
 * 서버 미설정·오류·다운 시 mock 반환 → 화면 blank 방지, 커밋/배포본 그대로 동작.
 */
export async function fetchAiAnalysis(studentId: string): Promise<AiAnalysis> {
  const mock = ANALYSIS_STUBS[studentId] ?? ANALYSIS_STUBS['stu-001']
  if (!AI_API) return mock
  try {
    const res = await fetch(
      `${AI_API}/analysis/${encodeURIComponent(studentId)}`,
    )
    if (!res.ok) return mock
    return (await res.json()) as AiAnalysis
  } catch {
    return mock // 서버 다운/네트워크 오류 → mock
  }
}

export type {
  AiAnalysis,
  AiVerdict,
  AiPersona,
  AiProjects,
  StudentDerived,
  PersonaBase,
} from './types'
