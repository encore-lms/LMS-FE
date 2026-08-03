import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import DashboardPage from '../dashboard/DashboardPage'
import CohortsPage from './CohortsPage'
import { useInstructorDashboard, useInstructorCohorts } from '../api/console'
import type {
  InstructorDashboardData,
  InstructorCohortsData,
} from '@/shared/types'

vi.mock('../api/console')

const dashboard: InstructorDashboardData = {
  instructorName: '박준석',
  cohortCount: 2,
  cohorts: [
    { id: 'da-4', label: 'DA 4기 · 진행 중' },
    { id: 'fe-7', label: 'FE 7기 · 진행 중' },
  ],
  kpiGrading: {
    value: 14,
    hint: '수동 채점 9 · 자동 재검토 5',
    badge: '오늘 +3',
  },
  kpiProjects: { value: 3, hint: 'PM 인증 요청 · D+2 1건' },
  kpiSupplements: { value: 2, hint: '학생 응답 대기 · D+5 1건', badge: '긴급' },
  priorities: [
    {
      id: 'pri-1',
      type: 'supplement',
      title: '점수 재검토 보완 응답',
      subtitle: '박지훈 · FE 7기',
      dday: 'D+5',
      urgent: true,
      actionLabel: '확인',
      to: '/instructor/cohorts/fe-7/education',
    },
    {
      id: 'pri-2',
      type: 'manual_grading',
      title: '알고리즘 기초 퀴즈 #3 · 5문항 채점 대기',
      subtitle: '김민준 · DA 4기',
      dday: 'D+1',
      urgent: false,
      actionLabel: '채점 시작',
      to: '/instructor/quizzes/quiz-algo-3/submissions',
    },
  ],
  shortcuts: {
    quizzes: { badge: 14, hint: '/instructor/quizzes · 채점 대기 14' },
    students: { hint: '/instructor/cohorts/:id/students · DA 4기 · FE 7기' },
    reviews: { badge: 12, hint: '기록 7 + 프로젝트 3 + 트러블슈팅 2' },
  },
}

const cohorts: InstructorCohortsData = {
  total: 5,
  operating: 2,
  upcoming: 0,
  ended: 3,
  summary: {
    operatingCourses: { value: 2, hint: 'DA 4기 · FE 7기' },
    students: { value: 42, hint: 'DA 24 + FE 18 · 위험 3' },
    gradingPending: { value: 14, hint: 'DA 9 + FE 5 · 오늘 +3' },
    reviewPending: { value: 12, hint: '기록 7 + 프로젝트 3 + 트러블 2' },
  },
  rows: [
    {
      id: 'da-4',
      name: 'DA 4기',
      subtitle: '데이터 분석 · 4회차',
      period: '2026.03.01 ~ 2026.05.31',
      dday: 'D-12',
      role: 'lead',
      students: 24,
      riskCount: 2,
      evalSummary: '미응시 3 · 제출 18',
      evalPending: '채점 대기 9',
      reviewSummary: '기록 4 · 프로젝트 2 · 트러블 1',
      reviewPending: '대기 7건',
      status: 'operating',
    },
    {
      id: 'da-3',
      name: 'DA 3기',
      subtitle: '데이터 분석 · 3회차',
      period: '2025.09.01 ~ 2025.12.20',
      dday: '종료',
      role: 'lead',
      students: 22,
      riskCount: 0,
      evalSummary: '미응시 0 · 제출 22',
      evalPending: '채점 완료',
      reviewSummary: '기록 0 · 프로젝트 0 · 트러블 0',
      reviewPending: '대기 0건',
      status: 'ended',
    },
  ],
}

function ok(data: unknown) {
  return { data, isPending: false, isError: false }
}

function mockAll() {
  vi.mocked(useInstructorDashboard).mockReturnValue(
    ok(dashboard) as unknown as ReturnType<typeof useInstructorDashboard>,
  )
  vi.mocked(useInstructorCohorts).mockReturnValue(
    ok(cohorts) as unknown as ReturnType<typeof useInstructorCohorts>,
  )
}

function renderAt(path: string) {
  mockAll()
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/instructor" element={<DashboardPage />} />
          <Route path="/instructor/cohorts" element={<CohortsPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('DashboardPage (§1)', () => {
  it('담당 selector·KPI 4·우선 처리 목록·바로가기를 렌더한다', () => {
    renderAt('/instructor')
    expect(screen.getByText('박준석 강사 · 담당 2개')).toBeInTheDocument()
    expect(screen.getByText('채점 대기')).toBeInTheDocument()
    expect(screen.getByText('오늘 +3')).toBeInTheDocument()
    expect(screen.getByText('긴급')).toBeInTheDocument()
    expect(screen.getByText('점수 재검토 보완 응답')).toBeInTheDocument()
    expect(screen.getByText('퀴즈 관리')).toBeInTheDocument()
  })

  // QA: "수강생 목록 API 미연동" — 실제로는 폐기된 /instructor/cohorts/all/students 로 이동해
  // 매칭되는 라우트가 없어 아무 화면도 뜨지 않았다. 허브 '수강생' 탭으로 보낸다.
  it('수강생 목록 바로가기는 등록된 라우트로 이동한다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor')

    await user.click(screen.getByText('수강생 목록'))

    // 기수 미선택(전체)이면 담당 과정 목록 — 퀴즈 관리와 같은 규칙.
    // 예전 경로는 라우터에 없어 이 화면이 뜨지 않았다.
    expect(await screen.findByText('진행 중 기수')).toBeInTheDocument()
  })

  it('긴급 행은 D+N 빨강 칩 강조, 액션 버튼은 흰 outline (Figma 실측)', () => {
    renderAt('/instructor')
    expect(screen.getByText('D+5').className).toContain('bg-danger-bg')
    const urgentBtn = screen.getByRole('button', { name: '확인' })
    expect(urgentBtn.className).not.toContain('bg-brand-deep')
    expect(urgentBtn.className).toContain('font-bold')
  })

  it('긴급도순은 서버 순서 그대로, 마감일순은 마감 실재 항목만 임박순으로 앞세운다', async () => {
    const user = userEvent.setup()
    mockAll()
    // 서버 산출 순서(긴급도순): 대기 인증 → 여유 퀴즈 → 마감 퀴즈.
    vi.mocked(useInstructorDashboard).mockReturnValue(
      ok({
        ...dashboard,
        priorities: [
          {
            id: 'w1',
            type: 'project_cert',
            title: '대기 인증',
            subtitle: '4기 · 3명',
            dday: '대기 5일',
            urgent: true,
            actionLabel: '검토하기',
            to: '/instructor/projects/review',
          },
          {
            id: 'q1',
            type: 'manual_grading',
            title: '여유 퀴즈',
            subtitle: '채점 대기 3건',
            dday: 'D-3',
            urgent: false,
            actionLabel: '채점하기',
            to: '/instructor/quizzes/q1/submissions',
          },
          {
            id: 'q2',
            type: 'manual_grading',
            title: '마감 퀴즈',
            subtitle: '채점 대기 2건',
            dday: '마감',
            urgent: true,
            actionLabel: '채점하기',
            to: '/instructor/quizzes/q2/submissions',
          },
        ],
      }) as unknown as ReturnType<typeof useInstructorDashboard>,
    )
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/instructor']}>
          <Routes>
            <Route path="/instructor" element={<DashboardPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>,
    )

    const titlesInOrder = () =>
      screen
        .getAllByText(/^(대기 인증|여유 퀴즈|마감 퀴즈)$/)
        .map((el) => el.textContent)
    expect(titlesInOrder()).toEqual(['대기 인증', '여유 퀴즈', '마감 퀴즈'])

    await user.click(
      screen.getByRole('button', { name: '우선 처리 목록 정렬' }),
    )
    await user.click(screen.getByText('정렬: 마감일'))
    expect(titlesInOrder()).toEqual(['마감 퀴즈', '여유 퀴즈', '대기 인증'])
  })
})

describe('CohortsPage (§2)', () => {
  it('요약 카드 4와 진행 중 기수 테이블을 렌더한다', () => {
    renderAt('/instructor/cohorts')
    expect(screen.getByText('진행 중 기수')).toBeInTheDocument()
    expect(screen.getByText('DA 24 + FE 18 · 위험 3')).toBeInTheDocument()
    expect(screen.getByText('DA 4기')).toBeInTheDocument()
    expect(screen.getByText('위험 2')).toBeInTheDocument()
    // 기본 탭 = 진행 중 → 종료 과정 미노출
    expect(screen.queryByText('DA 3기')).not.toBeInTheDocument()
  })

  it('종료 탭은 종료 과정만 보여준다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/cohorts')
    await user.click(screen.getByRole('button', { name: /종료 \(3\)/ }))
    expect(screen.getByText('DA 3기')).toBeInTheDocument()
    expect(screen.queryByText('DA 4기')).not.toBeInTheDocument()
  })
})
