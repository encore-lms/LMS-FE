import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import DashboardPage from '../dashboard/DashboardPage'
import CohortsPage from './CohortsPage'
import CohortStudentsPage from './CohortStudentsPage'
import {
  useInstructorDashboard,
  useInstructorCohorts,
  useCohortStudents,
} from '../api/console'
import type {
  InstructorDashboardData,
  InstructorCohortsData,
  CohortStudentsData,
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
  kpiRecords: { value: 7, hint: '블로그 4 · 스터디 2 · 자격증 1' },
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
      to: '/instructor/cohorts/fe-7/students',
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

const students: CohortStudentsData = {
  cohortLabel: 'DA 4기',
  total: 24,
  riskTotal: 3,
  rows: [
    {
      id: 'stu-1',
      name: '박지훈',
      emailUuid: 'park.jh@playdata · ghi-9012',
      cohortLabel: 'FE 7기',
      certStatus: 'changes_requested',
      quizAvg: '평균 78.2',
      quizDetail: '미응시 0 · 채점 1',
      recordApproved: '승인 8',
      recordDetail: '대기 0 · 반려 1',
      projectStatus: 'reviewing',
      riskFlags: ['점수 재검토'],
    },
    {
      id: 'stu-2',
      name: '이서연',
      emailUuid: 'lee.sy@playdata · def-5678',
      cohortLabel: 'DA 4기',
      certStatus: 'reviewing',
      quizAvg: '평균 84.7',
      quizDetail: '미응시 1 · 채점 2',
      recordApproved: '승인 12',
      recordDetail: '대기 1 · 반려 0',
      projectStatus: 'certified',
      riskFlags: [],
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
  vi.mocked(useCohortStudents).mockReturnValue(
    ok(students) as unknown as ReturnType<typeof useCohortStudents>,
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
          <Route
            path="/instructor/cohorts/:cohortId/students"
            element={<CohortStudentsPage />}
          />
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

  it('긴급 행은 D+N 강조와 primary 액션 버튼을 가진다', () => {
    renderAt('/instructor')
    const urgentBtn = screen.getByRole('button', { name: '확인' })
    expect(urgentBtn.className).toContain('bg-brand-deep')
    const normalBtn = screen.getByRole('button', { name: '채점 시작' })
    expect(normalBtn.className).not.toContain('bg-brand-deep')
  })
})

describe('CohortsPage (§2)', () => {
  it('요약 카드 4와 진행 중 과정 테이블을 렌더한다', () => {
    renderAt('/instructor/cohorts')
    expect(screen.getByText('진행 중 과정')).toBeInTheDocument()
    expect(screen.getByText('DA 24 + FE 18 · 위험 3')).toBeInTheDocument()
    expect(screen.getByText('DA 4기')).toBeInTheDocument()
    expect(screen.getByText('위험 2')).toBeInTheDocument()
    // 기본 탭 = 진행 중 → 종료 과정 미노출
    expect(screen.queryByText('DA 3기')).not.toBeInTheDocument()
  })

  it('종료 탭은 종료 과정만 보여준다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/cohorts')
    await user.click(screen.getByRole('button', { name: /종료 3/ }))
    expect(screen.getByText('DA 3기')).toBeInTheDocument()
    expect(screen.queryByText('DA 4기')).not.toBeInTheDocument()
  })
})

describe('CohortStudentsPage (§3)', () => {
  it('증명서 상태 pill·위험 플래그·정책 푸터를 렌더한다', () => {
    renderAt('/instructor/cohorts/da-4/students')
    expect(screen.getByText('박지훈')).toBeInTheDocument()
    // '보완 요청'은 증명서 필터 option에도 있어 badge 포함 2곳 이상
    expect(screen.getAllByText('보완 요청').length).toBeGreaterThan(1)
    expect(screen.getByText('점수 재검토')).toBeInTheDocument()
    expect(screen.getByText('— 없음')).toBeInTheDocument()
    expect(
      screen.getByText(/담당 기수 밖 학생은 노출되지 않습니다/),
    ).toBeInTheDocument()
  })

  it('위험 필터는 플래그 있는 수강생만 남긴다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/cohorts/da-4/students')
    await user.click(screen.getByRole('button', { name: /위험: 전체/ }))
    expect(screen.getByText('박지훈')).toBeInTheDocument()
    expect(screen.queryByText('이서연')).not.toBeInTheDocument()
  })
})
