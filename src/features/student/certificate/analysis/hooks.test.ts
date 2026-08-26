import { describe, expect, it } from 'vitest'
import { certificateAnalysisPollInterval } from './hooks'
import type {
  CertificateAnalysisStatus,
  CertificateAnalysisView,
} from './types'

function statusView(analysisStatus: CertificateAnalysisStatus) {
  return { analysisStatus } as CertificateAnalysisView
}

describe('증명서 AI 분석 polling 경계', () => {
  it.each(['QUEUED', 'GENERATING'] as const)(
    '%s 상태만 3초 간격으로 완료 여부를 확인한다',
    (status) => {
      expect(certificateAnalysisPollInterval(statusView(status))).toBe(3_000)
    },
  )

  it.each(['NOT_STARTED', 'READY', 'FAILED'] as const)(
    '%s 상태에서는 polling을 중지한다',
    (status) => {
      expect(certificateAnalysisPollInterval(statusView(status))).toBe(false)
    },
  )
})
