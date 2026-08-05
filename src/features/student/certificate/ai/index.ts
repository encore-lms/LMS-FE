// 증명서 AI 분석 진입점. 지금은 mock(stub) 반환.
// 계산 엔진(derive 등)은 별도 레포 LMS-AI로 이전됨 — 이 경계는 서버가 뜨면
// 내부만 `fetch('/api/.../ai-analysis?studentId=...')`로 교체(호출부·컴포넌트 불변).

import type {
  AiAnalysis,
  CertificateDetailTabsResult,
  CertificateScoreResult,
  StudentDerived,
} from './types'
import { ANALYSIS_STUBS } from './stubs/analysis'
import certificateSnapshot from './stubs/certificate.snapshot.json'
import { DERIVED_STUBS } from './stubs/derived'

export {
  CERTIFICATE_360_AXIS_KEYS,
  CERTIFICATE_AXIS_KEYS,
  CERTIFICATE_PEER_AXIS_KEYS,
} from './types'

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
const CERTIFICATE_SCORE_API =
  (import.meta.env.VITE_AI_API_URL as string | undefined)?.replace(/\/$/, '') ??
  '/lms-ai'
const CERTIFICATE_MOCK_MODE =
  import.meta.env.MODE === 'development' ||
  import.meta.env.VITE_ENABLE_MOCK === 'true'

/** 발급 조건과 점수 산출 원천을 충족하는 기본 개발 수강생. */
export const CERTIFICATE_MOCK_STUDENT_ID =
  (import.meta.env.VITE_CERTIFICATE_STUDENT_ID as string | undefined) ??
  'd9552119-7a27-5be5-b2a4-1d82a709cfb9'

/**
 * 최신 6축·종합점수·상대 위치·동료 5축 비교 결과를 가져온다.
 * 점수 데이터는 다른 학생이나 정적 mock으로 대체하지 않는다.
 */
export async function fetchCertificateScore(
  studentId: string,
): Promise<CertificateScoreResult> {
  if (CERTIFICATE_MOCK_MODE) {
    return {
      ...(certificateSnapshot.score as CertificateScoreResult),
      student: {
        ...(certificateSnapshot.score
          .student as CertificateScoreResult['student']),
        studentId,
      },
    }
  }

  const res = await fetch(
    `${CERTIFICATE_SCORE_API}/scores/${encodeURIComponent(studentId)}`,
  )
  if (!res.ok) {
    throw new Error(`수강역량 점수 조회 실패 (${res.status})`)
  }

  const result = (await res.json()) as CertificateScoreResult
  if (result.policyVersion !== '2026.08.05-six-axis-four-rater-v1') {
    throw new Error('지원하지 않는 수강역량 점수 정책 버전입니다.')
  }
  return result
}

/** 기술·문제해결·성장 탭의 검증 데이터를 현재 수강생 ID로 조회한다. */
export async function fetchCertificateDetailTabs(
  studentId: string,
): Promise<CertificateDetailTabsResult> {
  if (CERTIFICATE_MOCK_MODE) {
    return {
      ...(certificateSnapshot.tabs as CertificateDetailTabsResult),
      studentId,
    }
  }

  const res = await fetch(
    `${CERTIFICATE_SCORE_API}/tabs/${encodeURIComponent(studentId)}`,
  )
  if (!res.ok) {
    throw new Error(`수강역량 상세 탭 조회 실패 (${res.status})`)
  }

  const result = (await res.json()) as CertificateDetailTabsResult
  if (result.policyVersion !== '2026.08.05-certificate-detail-tabs-v2') {
    throw new Error('지원하지 않는 수강역량 상세 탭 정책 버전입니다.')
  }
  return result
}

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
 * 다른 학생이나 정적 mock으로 대체하지 않고 조회 실패를 호출부에 전달한다.
 */
export async function fetchAiAnalysis(studentId: string): Promise<AiAnalysis> {
  if (CERTIFICATE_MOCK_MODE) return certificateSnapshot.analysis as AiAnalysis

  const res = await fetch(
    `${CERTIFICATE_SCORE_API}/analysis/${encodeURIComponent(studentId)}`,
  )
  if (!res.ok) {
    throw new Error(`수강역량 AI 분석 조회 실패 (${res.status})`)
  }
  return (await res.json()) as AiAnalysis
}

export type {
  AiAnalysis,
  AiVerdict,
  AiVerdictItemKey,
  AiPersona,
  AiProfile,
  AiProfileConfidence,
  AiProfileDimension,
  AiProfileDimensionKey,
  AiProfileLevel,
  AiProjectMembershipRole,
  AiProjectOverview,
  AiProjectPersonalEvidence,
  AiProjectSnapshot,
  AiProjectStatus,
  AiProjectTeamContext,
  AiProjects,
  ProblemAi,
  ProblemCap,
  CollaborationEvidenceStat,
  AiCollaborationAnalysis,
  AiCollaborationProjectEvaluation,
  AiProblemGrowthAnalysis,
  SentimentAnalysisStatus,
  SentimentPhase,
  SentimentPolarity,
  SentimentEvidence,
  SentimentBubble,
  SentimentPhaseDetail,
  Sentiment,
  OntologyStatus,
  OntologyKind,
  OntologyEdgeType,
  OntologyNode,
  OntologyEdge,
  Ontology,
  CertificateAxisScore,
  CertificateAssessmentPoint,
  CertificateAssessmentType,
  CertificateDetailStatus,
  CertificateDetailTabsResult,
  CertificateDomainExperience,
  CertificateExternalCertification,
  CertificateGrowthDetail,
  CertificateMentorEvaluationSummary,
  CertificateMetricKey,
  CertificatePeerAxisKey,
  CertificatePeerComment,
  CertificatePeerEvaluationAxis,
  CertificatePeerReputationAxis,
  CertificateProblemDetail,
  CertificateScoreMetric,
  CertificateScoreResult,
  CertificateTechCategory,
  CertificateTechDetail,
  CertificateTroubleshootingCaseSummary,
  StudentDerived,
  PersonaBase,
} from './types'
