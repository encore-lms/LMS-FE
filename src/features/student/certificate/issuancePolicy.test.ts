import { describe, expect, it } from 'vitest'
import type { CertificateAnalysisView } from './analysis'
import { createCertificateSevenTabFixture } from './analysis/sevenTabFixture'
import { canRequestCertificate } from './issuancePolicy'

function analysis(dataStatus: 'READY' | 'STALE' = 'READY') {
  const tabs = createCertificateSevenTabFixture()
  return {
    dataStatus,
    analysisStatus: 'READY',
    sourceVersion: 'gold-v1',
    resultSchemaVersion: '2026.08.26-certificate-seven-tab-result-v1',
    tabs,
  } as CertificateAnalysisView
}

describe('수강생 역량 증명서 요청 조건', () => {
  it('서버가 허용하고 현재 원천의 7개 탭이 모두 준비된 경우에만 요청한다', () => {
    expect(
      canRequestCertificate(
        {
          status: 'data_ready',
          stage: 'before',
          canRequest: true,
          changeRequest: null,
        },
        analysis(),
      ),
    ).toBe(true)
  })

  it('원천이 바뀐 STALE 분석이면 서버 플래그가 남아 있어도 요청을 막는다', () => {
    expect(
      canRequestCertificate(
        {
          status: 'data_ready',
          stage: 'before',
          canRequest: true,
          changeRequest: null,
        },
        analysis('STALE'),
      ),
    ).toBe(false)
  })
})
