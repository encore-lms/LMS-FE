import { describe, expect, it } from 'vitest'
import { createCertificateSevenTabFixture } from '@/features/student/certificate/analysis/sevenTabFixture'
import { parseVerificationResponse } from './verify'

function publicResult() {
  const fixture = createCertificateSevenTabFixture()
  const tabs = {
    summary: fixture.summary,
    tech: fixture.tech,
    projects: fixture.projects,
    problemSolving: fixture.problemSolving,
    resume: fixture.resume,
    aiAnalysis: fixture.aiAnalysis,
  }
  return {
    resultType: 'certified_public',
    verificationId: 'verify-1',
    snapshotVersion: 'snapshot-v1',
    snapshotHash: 'sha256:fixture',
    publicSchemaVersion: '2026.08.26-certificate-seven-tab-result-v1',
    publicPayload: {
      schemaVersion: '2026.08.26-certificate-seven-tab-result-v1',
      generatedAt: '2026-08-26T00:00:00Z',
      tabs,
    },
  }
}

describe('외부 공개 역량 증명서 계약', () => {
  it('인증 시점에 동결된 READY 탭만 공개 응답으로 허용한다', () => {
    expect(parseVerificationResponse(publicResult()).resultType).toBe(
      'certified_public',
    )
  })

  it('동결 Snapshot에 PARTIAL 탭이 섞이면 증명서 본문을 파싱하지 않는다', () => {
    const result = publicResult()
    result.publicPayload.tabs.resume = {
      ...result.publicPayload.tabs.resume,
      readinessStatus: 'PARTIAL',
      missingRequirements: [
        {
          code: 'RESUME_MISSING',
          source: 'LMS',
          detail: '완료된 이력서가 없습니다.',
        },
      ],
    }

    expect(() => parseVerificationResponse(result)).toThrow(
      '공개 인증 Snapshot에는 READY 탭만 허용됩니다.',
    )
  })
})
