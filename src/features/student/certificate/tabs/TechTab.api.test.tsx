import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CertificateDetailTabsResult } from '../ai'
import { fetchCertificateDetailTabs } from '../ai'
import { TechTab } from './TechTab'

vi.mock('../ai', () => ({
  CERTIFICATE_MOCK_STUDENT_ID: 'student-1',
  fetchCertificateDetailTabs: vi.fn(),
}))

const detailTabs: CertificateDetailTabsResult = {
  policyVersion: '2026.07.23-certificate-detail-tabs-v1',
  calculatedAt: '2026-07-23',
  studentId: 'student-1',
  tech: {
    status: 'READY',
    averageScore: 86,
    assessmentAverageTopPercent: 18,
    assessmentAveragePopulationSize: 40,
    categories: [
      {
        label: '프론트엔드',
        score: 86,
        attemptCount: 2,
        topPercent: 12.5,
        populationSize: 40,
      },
    ],
    assessments: [
      {
        id: 'quiz-1',
        title: 'React 평가',
        category: '프론트엔드',
        score: 86,
        cohortAverageScore: 80,
        relativeScore: 79,
        comparisonCount: 40,
        submittedAt: '2026-06-01',
      },
    ],
    certifications: [
      {
        name: 'PCCE',
        score: 1000,
        grade: 'LV.4',
        status: 'APPROVED',
        scheduledAt: null,
        submittedAt: '2026-05-10',
        issuedAt: '2026-05-12',
        registrationSource: '자가 등록',
      },
      {
        name: 'PCCP',
        score: 910,
        grade: 'LV.5',
        status: 'PENDING',
        scheduledAt: null,
        submittedAt: '2026-06-01',
        issuedAt: null,
        registrationSource: '자가 등록',
      },
      {
        name: 'PCSQL',
        score: null,
        grade: null,
        status: 'SCHEDULED',
        scheduledAt: '2026-07-12',
        submittedAt: null,
        issuedAt: null,
        registrationSource: '자가 등록',
      },
    ],
    assignments: [
      {
        id: 'assignment-1',
        week: 'W08',
        subjectName: 'Spring REST API + JWT 인증',
        type: '실습',
        reviewStatus: '완료',
        submissionStatus: '제출',
      },
    ],
    limitations: [],
  },
  problem: {
    status: 'NOT_READY',
    certifiedCount: 0,
    independentRate: null,
    averageDays: null,
    categories: [],
    cases: [],
    peerEvaluatorCount: 0,
    peerTags: [],
    peerTagCases: [],
    limitations: [],
  },
  growth: {
    status: 'NOT_READY',
    growthTimelineStatus: 'NOT_READY',
    peerEvaluationCount: 0,
    peerReputation: [],
    peerComments: [],
    mentorEvaluation: null,
    limitations: [],
  },
}

function renderTechTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <TechTab />
    </QueryClientProvider>,
  )
}

describe('TechTab 상세 API 연결', () => {
  beforeEach(() => {
    vi.mocked(fetchCertificateDetailTabs).mockReset()
  })

  it('현재 수강생의 기술 카테고리·시험 기수 평균·외부 인증을 표시한다', async () => {
    vi.mocked(fetchCertificateDetailTabs).mockResolvedValue(detailTabs)
    renderTechTab()

    expect(await screen.findByText('프론트엔드')).toBeInTheDocument()
    expect(fetchCertificateDetailTabs).toHaveBeenCalledWith('student-1')
    expect(screen.getByText('상위 12.5%')).toBeInTheDocument()
    expect(screen.getByText('시험별 기수 평균')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'React 평가 기수 평균 80점' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('승인 1건 · 검토 중 1건 · 응시 예정 1건'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'LV.4 (900–1,000점) · 1,000/1,000점 · 발급 2026-05-12 · 자가 등록',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('과제 / 실습 검증')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Spring REST API + JWT 인증'),
    ).not.toBeInTheDocument()
  })

  it('조회 실패 시 내부 엔진 정보 대신 사용자 재시도 안내를 표시한다', async () => {
    vi.mocked(fetchCertificateDetailTabs).mockRejectedValue(
      new Error('network error'),
    )
    renderTechTab()

    expect(
      await screen.findByText('기술·검증 데이터를 불러오지 못했어요'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        '잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/LMS-AI|식별자/)).not.toBeInTheDocument()
  })
})
