import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import StudentManagementPage from './StudentManagementPage'
import {
  useCreateTestStudent,
  useDeleteTestStudent,
  useStudentAccounts,
  useStudentAttendance,
  useStudentAttendanceForms,
  useSyncStudents,
} from '../api/students'
import {
  useCourseList,
  useCourseConfig,
  useResetAccountPassword,
} from '../api/settings'
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
    isTest: false,
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
    isTest: false,
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

// 테스트 계정 생성·삭제 mutate 호출을 따로 확인하려고 스텁을 분리해 둔다.
const deleteTestStub = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }
const createTestStub = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }

function renderPage(queue: StudentAccountQueue = accounts) {
  deleteTestStub.mutate.mockClear()
  createTestStub.mutate.mockClear()
  vi.mocked(useStudentAccounts).mockReturnValue(
    ok(queue) as unknown as ReturnType<typeof useStudentAccounts>,
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
  vi.mocked(useCreateTestStudent).mockReturnValue(
    createTestStub as unknown as ReturnType<typeof useCreateTestStudent>,
  )
  vi.mocked(useDeleteTestStudent).mockReturnValue(
    deleteTestStub as unknown as ReturnType<typeof useDeleteTestStudent>,
  )
  vi.mocked(useResetAccountPassword).mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({
      userId: 'stu-0027',
      temporaryPassword: 'Temp1234!abc',
    }),
    isPending: false,
  } as unknown as ReturnType<typeof useResetAccountPassword>)
  return render(
    <ToastProvider>
      {/* 기본 탭이 출결로 바뀌어(계정은 맨 뒤) 계정 탭 테스트는 ?tab=accounts로 진입한다. */}
      <MemoryRouter initialEntries={['/?tab=accounts']}>
        <StudentManagementPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('StudentManagementPage', () => {
  // 시연용 테스트 계정 — 목록에서 칩으로 구분되고, 차단 대신 삭제가 뜬다.
  it('테스트 계정은 칩과 삭제 버튼으로 구분해 보여준다', async () => {
    const user = userEvent.setup()
    renderPage({
      ...accounts,
      items: [
        ...accounts.items,
        {
          id: 'stu-test-1',
          name: '촬영용 수강생',
          studentUuid: 'test-1a2b3c4d',
          birthDate: '-',
          joinedAt: '07-29',
          lastLoginAt: null,
          trainingStatus: 'active',
          loginBlocked: false,
          isTest: true,
        },
      ],
    })

    expect(screen.getByText('촬영용 수강생')).toBeInTheDocument()
    expect(screen.getByText('테스트')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '삭제' }))

    expect(deleteTestStub.mutate).toHaveBeenCalledWith(
      'stu-test-1',
      expect.anything(),
    )
  })

  it('계정 탭 헤더에 테스트 계정 생성 버튼이 있다', () => {
    renderPage()
    expect(
      screen.getByRole('button', { name: /테스트 계정 생성/ }),
    ).toBeInTheDocument()
  })

  // 로그인 ID·비밀번호는 운영자가 직접 정한다 — 규칙에 안 맞으면 서버까지 가지 않는다.
  it('생성 모달은 이름·로그인 ID·비밀번호를 모두 갖춰야 제출된다', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /테스트 계정 생성/ }))

    const submit = screen.getByRole('button', { name: '계정 만들기' })
    expect(submit).toBeDisabled()

    await user.type(screen.getByPlaceholderText('예: 촬영용 수강생'), '촬영용')
    await user.type(screen.getByPlaceholderText('예: demo-student'), 'demo-student')
    // 8자 미만이면 아직 막힌다
    await user.type(screen.getByPlaceholderText('예: demo1234'), 'short')
    expect(submit).toBeDisabled()

    await user.type(screen.getByPlaceholderText('예: demo1234'), '123')
    expect(submit).toBeEnabled()

    await user.click(submit)
    expect(createTestStub.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '촬영용',
        loginId: 'demo-student',
        password: 'short123',
      }),
      expect.anything(),
    )
  })

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

  it('초기화 버튼은 비밀번호 초기화 모달을 열고, 발급 시 임시 비밀번호를 표시한다', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getAllByRole('button', { name: '초기화' })[0])
    expect(
      screen.getByRole('heading', { name: '비밀번호 초기화' }),
    ).toBeInTheDocument()
    // 확인 단계 — 모달 오픈만으로는 발급되지 않는다
    expect(screen.queryByText('Temp1234!abc')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '초기화하고 발급' }))
    // 발급 후 — 원문·복사 버튼·재발급 버튼이 모달에 유지된다(토스트 휘발 아님)
    expect(await screen.findByText('Temp1234!abc')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '임시 비밀번호 복사' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /새로 발급/ }),
    ).toBeInTheDocument()
    // 복사 토스트(부모 리렌더)가 떠도 발급 화면·비밀번호가 유지된다
    await user.click(screen.getByRole('button', { name: '임시 비밀번호 복사' }))
    expect(
      await screen.findByText('임시 비밀번호를 복사했어요'),
    ).toBeInTheDocument()
    expect(screen.getByText('Temp1234!abc')).toBeInTheDocument()
  })

  it('초기화 모달에서 매니저 메모를 남기면 발급 시 감사 로그 토스트가 뜬다', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getAllByRole('button', { name: '초기화' })[0])
    await user.type(
      screen.getByLabelText('매니저 메모'),
      '학생 요청으로 초기화',
    )
    await user.click(screen.getByRole('button', { name: '초기화하고 발급' }))
    expect(
      await screen.findByText('매니저 메모가 감사 로그에 함께 기록됐어요'),
    ).toBeInTheDocument()
    // 메모 토스트로 부모가 리렌더돼도 발급된 비밀번호가 소실되지 않는다
    expect(screen.getByText('Temp1234!abc')).toBeInTheDocument()
  })

  it('출결 탭으로 전환하면 HRD 일별 출결 KPI와 행이 보인다', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: /^출결$/ }))
    expect(screen.getByText('출석(정상)')).toBeInTheDocument()
    expect(screen.getByText('92')).toBeInTheDocument()
    // HRD 일별 출결 — 학생 행(이름·입실 시각)
    expect(screen.getByText('김건우')).toBeInTheDocument()
    expect(screen.getByText('08:36')).toBeInTheDocument()
  })

  it('출결 필터 탭은 전체·지각·결석·미입실·미퇴실을 제공한다', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: /^출결$/ }))
    for (const label of ['미입실', '미퇴실']) {
      expect(
        screen.getByRole('button', { name: new RegExp(label) }),
      ).toBeInTheDocument()
    }
  })
})
