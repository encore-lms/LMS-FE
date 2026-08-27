import type { CertStatusData } from './types'
import {
  isCertificateAnalysisReady,
  type CertificateAnalysisView,
} from './analysis'

/** 서버의 심사 가능 상태와 실제 7개 탭 준비 상태가 함께 맞아야 요청 버튼을 연다. */
export function canRequestCertificate(
  status: CertStatusData | null | undefined,
  analysis: CertificateAnalysisView | null | undefined,
) {
  return (
    status?.canRequest === true &&
    (status.stage === 'before' || status.stage === 'changes_requested') &&
    isCertificateAnalysisReady(analysis)
  )
}
