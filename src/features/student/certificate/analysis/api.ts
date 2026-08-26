import { apiClient } from '@/shared/api/client'
import { fetchAiAnalysis } from '../ai'
import type {
  CertificateAnalysisTarget,
  CertificateAnalysisView,
} from './types'

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
      analysis,
    }
  }

  return apiClient
    .get<CertificateAnalysisView>(targetPath(target))
    .then((response) => response.data)
}

export async function createCertificateAnalysis(
  target: Exclude<CertificateAnalysisTarget, { scope: 'demo' }>,
): Promise<CertificateAnalysisView> {
  return apiClient
    .post<CertificateAnalysisView>(`${targetPath(target)}-runs`, {})
    .then((response) => response.data)
}
