import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import StudentManagementPage from './StudentManagementPage'
import {
  useStudentAccounts,
  useStudentAttendance,
  useStudentAttendanceForms,
  useSyncStudents,
  useResetStudentPassword,
} from '../api/students'
import { useCourseList, useCourseConfig } from '../api/settings'
import type {
  StudentAccountQueue,
  StudentAttendanceData,
  AttendanceFormData,
} from '@/shared/types'

vi.mock('../api/students')
vi.mock('../api/settings')

const accounts: StudentAccountQueue = {
  cohortLabel: 'AI 캠프 22기',
  summary: {
    total: 121,
    normal: 118,
    loginBlocked: 3,
    lastSyncAt: '09:42',
    syncCreated: 5,
    syncExisting: 116,
  },
  items: [
    {
      id: 'stu-0027',
      name: '김민준',
      studentUuid: '2024-AIB3-0027',
      birthDate: '1998-03-12',
      joinedAt: '05-01',
      lastLoginAt: '오늘 09:18',
      trainingStatus: 'active',
      loginBlocked: false,
    },
    {
      id: 'stu-0031',
      name: '정하늘',
      studentUuid: '2024-AIB3-0031',
      birthDate: '1996-05-14',
      joinedAt: '05-04',
      lastLoginAt: '05-12 16:08',
      trainingStatus: 'active',
      loginBlocked: true,
    },
  ],
}

const attendance: StudentAttendanceData = {
  cohortLabel: 'SK네트웍스 Family AI 캠프 34기',
  date: '2026-06-26',
  summary: {
    present: 92,
    late: 8,
    earlyLeaveOuting: 5,
    absent: 4,
    hrdMismatch: 3,
  },
  rows: [
    {
      id: '100062059655|20260626',
      studentName: '김건우',
      studentUuid: '100062059655',
      date: '2026-06-26',
      checkIn: '08:36',
      checkOut: '17:51',
      hrdStatus: 'normal',
      hrdStatusLabel: '출석',
    },
  ],
}

const forms: AttendanceFormData = {
  cohortLabel: 'AI 백엔드 3기',
  summary: {
    totalSubmitted: 42,
    late: 16,
    earlyLeaveOuting: 9,
    absent: 7,
    officialLeaveUsed: 10,
  },
  rows: [],
}

function ok(data: unknown) {
  return { data, isPending: false, isError: false }
}

function renderPage() {
  vi.mocked(useStudentAccounts).mockReturnValue(
    ok(accounts) as unknown as ReturnType<typeof useStudentAccounts>,
  )
  vi.mocked(useStudentAttendance).mockReturnValue(
    ok(attendance) as unknown as ReturnType<typeof useStudentAttendance>,
  )
  vi.mocked(useStudentAttendanceForms).mockReturnValue(
    ok(forms) as unknown as ReturnType<typeof useStudentAttendanceForms>,
  )
  vi.mocked(useCourseList).mockReturnValue(
    ok([
      {
        courseId: 'course-sk',
        title: 'SK네트웍스 Family AI 캠프',
        cohortCount: 1,
        status: 'operating',
        startDate: '2026-06-16',
        endDate: '2026-12-08',
      },
    ]) as unknown as ReturnType<typeof useCourseList>,
  )
  vi.mocked(useCourseConfig).mockReturnValue(
    ok({
      courseId: 'course-sk',
      title: 'SK네트웍스 Family AI 캠프',
      status: 'operating',
      startDate: '2026-06-16',
      endDate: '2026-12-08',
      cohorts: [
        {
          id: 'cohort-34',
          cohortNo: '34',
          hrdTrprId: 'AIG20240000459068',
          startDate: '2026-06-16',
          endDate: '2026-12-08',
          status: 'operating',
          mileageEnabled: true,
          playEnabled: true,
        },
      ],
    }) as unknown as ReturnType<typeof useCourseConfig>,
  )
  const mutationStub = {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }
  vi.mocked(useSyncStudents).mockReturnValue(
    mutationStub as unknown as ReturnType<typeof useSyncStudents>,
  )
  vi.mocked(useResetStudentPassword).mockReturnValue(
    mutationStub as unknown as ReturnType<typeof useResetStudentPassword>,
  )
  return render(
    <ToastProvider>
      <MemoryRouter>
        <StudentManagementPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('StudentManagementPage', () => {
  it('계정 탭에 HRD 동기화 hero와 학생 목록을 렌더한다', () => {
    renderPage()
    expect(
      screen.getByText(/HRD-Net 명단 동기화로 학생 계정을 일괄 관리합니다/),
    ).toBeInTheDocument()
    expect(screen.getByText('김민준')).toBeInTheDocument()
    expect(screen.getByText('정하늘')).toBeInTheDocument()
  })

  it('"로그인 차단" 필터는 차단 계정만 남긴다', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /로그인 차단 3/ }))
    expect(screen.queryByText('김민준')).not.toBeInTheDocument()
    expect(screen.getByText('정하늘')).toBeInTheDocument()
  })

  it('계정 행의 차단 버튼이 상세 모달을 열고 저장 시 토스트가 뜬다', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: '차단' }))
    expect(
      screen.getByRole('heading', { name: '학생 계정 상세' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '저장' }))
    expect(screen.getByText(/로그인 차단 적용/)).toBeInTheDocument()
  })

  it('출결 탭으로 전환하면 HRD 일별 출결 KPI와 행이 보인다', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /^출결$/ }))
    expect(screen.getByText('출석(정상)')).toBeInTheDocument()
    expect(screen.getByText('92')).toBeInTheDocument()
    // HRD 일별 출결 — 학생 행(이름·입실 시각)
    expect(screen.getByText('김건우')).toBeInTheDocument()
    expect(screen.getByText('08:36')).toBeInTheDocument()
  })

  it('출결 필터 탭은 전체·지각·결석·미입실·미퇴실을 제공한다', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /^출결$/ }))
    for (const label of ['미입실', '미퇴실']) {
      expect(
        screen.getByRole('button', { name: new RegExp(label) }),
      ).toBeInTheDocument()
    }
  })
})
