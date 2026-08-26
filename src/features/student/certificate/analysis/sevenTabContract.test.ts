import { describe, expect, it } from 'vitest'
import { createCertificateSevenTabFixture } from './sevenTabFixture'
import {
  parseCertificateSevenTabs,
  parsePublicCertificateSevenTabs,
} from './sevenTabContract'

describe('수강역량증명서 7개 탭 계약', () => {
  it('LMS-AI가 보장하는 7개 탭을 모두 검증한다', () => {
    const tabs = parseCertificateSevenTabs(createCertificateSevenTabFixture())

    expect(Object.keys(tabs)).toEqual([
      'summary',
      'tech',
      'projects',
      'problemSolving',
      'growthReputation',
      'resume',
      'aiAnalysis',
    ])
  })

  it('내부 결과에서 탭 하나라도 빠지면 계약 오류로 처리한다', () => {
    const { resume: _resume, ...missingResume } =
      createCertificateSevenTabFixture()
    void _resume

    expect(() => parseCertificateSevenTabs(missingResume)).toThrow()
  })

  it('외부 공개 결과는 공개 설정에 따라 평가·추천 탭이 없어도 허용한다', () => {
    const { growthReputation: _growth, ...publicTabs } =
      createCertificateSevenTabFixture()
    void _growth

    expect(
      parsePublicCertificateSevenTabs(publicTabs).growthReputation,
    ).toBeUndefined()
  })

  it('READY 탭의 payload가 비면 화면 데이터로 사용하지 않는다', () => {
    const tabs = createCertificateSevenTabFixture()
    const invalid = {
      ...tabs,
      summary: { ...tabs.summary, payload: {} },
    }

    expect(() => parseCertificateSevenTabs(invalid)).toThrow(
      'READY 탭에는 payload가 필요합니다.',
    )
  })
})
