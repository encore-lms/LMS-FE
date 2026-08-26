import type { AiAnalysis } from '../ai'

/** LMS-SV가 외부에 공개하도록 선별한 AI 증명서 분석 블록. */
export type CertificateAiAnalysis = Pick<
  AiAnalysis,
  'policyVersion' | 'jobFit' | 'projects' | 'troubleshooting'
>

export type CertificateAnalysisStatus =
  | 'NOT_STARTED'
  | 'QUEUED'
  | 'GENERATING'
  | 'READY'
  | 'FAILED'

export type CertificateAnalysisDataStatus = 'READY' | 'NOT_READY' | 'STALE'

export interface CertificateAnalysisMissingRequirement {
  code: string
  label: string
  source: string
  resolution: string
  actionPath: string | null
}

export interface CertificateAnalysisFailure {
  code: string
  message: string
  retryable: boolean
  failedAt: string | null
}

export interface CertificateAnalysisView {
  reviewStatus: string
  dataStatus: CertificateAnalysisDataStatus
  analysisStatus: CertificateAnalysisStatus
  sourceVersion: string | null
  analysisVersion: string | null
  generatedAt: string | null
  mode: 'PREVIEW' | 'CERTIFIED_SNAPSHOT'
  statusDetail: {
    runId: string | null
    queuedAt: string | null
    startedAt: string | null
    canGenerate: boolean
    canRetry: boolean
    lockedReason: string | null
    missingRequirements: CertificateAnalysisMissingRequirement[]
    failure: CertificateAnalysisFailure | null
  }
  snapshot: {
    version: number
    certifiedAt: string
    snapshotHash: string
  } | null
  analysis: CertificateAiAnalysis | null
}

/** 공개 페이지의 인증 전 스냅샷은 후속 범위라 데모를 명시적으로 분리한다. */
export type CertificateAnalysisTarget =
  | { scope: 'student' }
  | { scope: 'admin'; studentId: string }
  | { scope: 'demo'; studentId: string }
