import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import { useStudentAccounts } from '@/shared/api'
import {
  useCertificateAnalysis,
  type CertificateAnalysisView,
} from '@/features/student/certificate/analysis'
import { createCertificateSevenTabFixture } from '@/features/student/certificate/analysis/sevenTabFixture'
import { useCourseConfig } from '../api/settings'
import CompetencyCertificateDetailPage from './CompetencyCertificateDetailPage'
import {
  useCertReviewList,
  useCertifyCertificate,
  useRequestCertChanges,
  useStartCertReview,
} from './api'

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  useStudentAccounts: vi.fn(),
}))
vi.mock('../api/settings', () => ({ useCourseConfig: vi.fn() }))
vi.mock('./api', () => ({
  useCertReviewList: vi.fn(),
  useCertifyCertificate: vi.fn(),
  useRequestCertChanges: vi.fn(),
  useStartCertReview: vi.fn(),
}))
vi.mock('@/features/student/certificate/analysis', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/features/student/certificate/analysis')
  >()),
  useCertificateAnalysis: vi.fn(),
}))
vi.mock(
  '@/features/student/certificate/tabs/seven-tab/CertificateSevenTabPanel',
  () => ({
    CertificateSevenTabPanel: ({
      target,
    }: {
      target: { scope: string; studentId: string }
    }) => <div>{`${target.scope}:${target.studentId} 7개 탭 본문`}</div>,
  }),
)

function analysisView(): CertificateAnalysisView {
  const tabs = createCertificateSevenTabFixture()
  return {
    reviewStatus: 'reviewing',
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
      lockedReason: 'REVIEW_IN_PROGRESS',
      missingRequirements: [],
      failure: null,
    },
    snapshot: null,
    resultSchemaVersion: '2026.08.26-certificate-seven-tab-result-v1',
    tabs,
    analysis: tabs.aiAnalysis.payload.analysis ?? null,
  }
}

function mockQueries(view: CertificateAnalysisView) {
  vi.mocked(useStudentAccounts).mockReturnValue({
    data: {
      cohortLabel: '데이터 엔지니어링 21기',
      summary: {
        total: 1,
        normal: 1,
        loginBlocked: 0,
        lastSyncAt: '18:00',
        syncCreated: 0,
        syncExisting: 1,
      },
      items: [
        {
          id: 'student-1',
          name: '김실데이터',
          studentUuid: 'HRD-STUDENT-1',
          birthDate: '1999-01-01',
          joinedAt: '02-02',
          lastLoginAt: '08-24 17:00',
          trainingStatus: 'active',
          hrdTrainingStatus: '수료',
          loginBlocked: false,
          isTest: false,
        },
      ],
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useStudentAccounts>)
  vi.mocked(useCourseConfig).mockReturnValue({
    data: {
      courseId: 'course-1',
      title: '실제 데이터 엔지니어링 과정',
      status: 'ended',
      startDate: '2026-02-02',
      endDate: '2026-08-24',
      cohorts: [
        {
          id: 'cohort-21',
          cohortNo: '21',
          hrdTrprId: 'HRD-21',
          startDate: '2026-02-02',
          endDate: '2026-08-24',
          status: 'ended',
          assigned: true,
          mileageEnabled: true,
          playEnabled: true,
        },
      ],
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCourseConfig>)
  vi.mocked(useCertReviewList).mockReturnValue({
    data: [
      {
        studentUserId: 'student-1',
        status: 'reviewing',
        updatedAt: '2026-08-26T00:00:00Z',
        pendingComment: null,
        published: false,
        goldStatus: 'READY',
        goldIssues: [],
        goldCheckedAt: '2026-08-26T00:00:00Z',
        goldManagerNotifiedAt: null,
        analysisStatus: 'READY',
        analysisRunId: '00000000-0000-0000-0000-000000000001',
        analysisSourceVersion: 'gold-v1',
        analysisFailure: null,
        analysisCheckedAt: '2026-08-26T00:00:00Z',
        analysisManagerNotifiedAt: null,
      },
    ],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCertReviewList>)
  vi.mocked(useCertificateAnalysis).mockReturnValue({
    data: view,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCertificateAnalysis>)
}

function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter
        initialEntries={[
          '/admin/certificates/student-1?courseId=course-1&cohortId=cohort-21',
        ]}
      >
        <Routes>
          <Route
            path="/admin/certificates/:studentId"
            element={<CompetencyCertificateDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('관리자 역량 증명서 상세', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mutation = { isPending: false, mutate: vi.fn() }
    vi.mocked(useStartCertReview).mockReturnValue(
      mutation as unknown as ReturnType<typeof useStartCertReview>,
    )
    vi.mocked(useRequestCertChanges).mockReturnValue(
      mutation as unknown as ReturnType<typeof useRequestCertChanges>,
    )
    vi.mocked(useCertifyCertificate).mockReturnValue(
      mutation as unknown as ReturnType<typeof useCertifyCertificate>,
    )
  })

  it('실제 로스터·과정 정보와 관리자 BFF의 7개 탭을 보여준다', () => {
    mockQueries(analysisView())
    renderPage()

    expect(screen.getAllByText('김실데이터').length).toBeGreaterThan(0)
    expect(
      screen.getByText(/실제 데이터 엔지니어링 과정 · 21기/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이력서' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '✦ AI 분석' }),
    ).toBeInTheDocument()
    expect(screen.getByText('admin:student-1 7개 탭 본문')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '정식 인증 승인' })).toBeEnabled()
  })

  it('한 탭이라도 PARTIAL이면 증명서 셸과 승인 동작을 함께 막는다', () => {
    const view = analysisView()
    view.tabs!.resume = {
      ...view.tabs!.resume,
      readinessStatus: 'PARTIAL',
      missingRequirements: [
        { code: 'RESUME_MISSING', source: 'LMS', detail: '이력서가 없습니다.' },
      ],
    }
    mockQueries(view)
    renderPage()

    expect(screen.queryByRole('button', { name: '종합 요약' })).toBeNull()
    expect(
      screen.getByRole('button', { name: '정식 인증 승인' }),
    ).toBeDisabled()
    expect(screen.getByText('admin:student-1 7개 탭 본문')).toBeInTheDocument()
  })
})
