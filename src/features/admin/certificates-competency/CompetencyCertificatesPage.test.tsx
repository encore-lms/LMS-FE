import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { useStudentAccounts } from '@/shared/api'
import { useCourseConfig, useCourseList } from '../api/settings'
import CompetencyCertificatesPage from './CompetencyCertificatesPage'
import { useCertReviewList } from './api'

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  useStudentAccounts: vi.fn(),
}))
vi.mock('../api/settings')
vi.mock('./api')

function renderPage() {
  vi.mocked(useCourseList).mockReturnValue({
    data: [
      {
        courseId: 'course-1',
        title: '데이터 엔지니어링',
        cohortCount: 1,
        status: 'operating',
        startDate: '2026-02-02',
        endDate: '2026-08-24',
      },
    ],
  } as ReturnType<typeof useCourseList>)
  vi.mocked(useCourseConfig).mockReturnValue({
    data: {
      courseId: 'course-1',
      title: '데이터 엔지니어링',
      status: 'operating',
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
  } as ReturnType<typeof useCourseConfig>)
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
          name: '김누락',
          studentUuid: 'HRD-STUDENT-1',
          birthDate: '1999-01-01',
          joinedAt: '02-02',
          lastLoginAt: '08-24 17:00',
          trainingStatus: 'completed',
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
  vi.mocked(useCertReviewList).mockReturnValue({
    data: [
      {
        studentUserId: 'student-1',
        status: 'data_pending',
        updatedAt: '2026-08-26T18:00:00+09:00',
        pendingComment: null,
        published: false,
        goldStatus: 'PARTIAL',
        goldIssues: [
          {
            code: 'ATTENDANCE_RANGE_INCOMPLETE',
            label:
              '출결 데이터가 과정 시작일부터 종료일까지의 범위를 덮지 못합니다.',
            source: 'HRD_ATTENDANCE',
            resolution:
              '과정 시작 월부터 종강 월까지 HRD-Net 누적 출결을 다시 동기화해 주세요.',
          },
        ],
        goldCheckedAt: '2026-08-26T18:00:00+09:00',
        goldManagerNotifiedAt: '2026-08-26T18:01:00+09:00',
        analysisStatus: 'FAILED',
        analysisRunId: '00000000-0000-0000-0000-000000000001',
        analysisSourceVersion: 'gold-v1',
        analysisFailure: {
          code: 'AI_OUTPUT_INVALID',
          label: '7개 탭 결과 형식이 올바르지 않습니다.',
          source: 'LMS_AI',
          resolution: '원천 데이터를 확인한 뒤 분석을 다시 실행해 주세요.',
          retryable: true,
        },
        analysisCheckedAt: '2026-08-26T18:02:00+09:00',
        analysisManagerNotifiedAt: null,
      },
    ],
  } as unknown as ReturnType<typeof useCertReviewList>)

  return render(
    <MemoryRouter initialEntries={['/admin/certificates']}>
      <CompetencyCertificatesPage />
    </MemoryRouter>,
  )
}

describe('CompetencyCertificatesPage 발급 준비 상태 표시', () => {
  it('Gold와 AI 실패 원인·조치·담당 매니저 알림 상태를 함께 보여준다', () => {
    renderPage()

    expect(screen.getByText('Gold 일부 누락')).toBeInTheDocument()
    expect(
      screen.getByText(
        '출결 데이터가 과정 시작일부터 종료일까지의 범위를 덮지 못합니다.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /과정 시작 월부터 종강 월까지 HRD-Net 누적 출결을 다시 동기화/,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('AI 생성 실패')).toBeInTheDocument()
    expect(
      screen.getByText('7개 탭 결과 형식이 올바르지 않습니다.'),
    ).toBeInTheDocument()
    expect(screen.getByText('재실행 가능')).toBeInTheDocument()
    expect(screen.getByText(/담당 매니저 알림 2026-08-26/)).toBeInTheDocument()
    expect(screen.getByText('담당 매니저 알림 대기')).toBeInTheDocument()
    const readinessKpi =
      screen.getByText('발급 준비 확인 필요').parentElement?.parentElement
    expect(readinessKpi).not.toBeNull()
    expect(
      within(readinessKpi as HTMLElement).getByText('1명'),
    ).toBeInTheDocument()
  })
})
