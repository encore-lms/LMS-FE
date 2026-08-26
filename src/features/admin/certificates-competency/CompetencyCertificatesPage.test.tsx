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
        managerNotifiedAt: '2026-08-26T18:01:00+09:00',
      },
    ],
  } as unknown as ReturnType<typeof useCertReviewList>)

  return render(
    <MemoryRouter initialEntries={['/admin/certificates']}>
      <CompetencyCertificatesPage />
    </MemoryRouter>,
  )
}

describe('CompetencyCertificatesPage Gold 실패 표시', () => {
  it('증명서를 열지 않고 실패 원인·조치·담당 매니저 알림 상태를 보여준다', () => {
    renderPage()

    expect(screen.getByText('일부 데이터 누락')).toBeInTheDocument()
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
    expect(screen.getByText(/담당 매니저 알림/)).toBeInTheDocument()
    const goldKpi =
      screen.getByText('Gold 확인 필요').parentElement?.parentElement
    expect(goldKpi).not.toBeNull()
    expect(within(goldKpi as HTMLElement).getByText('1명')).toBeInTheDocument()
  })
})
