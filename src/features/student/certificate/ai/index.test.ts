import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CertificateScoreResult } from './types'
import { CERTIFICATE_MOCK_STUDENT_ID, fetchCertificateScore } from './index'

const result: CertificateScoreResult = {
  policyVersion: '2026.07.21-six-axis-persistence-v4',
  calculatedAt: '2026-07-16',
  student: {
    studentId: 'student-1',
    studentName: '김시우',
    courseName: 'SKN LLM·AI 개발자 과정',
    cohortName: 'SKN 6기',
    cohortStartedAt: '2024-04-22',
    cohortEndedAt: '2024-10-20',
  },
  status: 'READY',
  overallScore: 67.4,
  grade: 'C',
  overallRelative: {
    status: 'READY',
    scope: 'ALL_STUDENTS',
    percentile: 68.3,
    topPercent: 31.7,
    populationSize: 300,
    detail: '전체 수강생 유효 300명 중 상위 31.7%입니다.',
  },
  axes: [],
  metrics: [],
  peerEvaluation: [],
  domainExperience: [],
  warnings: [],
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchCertificateScore', () => {
  it('발급 조건을 충족하는 박준서를 기본 시연 수강생으로 사용한다', () => {
    expect(CERTIFICATE_MOCK_STUDENT_ID).toBe(
      'd9552119-7a27-5be5-b2a4-1d82a709cfb9',
    )
  })

  it('LMS-AI 점수 엔드포인트에서 최신 정책 결과를 가져온다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => result,
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchCertificateScore('student 1')).resolves.toEqual(result)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/scores\/student%201$/),
    )
  })

  it('조회 실패를 다른 학생 점수로 대체하지 않는다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    )

    await expect(fetchCertificateScore('missing')).rejects.toThrow(
      '수강역량 점수 조회 실패 (404)',
    )
  })

  it('FE가 지원하지 않는 정책 버전은 표시하지 않는다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...result, policyVersion: 'legacy' }),
      }),
    )

    await expect(fetchCertificateScore('student-1')).rejects.toThrow(
      '지원하지 않는 수강역량 점수 정책 버전',
    )
  })
})
