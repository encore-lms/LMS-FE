import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCertificateAnalysis, fetchCertificateAnalysis } from './api'
import type {
  CertificateAnalysisTarget,
  CertificateAnalysisView,
} from './types'

const RUNNING_STATUSES = new Set(['QUEUED', 'GENERATING'])

export function certificateAnalysisPollInterval(
  view: CertificateAnalysisView | undefined,
) {
  return RUNNING_STATUSES.has(view?.analysisStatus ?? '') ? 3_000 : false
}

export function certificateAnalysisKey(target: CertificateAnalysisTarget) {
  return [
    'certificate-analysis',
    target.scope,
    target.scope === 'student' ? 'me' : target.studentId,
  ] as const
}

export function useCertificateAnalysis(
  target: CertificateAnalysisTarget,
  enabled = true,
) {
  return useQuery({
    queryKey: certificateAnalysisKey(target),
    queryFn: () => fetchCertificateAnalysis(target),
    enabled,
    // 실행 중인 분석만 3초마다 확인해 평상시 불필요한 요청을 만들지 않는다.
    refetchInterval: (query) =>
      certificateAnalysisPollInterval(query.state.data),
  })
}

export function useCreateCertificateAnalysis(
  target: CertificateAnalysisTarget,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => {
      if (target.scope === 'demo') {
        throw new Error('데모 분석은 새로 생성할 수 없습니다.')
      }
      return createCertificateAnalysis(target)
    },
    onSuccess: (view: CertificateAnalysisView) => {
      queryClient.setQueryData(certificateAnalysisKey(target), view)
    },
  })
}
