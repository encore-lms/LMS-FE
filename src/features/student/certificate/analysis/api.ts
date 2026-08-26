import { apiClient } from '@/shared/api/client'
import { z } from 'zod'
import { fetchAiAnalysis } from '../ai'
import {
  CERTIFICATE_SEVEN_TAB_SCHEMA_VERSION,
  certificateAiAnalysisSchema,
  certificateSevenTabsSchema,
} from './sevenTabContract'
import type {
  CertificateAnalysisTarget,
  CertificateAnalysisView,
} from './types'

const missingRequirementSchema = z
  .object({
    code: z.string(),
    label: z.string(),
    source: z.string(),
    resolution: z.string(),
    actionPath: z.string().nullable(),
  })
  .strict()

const failureSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    retryable: z.boolean(),
    failedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .strict()

const analysisViewSchema = z
  .object({
    reviewStatus: z.string(),
    dataStatus: z.enum(['READY', 'NOT_READY', 'STALE']),
    analysisStatus: z.enum([
      'NOT_STARTED',
      'QUEUED',
      'GENERATING',
      'READY',
      'FAILED',
    ]),
    sourceVersion: z.string().nullable(),
    analysisVersion: z.string().nullable(),
    generatedAt: z.string().datetime({ offset: true }).nullable(),
    mode: z.enum(['PREVIEW', 'CERTIFIED']),
    statusDetail: z
      .object({
        runId: z.string().uuid().nullable(),
        queuedAt: z.string().datetime({ offset: true }).nullable(),
        startedAt: z.string().datetime({ offset: true }).nullable(),
        canGenerate: z.boolean(),
        canRetry: z.boolean(),
        lockedReason: z.string().nullable(),
        missingRequirements: z.array(missingRequirementSchema),
        failure: failureSchema.nullable(),
      })
      .strict(),
    snapshot: z
      .object({
        version: z.string().min(1),
        certifiedAt: z.string().datetime({ offset: true }),
        snapshotHash: z.string().min(1),
      })
      .strict()
      .nullable(),
    resultSchemaVersion: z
      .literal(CERTIFICATE_SEVEN_TAB_SCHEMA_VERSION)
      .nullable(),
    tabs: certificateSevenTabsSchema.nullable(),
    analysis: certificateAiAnalysisSchema.nullable(),
  })
  .strict()
  .superRefine((view, context) => {
    if ((view.tabs === null) !== (view.resultSchemaVersion === null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tabs'],
        message: '7개 탭과 결과 스키마 버전은 함께 제공되어야 합니다.',
      })
    }
    if (view.mode === 'CERTIFIED' && view.snapshot === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['snapshot'],
        message: '인증 결과에는 Snapshot 메타데이터가 필요합니다.',
      })
    }
  })

function parseAnalysisView(value: unknown): CertificateAnalysisView {
  return analysisViewSchema.parse(value)
}

function targetPath(
  target: Exclude<CertificateAnalysisTarget, { scope: 'demo' }>,
) {
  if (target.scope === 'student') return '/student/certificate/analysis'
  return `/admin/certificates/${encodeURIComponent(target.studentId)}/analysis`
}

/** FE는 LMS-AI 내부 주소와 키를 알지 않고 LMS-SV 권한 경계만 호출한다. */
export async function fetchCertificateAnalysis(
  target: CertificateAnalysisTarget,
): Promise<CertificateAnalysisView> {
  if (target.scope === 'demo') {
    const analysis = await fetchAiAnalysis(target.studentId)
    return {
      reviewStatus: 'data_ready',
      dataStatus: 'READY',
      analysisStatus: 'READY',
      sourceVersion: 'demo',
      analysisVersion: analysis.policyVersion,
      generatedAt: null,
      mode: 'PREVIEW',
      statusDetail: {
        runId: null,
        queuedAt: null,
        startedAt: null,
        canGenerate: false,
        canRetry: false,
        lockedReason: null,
        missingRequirements: [],
        failure: null,
      },
      snapshot: null,
      resultSchemaVersion: null,
      tabs: null,
      analysis,
    }
  }

  return apiClient
    .get<unknown>(targetPath(target))
    .then((response) => parseAnalysisView(response.data))
}

export async function createCertificateAnalysis(
  target: Exclude<CertificateAnalysisTarget, { scope: 'demo' }>,
): Promise<CertificateAnalysisView> {
  return apiClient
    .post<unknown>(`${targetPath(target)}-runs`, {})
    .then((response) => parseAnalysisView(response.data))
}
