import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import EducationPage from './EducationPage'
import { useCourseDetail } from './api'
import { useAdminCohorts } from './cohortRows'
import type { CourseDetail } from './types'

vi.mock('./api')
vi.mock('./cohortRows')
// 각 패널은 자체 데이터/훅이 많아 탭 분기 검증에선 스텁으로 대체.
vi.mock('@/features/instructor/reviews/RecordReviewPage', () => ({
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
vi.mock('../students/StudentsPane', () => ({
  StudentsPane: ({ scope }: { scope?: { cohortId: string } }) => (
    <div>수강생 패널 {scope?.cohortId}</div>
  ),
}))
vi.mock('../mentoring/MentoringPane', () => ({
  MentoringPane: ({ cohortId }: { cohortId: string }) => (
    <div>멘토링 패널 {cohortId}</div>
  ),
}))
vi.mock('@/features/student/qna/QnaListPage', () => ({
  default: () => <div>QnA 임베드</div>,
}))
vi.mock('./SettingsPane', () => ({
  SettingsPane: ({ cohortId }: { cohortId: string }) => (
    <div>과정 설정 패널 {cohortId}</div>
  ),
}))
vi.mock('./CourseHomePane', () => ({
  CourseHomePane: ({ cohortId }: { cohortId: string }) => (
    <div>과정 홈 패널 {cohortId}</div>
  ),
}))
vi.mock('@/features/instructor/education/NoticesPane', () => ({
  NoticesPane: ({ cohortId }: { cohortId: string }) => (
    <div>공지 패널 {cohortId}</div>
  ),
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
  vi.mocked(useAdminCohorts).mockReturnValue({
    data: {
      total: 1,
      operating: 1,
      upcoming: 0,
      ended: 0,
      summary: {
        operatingCourses: { value: 1, hint: '' },
        students: { value: 0, hint: '' },
        gradingPending: { value: 0, hint: '' },
        reviewPending: { value: 0, hint: '' },
      },
      rows: [
        {
          id: 'cohort-34',
          courseId: 'course-sk',
          name: 'SK네트웍스 Family AI 캠프 34기',
          subtitle: 'SK네트웍스 Family AI 캠프 · 34회차',
          courseTitle: 'SK네트웍스 Family AI 캠프',
          cohortLabel: '34기',
          period: '2026.04.28 ~ 2026.10.26',
          dday: 'D-88',
          instructors: [],
          hrdTrprId: 'AIG2026-0001',
          students: 0,
          evalSummary: '미응시 0 · 제출 0',
          evalPending: '채점 대기 0',
          reviewSummary: '기록 0 · 프로젝트 0 · 트러블 0',
          reviewPending: '대기 0건',
          status: 'operating' as const,
        },
      ],
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useAdminCohorts>)
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

// 공통 탭(수강생~기록실)은 강사 허브와 상대 순서 동일, 매니저 전용 탭은 roleTag 접미(2026-08-03).
const TAB_ORDER = [
  '과정 홈',
  '수강생',
  '공지',
  '자료실',
  '과제',
  '퀴즈',
  '프로젝트',
  '이력서',
  '기록실',
  'QnA 게시판',
  // 수강생 평가(2026-08-06 신설) — 강사 허브와 공용 탭.
  '수강생 평가',
  '수강생 종합 데이터(매니저)',
  '멘토링(매니저)',
  '설정(매니저)',
]

describe('EducationPage (기수 허브)', () => {
  it('14개 탭을 렌더한다', () => {
    renderHub()
    for (const label of TAB_ORDER) {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument()
    }
  })

  // 탭 순서 — 공통 구간은 강사 허브와 동일, 전용 탭(과정 홈·멘토링·설정)이 앞뒤.
  it('탭 순서가 과정 홈 → … → 설정(매니저) 이다', () => {
    renderHub()
    expect(screen.getAllByRole('tab').map((el) => el.textContent)).toEqual(
      TAB_ORDER,
    )
  })

  it('목록으로 돌아가는 링크가 있다', () => {
    renderHub()
    expect(screen.getByRole('link', { name: /교육과정/ })).toHaveAttribute(
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

  // 과정 정보와 기능 설정(마일리지·PLAY·커리큘럼)을 한 패널이 갖는다.
  it('설정 탭은 과정 설정 패널을 그 기수로 보여준다', () => {
    renderHub('?tab=settings')
    expect(screen.getByText('과정 설정 패널 cohort-34')).toBeInTheDocument()
  })

  // 사이드바 단독 메뉴에서 옮겨 온 셋 — 기수를 고른 뒤에 하는 일이라 허브 안이 제자리다.
  it('수강생 탭은 허브가 고른 기수로 스코프된다', async () => {
    const user = userEvent.setup()
    renderHub()
    await user.click(screen.getByRole('tab', { name: '수강생' }))
    expect(screen.getByText('수강생 패널 cohort-34')).toBeInTheDocument()
  })

  it('멘토링 탭도 같은 기수로 스코프된다', async () => {
    const user = userEvent.setup()
    renderHub()
    await user.click(screen.getByRole('tab', { name: '멘토링(매니저)' }))
    expect(screen.getByText('멘토링 패널 cohort-34')).toBeInTheDocument()
  })

  it('QnA 탭은 게시판을 임베드한다', async () => {
    const user = userEvent.setup()
    renderHub()
    await user.click(screen.getByRole('tab', { name: 'QnA 게시판' }))
    expect(screen.getByText('QnA 임베드')).toBeInTheDocument()
  })

  // 과정 홈은 수강생 강의 홈과 같은 집계 — 이 기수 기준으로 부른다.
  it('과정 홈 탭은 그 기수의 강의 홈을 보여준다', () => {
    renderHub()
    expect(screen.getByText('과정 홈 패널 cohort-34')).toBeInTheDocument()
  })

  // 공지는 강사 허브와 같은 한 벌을 쓴다 — 그동안 운영에는 공지를 쓸 자리가 없었다.
  it('공지 탭은 강사 허브와 같은 패널을 그 기수로 보여준다', async () => {
    const user = userEvent.setup()
    renderHub()
    await user.click(screen.getByRole('tab', { name: '공지' }))
    expect(screen.getByText('공지 패널 cohort-34')).toBeInTheDocument()
  })

  it('URL 로 바로 공지 탭에 들어올 수 있다', () => {
    renderHub('?tab=notices')
    expect(screen.getByText('공지 패널 cohort-34')).toBeInTheDocument()
  })
})
