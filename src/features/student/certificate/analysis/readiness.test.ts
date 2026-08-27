import { describe, expect, it } from 'vitest'
import { createCertificateSevenTabFixture } from './sevenTabFixture'
import type { CertificateAnalysisView } from './types'
import { isCertificateAnalysisReady } from './readiness'

function readyView(): CertificateAnalysisView {
  const tabs = createCertificateSevenTabFixture()
  return {
    reviewStatus: 'data_ready',
    dataStatus: 'READY',
    analysisStatus: 'READY',
    sourceVersion: 'gold-v1',
    analysisVersion: 'analysis-v1',
    generatedAt: '2026-08-26T00:00:00Z',
    mode: 'PREVIEW',
    statusDetail: {
      runId: '00000000-0000-0000-0000-000000000001',
      queuedAt: '2026-08-26T00:00:00Z',
      startedAt: '2026-08-26T00:00:01Z',
      canGenerate: false,
      canRetry: false,
      lockedReason: null,
      missingRequirements: [],
      failure: null,
    },
    snapshot: null,
    resultSchemaVersion: '2026.08.26-certificate-seven-tab-result-v1',
    tabs,
    analysis: tabs.aiAnalysis.payload.analysis ?? null,
  }
}

describe('역량 증명서 발급 준비 판정', () => {
  it('현재 원천 버전의 7개 탭이 모두 READY일 때만 발급을 허용한다', () => {
    expect(isCertificateAnalysisReady(readyView())).toBe(true)
  })

  it('한 탭이라도 PARTIAL이면 분석 상태가 READY여도 발급을 막는다', () => {
    const view = readyView()
    view.tabs!.resume = {
      ...view.tabs!.resume,
      readinessStatus: 'PARTIAL',
      missingRequirements: [
        { code: 'RESUME_MISSING', source: 'LMS', detail: '이력서가 없습니다.' },
      ],
    }

    expect(isCertificateAnalysisReady(view)).toBe(false)
  })

  it('원천 데이터가 바뀐 STALE 결과는 기존 탭이 남아 있어도 발급을 막는다', () => {
    const view = readyView()
    view.dataStatus = 'STALE'

    expect(isCertificateAnalysisReady(view)).toBe(false)
  })
})
