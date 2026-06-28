import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import EducationPage from './EducationPage'
import { useCourseDetail, useEducationOverview } from './api'
import { useCourseConfig, useCourseList } from '../api/settings'
import type { CourseDetail, EducationOverview } from './types'

vi.mock('./api')
vi.mock('../api/settings')

// 과정·기수·교과목 — 과정/기수 select + 설명 탭(HRD 상세) + 교과목 탭.

const overview: EducationOverview = {
  summary: {
    courses: 18,
    coursesHrdLinked: 16,
    cohorts: 32,
    cohortsActive: 21,
    modules: 64,
    weeks: 312,
  },
  rows: [
    {
      id: 'mod-1',
      cohortLabel: 'AI 캠프 22기',
      moduleName: 'Java/Spring 기본',
      unit: '1단위',
      owner: '김강사',
      linkedFeatures: '퀴즈 4 · 기록실 6주',
    },
  ],
}

const detail: CourseDetail = {
  title: 'SK네트웍스 Family AI 캠프 34기',
  trainingType: 'K-디지털트레이닝',
  ncsName: '인공지능모델링',
  institution: '플레이데이터평생교육원',
  address: '서울특별시 서초구 효령로 335',
  supportAmount: '17,424,000원',
  manager: '권현주 (02-754-7302) <khj626@en-core.com>',
  trainingDays: '120',
  trainingHours: '960',
}

function ok(data: unknown) {
  return { data, isPending: false, isError: false }
}

function renderPage() {
  vi.mocked(useCourseList).mockReturnValue(
    ok([
      { courseId: 'course-sk', title: 'SK네트웍스 Family AI 캠프' },
    ]) as unknown as ReturnType<typeof useCourseList>,
  )
  vi.mocked(useCourseConfig).mockReturnValue(
    ok({
      courseId: 'course-sk',
      cohorts: [{ id: 'cohort-34', cohortNo: '34' }],
    }) as unknown as ReturnType<typeof useCourseConfig>,
  )
  vi.mocked(useCourseDetail).mockReturnValue(
    ok(detail) as unknown as ReturnType<typeof useCourseDetail>,
  )
  vi.mocked(useEducationOverview).mockReturnValue(
    ok(overview) as unknown as ReturnType<typeof useEducationOverview>,
  )
  return render(
    <ToastProvider>
      <MemoryRouter>
        <EducationPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('EducationPage (과정·기수·교과목)', () => {
  it('과정/기수 select와 설명·교과목 탭을 렌더한다', () => {
    renderPage()
    expect(screen.getByLabelText('과정 선택')).toBeInTheDocument()
    expect(screen.getByLabelText('기수 선택')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '설명' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '교과목/모듈' }),
    ).toBeInTheDocument()
  })

  it('기본 설명 탭 — HRD 과정 상세 항목을 보여준다', () => {
    renderPage()
    expect(
      screen.getByText('SK네트웍스 Family AI 캠프 34기'),
    ).toBeInTheDocument()
    expect(screen.getByText('K-디지털트레이닝')).toBeInTheDocument()
    expect(screen.getByText('인공지능모델링')).toBeInTheDocument()
    expect(screen.getByText('플레이데이터평생교육원')).toBeInTheDocument()
    expect(screen.getByText('17,424,000원')).toBeInTheDocument()
    expect(screen.getByText('~ (총 120일 / 960시간)')).toBeInTheDocument()
  })

  it('교과목/모듈 탭으로 전환하면 모듈 표가 보인다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '교과목/모듈' }))
    expect(screen.getByText('Java/Spring 기본')).toBeInTheDocument()
    expect(screen.getByText('퀴즈 4 · 기록실 6주')).toBeInTheDocument()
  })
})
