import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import EducationPage from './EducationPage'
import { useCourseDetail } from './api'
import { useCourseConfig, useCourseList } from '../api/settings'
import type { CourseDetail } from './types'

vi.mock('./api')
vi.mock('../api/settings')
// 각 패널은 자체 데이터/훅이 많아 탭 분기 검증에선 스텁으로 대체.
vi.mock('../records/RecordsGridPage', () => ({
  default: () => <div>기록실 임베드</div>,
}))
vi.mock('@/features/instructor/quizzes/QuizListPage', () => ({
  default: () => <div>퀴즈 임베드</div>,
}))
vi.mock('./MaterialsPane', () => ({
  MaterialsPane: () => <div>자료실 패널</div>,
}))
vi.mock('./ResumePane', () => ({
  ResumePane: () => <div>이력서 패널</div>,
}))

// 과정·기수·교과목 — 6탭(자료실/과제/퀴즈/이력서/기록실/설정) + 흡수.

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

type CohortStub = { id: string; cohortNo: string; assigned?: boolean }

function renderPage(
  cohorts: CohortStub[] = [{ id: 'cohort-34', cohortNo: '34' }],
) {
  vi.mocked(useCourseList).mockReturnValue(
    ok([
      { courseId: 'course-sk', title: 'SK네트웍스 Family AI 캠프' },
    ]) as unknown as ReturnType<typeof useCourseList>,
  )
  vi.mocked(useCourseConfig).mockReturnValue(
    ok({
      courseId: 'course-sk',
      cohorts,
    }) as unknown as ReturnType<typeof useCourseConfig>,
  )
  vi.mocked(useCourseDetail).mockReturnValue(
    ok(detail) as unknown as ReturnType<typeof useCourseDetail>,
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
  it('6개 탭(자료실/과제/퀴즈/이력서/기록실/설정)을 렌더한다', () => {
    renderPage()
    for (const label of [
      '자료실',
      '과제',
      '퀴즈',
      '이력서',
      '기록실',
      '설정',
    ]) {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument()
    }
  })

  // 목록 첫 행은 최신 기수라 프로젝트·수강생이 아직 없는 경우가 많다.
  // 그 상태로 열리면 프로젝트 탭이 비어 보여 "동료 평가를 시작할 수 없다"로 오인된다.
  it('기본 기수는 목록 첫 행이 아니라 내가 담당하는 기수를 고른다', () => {
    renderPage([
      { id: 'cohort-35', cohortNo: '35', assigned: false },
      { id: 'cohort-32', cohortNo: '32', assigned: true },
    ])
    expect(screen.getByLabelText('기수 선택')).toHaveTextContent('32기')
  })

  it('담당 기수가 없으면 첫 기수로 떨어진다', () => {
    renderPage([
      { id: 'cohort-35', cohortNo: '35', assigned: false },
      { id: 'cohort-31', cohortNo: '31', assigned: false },
    ])
    expect(screen.getByLabelText('기수 선택')).toHaveTextContent('35기')
  })

  it('이력서 탭 = 실 BE 이력서 패널(현황·상세·피드백)', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: '이력서' }))
    expect(screen.getByText('이력서 패널')).toBeInTheDocument()
  })

  it('기록실 탭 = 학습 기록 검토 흡수(임베드)', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: '기록실' }))
    expect(screen.getByText('기록실 임베드')).toBeInTheDocument()
  })

  it('설정 탭 — HRD 과정 상세 항목을 보여준다', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: '설정' }))
    expect(screen.getByText('K-디지털트레이닝')).toBeInTheDocument()
    expect(screen.getByText('17,424,000원')).toBeInTheDocument()
    expect(screen.getByText('~ (총 120일 / 960시간)')).toBeInTheDocument()
  })
})
