import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import EducationPage from './EducationPage'
import { useCourseDetail } from './api'
import { useCourseList } from '../api/settings'
import { useAllCourseCohorts } from './cohortRows'
import type { CourseDetail } from './types'

vi.mock('./api')
vi.mock('../api/settings')
vi.mock('./cohortRows')
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

// 기수 허브 — URL 의 :cohortId 하나를 탭으로 파고든다.
// 기수 고르기·기본 기수 판정은 담당 과정/기수 목록(CohortListPage)으로 옮겼다.

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

function renderHub(search = '') {
  vi.mocked(useCourseList).mockReturnValue(
    ok([
      { courseId: 'course-sk', title: 'SK네트웍스 Family AI 캠프' },
    ]) as unknown as ReturnType<typeof useCourseList>,
  )
  vi.mocked(useAllCourseCohorts).mockReturnValue({
    rows: [
      {
        cohortId: 'cohort-34',
        courseId: 'course-sk',
        courseTitle: 'SK네트웍스 Family AI 캠프',
        cohortNo: '34',
        cohortLabel: '34기',
        startDate: '2026-04-28',
        endDate: '2026-10-26',
        hrdTrprId: 'AIG2026-0001',
        status: 'ongoing' as const,
        dDayLabel: 'D-88',
      },
    ],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  })
  vi.mocked(useCourseDetail).mockReturnValue(
    ok(detail) as unknown as ReturnType<typeof useCourseDetail>,
  )
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/admin/education/cohort-34${search}`]}>
        <Routes>
          <Route
            path="/admin/education/:cohortId"
            element={<EducationPage />}
          />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('EducationPage (기수 허브)', () => {
  it('6개 탭(자료실/과제/퀴즈/프로젝트/이력서/기록실)을 렌더한다', () => {
    renderHub()
    for (const label of [
      '자료실',
      '과제',
      '퀴즈',
      '프로젝트',
      '이력서',
      '기록실',
    ]) {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument()
    }
  })

  // 설정은 목록의 [설정] 버튼으로 들어온다 — 탭에 두면 기수를 고른 뒤 한 번 더 찾아야 한다.
  it('설정은 탭 바에 없다', () => {
    renderHub()
    expect(screen.queryByRole('tab', { name: '설정' })).not.toBeInTheDocument()
  })

  it('목록으로 돌아가는 링크가 있다', () => {
    renderHub()
    expect(screen.getByRole('link', { name: /담당 과정\/기수/ })).toHaveAttribute(
      'href',
      '/admin/education',
    )
  })

  it('이력서 탭 = 실 BE 이력서 패널(현황·상세·피드백)', async () => {
    const user = userEvent.setup()
    renderHub()
    await user.click(screen.getByRole('tab', { name: '이력서' }))
    expect(screen.getByText('이력서 패널')).toBeInTheDocument()
  })

  it('기록실 탭 = 학습 기록 검토 흡수(임베드)', async () => {
    const user = userEvent.setup()
    renderHub()
    await user.click(screen.getByRole('tab', { name: '기록실' }))
    expect(screen.getByText('기록실 임베드')).toBeInTheDocument()
  })

  // 목록 [설정] 버튼이 ?tab=settings 로 보낸다 — 탭 바에 없어도 본문은 그려져야 한다.
  it('?tab=settings 로 들어오면 HRD 과정 상세를 보여준다', () => {
    renderHub('?tab=settings')
    expect(screen.getByText('K-디지털트레이닝')).toBeInTheDocument()
    expect(screen.getByText('17,424,000원')).toBeInTheDocument()
  })
})
