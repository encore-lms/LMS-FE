import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CertificateDetailTabsResult } from '../ai'
import { fetchCertificateDetailTabs } from '../ai'
import { TechTab } from './TechTab'

vi.mock('../ai', () => ({
  CERTIFICATE_MOCK_STUDENT_ID: 'student-1',
  fetchCertificateDetailTabs: vi.fn(),
}))

const detailTabs: CertificateDetailTabsResult = {
  policyVersion: '2026.08.05-certificate-detail-tabs-v2',
  calculatedAt: '2026-07-23',
  studentId: 'student-1',
  tech: {
    status: 'READY',
    averageScore: 86,
    assessmentAverageTopPercent: 18,
    assessmentAveragePopulationSize: 40,
    categories: [
      {
        assessmentType: 'ACHIEVEMENT',
        label: '프론트엔드',
        score: 86,
        attemptCount: 1,
        topPercent: 12.5,
        populationSize: 40,
      },
      {
        assessmentType: 'ACHIEVEMENT',
        label: '백엔드',
        score: 84,
        attemptCount: 1,
        topPercent: null,
        populationSize: 40,
      },
      {
        assessmentType: 'ACHIEVEMENT',
        label: '데이터베이스',
        score: 83,
        attemptCount: 1,
        topPercent: null,
        populationSize: 40,
      },
      {
        assessmentType: 'ACHIEVEMENT',
        label: '네트워크',
        score: 82,
        attemptCount: 1,
        topPercent: null,
        populationSize: 40,
      },
      {
        assessmentType: 'ACHIEVEMENT',
        label: '운영체제',
        score: 81,
        attemptCount: 1,
        topPercent: null,
        populationSize: 40,
      },
      {
        assessmentType: 'ACHIEVEMENT',
        label: '알고리즘',
        score: 80,
        attemptCount: 1,
        topPercent: null,
        populationSize: 40,
      },
      {
        assessmentType: 'CS',
        label: '컴퓨터 구조',
        score: 82,
        attemptCount: 1,
        topPercent: null,
        populationSize: 12,
      },
    ],
    assessments: [
      {
        id: 'quiz-1',
        title: 'React 평가',
        assessmentType: 'ACHIEVEMENT',
        category: '프론트엔드',
        score: 86,
        cohortAverageScore: 80,
        relativeScore: 79,
        comparisonCount: 40,
        submittedAt: '2026-06-01',
      },
      {
        id: 'quiz-2',
        title: '백엔드 평가',
        assessmentType: 'ACHIEVEMENT',
        category: '백엔드',
        score: 84,
        cohortAverageScore: 80,
        relativeScore: 76,
        comparisonCount: 40,
        submittedAt: '2026-06-02',
      },
      {
        id: 'quiz-3',
        title: '데이터베이스 평가',
        assessmentType: 'ACHIEVEMENT',
        category: '데이터베이스',
        score: 83,
        cohortAverageScore: 80,
        relativeScore: 75,
        comparisonCount: 40,
        submittedAt: '2026-06-03',
      },
      {
        id: 'quiz-4',
        title: '네트워크 평가',
        assessmentType: 'ACHIEVEMENT',
        category: '네트워크',
        score: 82,
        cohortAverageScore: 80,
        relativeScore: 74,
        comparisonCount: 40,
        submittedAt: '2026-06-04',
      },
      {
        id: 'quiz-5',
        title: '운영체제 평가',
        assessmentType: 'ACHIEVEMENT',
        category: '운영체제',
        score: 81,
        cohortAverageScore: 80,
        relativeScore: 73,
        comparisonCount: 40,
        submittedAt: '2026-06-05',
      },
      {
        id: 'quiz-6',
        title: '알고리즘 평가',
        assessmentType: 'ACHIEVEMENT',
        category: '알고리즘',
        score: 80,
        cohortAverageScore: 80,
        relativeScore: 72,
        comparisonCount: 40,
        submittedAt: '2026-06-06',
      },
      {
        id: 'quiz-cs-1',
        title: '컴퓨터 구조 CS 평가',
        assessmentType: 'CS',
        category: '컴퓨터 구조',
        score: 82,
        cohortAverageScore: 76,
        relativeScore: 74,
        comparisonCount: 12,
        submittedAt: '2026-06-15',
      },
      {
        id: 'quiz-1-retry',
        title: 'React 평가 재응시',
        assessmentType: 'ACHIEVEMENT',
        category: '프론트엔드',
        score: 99,
        cohortAverageScore: 80,
        relativeScore: 95,
        comparisonCount: 40,
        submittedAt: '2026-07-01',
      },
    ],
    certifications: [
      {
        name: '정보처리기사',
        score: null,
        grade: '최종합격',
        status: 'APPROVED',
        scheduledAt: null,
        submittedAt: null,
        issuedAt: '2026-05-30',
        registrationSource:
          '운영 인증 · 한국산업인력공단 · 시연용 자격번호 26200000001A',
      },
      {
        name: 'SQL 개발자(SQLD)',
        score: null,
        grade: '최종합격',
        status: 'APPROVED',
        scheduledAt: null,
        submittedAt: null,
        issuedAt: '2026-06-20',
        registrationSource:
          '운영 인증 · 한국데이터산업진흥원 · 시연용 자격번호 SQLD-DEMO-26001 · 2028-06-20까지 유효',
      },
      {
        name: 'PCCE',
        score: 1000,
        grade: 'LV.4',
        status: 'APPROVED',
        scheduledAt: null,
        submittedAt: '2026-05-10',
        issuedAt: '2026-05-12',
        registrationSource: '운영 인증 · 제출 증빙 확인',
      },
      {
        name: 'Kaggle Expert',
        score: null,
        grade: 'Expert',
        status: 'APPROVED',
        scheduledAt: null,
        submittedAt: '2026-05-20',
        issuedAt: '2026-05-24',
        registrationSource: '운영 인증 · 공개 프로필 확인',
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
    expect(screen.getByText('성취도 평가')).toBeInTheDocument()
    expect(screen.getByText('CS 평가')).toBeInTheDocument()
    // #808 에서 기술 추세 블록이 옮겨져 카테고리명이 한 번만 나온다 — 실제 렌더에 맞춘다(2026-08-06).
    expect(screen.getByText('컴퓨터 구조')).toBeInTheDocument()
    expect(screen.getByText('6개 카테고리 · 평균 82.7점')).toBeInTheDocument()
    expect(screen.getByText('1개 카테고리 · 평균 82점')).toBeInTheDocument()
    expect(
      screen.getByText(
        '성취도 평가와 CS 평가의 카테고리별 평균 점수를 비교합니다.',
      ),
    ).toBeInTheDocument()
    expect(document.querySelector('[data-tech-category-split]')).toHaveClass(
      'grid-cols-2',
    )
    const categoryCard = document.querySelector(
      '[data-tech-category-card]',
    ) as HTMLElement
    expect(within(categoryCard).queryByText('알고리즘')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '전체 6개 보기' }))
    expect(within(categoryCard).getByText('알고리즘')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '접기' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    // #808 에서 기술 추세 heading·차트 영역이 카드 툴팁 안으로 옮겨져 기본 렌더에 없다.
    // 지금 화면이 무엇을 보여주는지에 맞춘다(2026-08-06).
    expect(screen.getByText('React 평가')).toBeInTheDocument()
    // 회차 날짜는 카드 툴팁 안으로 들어가 기본 렌더에 없다.
    expect(fetchCertificateDetailTabs).toHaveBeenCalledWith('student-1')
    expect(screen.getByText(/카테고리 평균/)).toHaveTextContent(
      '카테고리 평균 82.6점',
    )
    expect(screen.getByText('● 성취도 6개 · CS 1개')).toBeInTheDocument()
    expect(screen.getAllByText('평가 1회')).toHaveLength(7)
    expect(screen.getAllByText('평균 점수')).toHaveLength(7)
    expect(screen.queryByText('상위 12.5%')).not.toBeInTheDocument()
    expect(screen.queryByText(/비교 표본/)).not.toBeInTheDocument()
    expect(screen.queryByText(/전체 시험 평균/)).not.toBeInTheDocument()
    expect(within(categoryCard).getByText('86점')).toBeInTheDocument()
    expect(within(categoryCard).queryByText('99점')).not.toBeInTheDocument()
    expect(
      screen.getByText(/운영 인증이 완료된 기술 근거 4건/),
    ).toBeInTheDocument()
    const codingTestGroup = document.querySelector(
      '[data-certification-group="coding-test"]',
    ) as HTMLElement
    const credentialGroup = document.querySelector(
      '[data-certification-group="credential"]',
    ) as HTMLElement
    expect(within(codingTestGroup).getByText('코딩테스트')).toBeInTheDocument()
    expect(within(codingTestGroup).getByText('PCCE')).toBeInTheDocument()
    expect(within(codingTestGroup).getByText('LV.4')).toBeInTheDocument()
    expect(within(codingTestGroup).getByText('900–1,000점')).toBeInTheDocument()
    expect(
      within(codingTestGroup).getByText('1,000 / 1,000점'),
    ).toBeInTheDocument()
    expect(
      within(credentialGroup).getByText('자격·기술 인증'),
    ).toBeInTheDocument()
    expect(
      within(credentialGroup).getByText('정보처리기사'),
    ).toBeInTheDocument()
    expect(
      within(credentialGroup).getByText('SQL 개발자(SQLD)'),
    ).toBeInTheDocument()
    expect(within(credentialGroup).getAllByText('최종합격')).toHaveLength(2)
    expect(
      within(credentialGroup).getByText('Kaggle Expert'),
    ).toBeInTheDocument()
    expect(within(credentialGroup).getByText('Expert')).toBeInTheDocument()
    expect(
      document.querySelector('[data-certification-group-grid]'),
    ).toHaveClass('lg:grid-cols-2')
    expect(screen.getByText('발급 2026-05-30')).toBeInTheDocument()
    expect(
      screen.getByText(
        '운영 인증 · 한국산업인력공단 · 시연용 자격번호 26200000001A',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('발급 2026-06-20')).toBeInTheDocument()
    expect(
      screen.getByText(
        '운영 인증 · 한국데이터산업진흥원 · 시연용 자격번호 SQLD-DEMO-26001 · 2028-06-20까지 유효',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Q-Net|K-DATA|진위확인/ }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('PCCP')).not.toBeInTheDocument()
    expect(screen.queryByText('PCSQL')).not.toBeInTheDocument()
    expect(screen.getAllByText('운영 인증')).toHaveLength(4)
    expect(screen.getByText('발급 2026-05-12')).toBeInTheDocument()
    expect(screen.getByText('운영 인증 · 제출 증빙 확인')).toBeInTheDocument()
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
