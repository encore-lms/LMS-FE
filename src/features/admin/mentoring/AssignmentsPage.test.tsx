import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import AssignmentsPage from './AssignmentsPage'
import { useCourseConfig, useCourseList } from '../api/settings'
import { useMyCohorts } from '../api/dashboard'
import { useAdminMentoringLogs, useMentorAssignments } from './api'
import type { MentorAssignmentsData } from './types'

vi.mock('../api/settings')
vi.mock('../api/dashboard')
vi.mock('./api')

const assignments: MentorAssignmentsData = {
  kpis: {
    activeMentors: 1,
    activeAssignments: 1,
    activeAssignmentsHint: 'AI 1',
    unassignedTeams: 0,
    unassignedTeamsHint: '',
    earlyEnded: 0,
  },
  cohorts: [
    {
      cohortId: 'cohort-ai-5',
      courseName: 'AI 캠프',
      cohortLabel: '5기',
      cohortName: 'AI 캠프 5기',
    },
  ],
  mentors: [{ mentorId: 'mentor-kim', name: '김멘토' }],
  templates: [
    {
      templateId: 'template-default',
      name: '기본 템플릿',
      isDefault: true,
    },
  ],
  rows: [
    {
      teamId: 'team-alpha',
      teamName: '알파 팀',
      cohortId: 'cohort-ai-5',
      cohortLabel: '5기',
      courseName: 'AI 캠프',
      memberCount: 3,
      members: [],
      assignmentId: 'assignment-alpha',
      mentor: { mentorId: 'mentor-kim', name: '김멘토' },
      allocatedHours: 10,
      recognizedHours: 4,
      recognizedPct: 40,
      hasLogs: false,
      status: 'active',
      nHoursDone: false,
      logTemplateId: 'template-default',
    },
  ],
  summary: { total: 1, active: 1, unassigned: 0 },
}

function renderPage(
  initialEntry = '/admin/mentors/assignments?course=course-ai&cohort=cohort-ai-5',
) {
  vi.mocked(useCourseList).mockReturnValue({
    data: [
      {
        courseId: 'course-ai',
        title: 'AI 캠프',
        cohortCount: 1,
        status: 'operating',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      },
    ],
  } as ReturnType<typeof useCourseList>)
  vi.mocked(useCourseConfig).mockReturnValue({
    data: {
      courseId: 'course-ai',
      title: 'AI 캠프',
      status: 'operating',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      cohorts: [
        {
          id: 'cohort-ai-5',
          cohortNo: '5',
          hrdTrprId: null,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          status: 'operating',
          mileageEnabled: true,
          playEnabled: true,
        },
      ],
    },
  } as ReturnType<typeof useCourseConfig>)
  vi.mocked(useMyCohorts).mockReturnValue({
    data: [],
  } as unknown as ReturnType<typeof useMyCohorts>)
  vi.mocked(useMentorAssignments).mockReturnValue({
    data: assignments,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useMentorAssignments>)
  vi.mocked(useAdminMentoringLogs).mockReturnValue({
    data: { rows: [] },
    isPending: false,
  } as unknown as ReturnType<typeof useAdminMentoringLogs>)

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ToastProvider>
        <AssignmentsPage />
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('AssignmentsPage 관리 툴바', () => {
  it('과정·기수·멘토·검색과 액션을 하나의 툴바에 모은다', () => {
    renderPage()

    const toolbar = screen.getByRole('region', { name: '배정 관리 도구' })
    expect(within(toolbar).getByLabelText('교육과정 선택')).toBeInTheDocument()
    expect(within(toolbar).getByLabelText('기수 선택')).toBeInTheDocument()
    expect(within(toolbar).getByLabelText('멘토 필터')).toBeInTheDocument()
    expect(
      within(toolbar).getByLabelText('팀명·멘토명 검색'),
    ).toBeInTheDocument()
    expect(
      within(toolbar).getByRole('link', { name: '템플릿 관리' }),
    ).toHaveAttribute('href', '/admin/mentoring/log-templates')
    expect(
      within(toolbar).getByRole('button', { name: '새 배정 추가' }),
    ).toBeEnabled()
  })

  it('브랜드 초록 배경에서 두 액션을 흰색 버튼 계열로 통일한다', () => {
    renderPage()

    const toolbar = screen.getByRole('region', { name: '배정 관리 도구' })
    expect(toolbar).toHaveClass('bg-brand')
    expect(
      within(toolbar).getByRole('link', { name: '템플릿 관리' }),
    ).toHaveClass('bg-white', 'text-[#355548]')
    expect(
      within(toolbar).getByRole('button', { name: '새 배정 추가' }),
    ).toHaveClass('bg-white', 'text-[#355548]')
  })

  it('기존 히어로 문구와 기수별 중복 배정 버튼을 제거한다', () => {
    renderPage()

    expect(
      screen.queryByText('반/기수별 팀 배정 · N시간 · 일지 템플릿 관리'),
    ).toBeNull()
    expect(
      screen.queryByRole('button', { name: '배정 추가' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: '새 배정 추가' }),
    ).toHaveLength(1)
  })

  it('기수를 선택하지 않으면 새 배정 추가를 비활성화한다', () => {
    renderPage('/admin/mentors/assignments')

    expect(screen.getByRole('button', { name: '새 배정 추가' })).toBeDisabled()
  })
})
