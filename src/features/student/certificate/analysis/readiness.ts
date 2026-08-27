import type { CertificateAnalysisView } from './types'

/**
 * 발급 가능한 증명서는 상태 문자열 하나가 아니라 현재 원천 버전의 7개 탭 전체로 판정한다.
 * 일부 탭이 비어 있는데 READY로 보이는 계약 회귀가 생겨도 요청·승인까지 번지지 않게 한다.
 */
export function isCertificateAnalysisReady(
  view: CertificateAnalysisView | null | undefined,
): view is CertificateAnalysisView & {
  sourceVersion: string
  tabs: NonNullable<CertificateAnalysisView['tabs']>
} {
  if (
    !view ||
    view.dataStatus !== 'READY' ||
    view.analysisStatus !== 'READY' ||
    !view.sourceVersion ||
    !view.resultSchemaVersion ||
    !view.tabs
  ) {
    return false
  }

  return Object.values(view.tabs).every(
    (tab) => tab.readinessStatus === 'READY',
  )
}
