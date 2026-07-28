import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import QuizListPage from './QuizListPage'
import QuizFormPage from './QuizFormPage'
import SubmissionsPage from './SubmissionsPage'
import GradingPage from './GradingPage'
import {
  useInstructorQuizzes,
  useInstructorQuizDetail,
  useQuizQuestions,
  useQuizSubmissions,
  useGradingDetail,
  useSaveGrading,
  useSaveQuiz,
  useDeleteQuiz,
  useQuizCategoryOptions,
} from '../api/quizzes'
import { useQuizTemplates, useQuizTemplateDetail } from '../api/quizTemplates'
import { useAssignmentCohortOptions } from '../api/assignments'
import { useCohortRoster } from '../api/console'
import type {
  InstructorQuizListData,
  QuizFormDetail,
  QuizQuestionsData,
  QuizSubmissionsData,
  GradingDetail,
} from '@/shared/types'

vi.mock('../api/quizzes')
vi.mock('../api/quizTemplates')
vi.mock('../api/assignments')
vi.mock('../api/console')

const quizList: InstructorQuizListData = {
  total: 14,
  manualPendingTotal: 15,
  items: [
    {
      id: 'quiz-algo-3',
      title: '알고리즘 기초 #3',
      cohortLabel: 'DA 4기',
      subject: '알고리즘',
      gradingMode: 'MANUAL',
      startAt: '2026-05-12',
      endAt: '2026-05-18',
      submitted: 18,
      targetCount: 24,
      manualPending: 9,
      visibility: 'published',
    },
    {
      id: 'quiz-react-hooks',
      title: 'React Hooks 실습',
      cohortLabel: 'FE 7기',
      subject: 'React',
      gradingMode: 'AUTO',
      startAt: '2026-05-18',
      endAt: '2026-05-25',
      submitted: 0,
      targetCount: 18,
      manualPending: null,
      visibility: 'draft',
    },
  ],
}

const quizDetail: QuizFormDetail = {
  id: 'quiz-algo-3',
  cohortId: 'c1',
  title: '알고리즘 기초 #3',
  cohortOption: 'DA 4기 · 알고리즘',
  description: '재귀·동적 계획법·그리디 기본 개념 확인.',
  category: '알고리즘',
  startAt: '2026-05-12 09:00',
  endAt: '2026-05-18 23:59',
  timeLimitMin: 90,
  allowRetake: false,
  gradingMode: 'MANUAL',
  resultReveal: 'after_grading',
  shuffleQuestions: true,
  shuffleChoices: true,
  totalPoints: 100,
  questionCount: 5,
  submittedCount: 18,
  visibility: 'published',
}

const questions: QuizQuestionsData = {
  quizTitle: '알고리즘 기초 #3',
  gradingMode: 'MANUAL',
  totalPoints: 100,
  targetPoints: 100,
  questions: [
    {
      id: 'q-1',
      order: 1,
      type: 'multiple_choice',
      points: 15,
      summary: '재귀 함수의 종료 조건',
      body: '재귀 함수의 종료 조건을 두 가지 예시와 함께 설명하시오.',
      modelAnswer: '베이스 케이스 명시.',
      explanation: '종료 조건 누락은 무한 재귀.',
      category: '알고리즘 · 재귀',
      difficulty: 'easy',
      createdAt: '2026-05-12',
      updatedAt: '2026-05-14',
      respondedCount: 18,
      totalCount: 24,
      avgScore: 12.1,
    },
    {
      id: 'q-3',
      order: 2,
      type: 'essay',
      points: 30,
      summary: 'DP vs 메모이제이션',
      body: 'DP와 메모이제이션의 차이를 설명하시오.',
      modelAnswer: 'Top-down vs Bottom-up.',
      explanation: '스택 오버플로 위험.',
      category: '알고리즘 · DP',
      difficulty: 'hard',
      createdAt: '2026-05-12',
      updatedAt: '2026-05-17',
      respondedCount: 18,
      totalCount: 24,
      avgScore: 18.4,
    },
  ],
}

const submissions: QuizSubmissionsData = {
  quizTitle: '알고리즘 기초 #3',
  totalPoints: 100,
  kpi: {
    submitted: 18,
    targetCount: 24,
    notSubmitted: 6,
    manualPending: 9,
    avgScore: 84.7,
  },
  rows: [
    {
      id: 'sub-1',
      studentUserId: 'u-1',
      studentName: '박지훈',
      cohortLabel: 'FE 7기',
      submitted: true,
      submittedAt: '05-17 21:14',
      score: 42,
      scoreFinal: false,
      gradingState: 'manual_pending',
      manualPendingCount: 3,
      feedbackEntered: false,
    },
    {
      id: 'sub-4',
      studentUserId: 'u-4',
      studentName: '김민준',
      cohortLabel: 'DA 4기',
      submitted: true,
      submittedAt: '05-16 22:30',
      score: 88,
      scoreFinal: true,
      gradingState: 'done',
      manualPendingCount: 0,
      feedbackEntered: true,
    },
    {
      id: 'sub-6',
      studentUserId: 'u-6',
      studentName: '송하늘',
      cohortLabel: 'DA 4기',
      submitted: false,
      submittedAt: null,
      score: null,
      scoreFinal: false,
      gradingState: null,
      manualPendingCount: 0,
      feedbackEntered: false,
    },
  ],
}

const grading: GradingDetail = {
  submissionId: 'sub-1',
  studentUserId: 'u-1',
  studentName: '박지훈',
  cohortLabel: 'FE 7기',
  quizTitle: '알고리즘 기초 #3',
  submittedAt: '2026-05-17 21:14',
  totalScore: 100,
  provisionalScore: 27,
  totalManualCount: 2,
  items: [
    {
      questionId: 'q-1',
      index: 1,
      type: 'essay',
      points: 15,
      status: 'done',
      body: '재귀 함수의 종료 조건을 설명하시오.',
      studentAnswer: '베이스 케이스와 범위 종료.',
      rubric: '두 가지 모두 = 만점 15.',
      score: 15,
      feedback: '잘 작성됨.',
      feedbackVisible: true,
    },
    {
      questionId: 'q-3',
      index: 2,
      type: 'essay',
      points: 30,
      status: 'pending',
      body: 'DP와 메모이제이션의 차이를 설명하시오.',
      studentAnswer: 'Top-down vs Bottom-up 차이입니다.',
      rubric: '두 관점 + 코드 = 만점 30.',
      score: null,
      feedback: '',
      feedbackVisible: false,
    },
  ],
}

function ok(data: unknown) {
  return { data, isPending: false, isError: false }
}

function mockAll() {
  vi.mocked(useInstructorQuizzes).mockReturnValue(
    ok(quizList) as unknown as ReturnType<typeof useInstructorQuizzes>,
  )
  vi.mocked(useInstructorQuizDetail).mockReturnValue(
    ok(quizDetail) as unknown as ReturnType<typeof useInstructorQuizDetail>,
  )
  vi.mocked(useQuizQuestions).mockReturnValue(
    ok(questions) as unknown as ReturnType<typeof useQuizQuestions>,
  )
  vi.mocked(useQuizSubmissions).mockReturnValue(
    ok(submissions) as unknown as ReturnType<typeof useQuizSubmissions>,
  )
  vi.mocked(useGradingDetail).mockReturnValue(
    ok(grading) as unknown as ReturnType<typeof useGradingDetail>,
  )
  vi.mocked(useQuizTemplates).mockReturnValue(
    ok({ total: 0, totalUseCount: 0, items: [] }) as unknown as ReturnType<
      typeof useQuizTemplates
    >,
  )
  // 템플릿 프리필 — 기본은 미선택(데이터 없음)
  vi.mocked(useQuizTemplateDetail).mockReturnValue(
    ok(undefined) as unknown as ReturnType<typeof useQuizTemplateDetail>,
  )
  vi.mocked(useQuizCategoryOptions).mockReturnValue(
    ok({
      quizCategories: ['빅데이터'],
      questionCategories: ['Spark', 'DataFrame'],
    }) as unknown as ReturnType<typeof useQuizCategoryOptions>,
  )
  vi.mocked(useAssignmentCohortOptions).mockReturnValue(
    ok([{ cohortId: 'c1', label: 'DA 4기' }]) as unknown as ReturnType<
      typeof useAssignmentCohortOptions
    >,
  )
  const mut = () => ({ mutate: vi.fn(), isPending: false }) as unknown as never
  vi.mocked(useSaveQuiz).mockReturnValue(mut())
  vi.mocked(useDeleteQuiz).mockReturnValue(mut())
  vi.mocked(useSaveGrading).mockReturnValue(mut())
  vi.mocked(useCohortRoster).mockReturnValue(
    ok([
      { userId: 'u-1', name: '박지훈' },
      { userId: 'u-4', name: '김민준' },
      { userId: 'u-6', name: '송하늘' },
    ]) as unknown as ReturnType<typeof useCohortRoster>,
  )
}

function renderAt(path: string, overrideMocks?: () => void) {
  mockAll()
  overrideMocks?.()
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/instructor/quizzes" element={<QuizListPage />} />
          <Route path="/instructor/quizzes/new" element={<QuizFormPage />} />
          <Route
            path="/instructor/quizzes/:quizId/edit"
            element={<QuizFormPage />}
          />
          <Route
            path="/instructor/quizzes/:quizId/submissions"
            element={<SubmissionsPage />}
          />
          <Route
            path="/instructor/quizzes/:quizId/submissions/:submissionId/grade"
            element={<GradingPage />}
          />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('QuizListPage (§5)', () => {
  it('퀴즈 목록·채점 모드 pill·수동 대기 배지를 렌더한다', () => {
    renderAt('/instructor/quizzes')
    expect(screen.getByText('알고리즘 기초 #3')).toBeInTheDocument()
    expect(screen.getAllByText('MANUAL').length).toBeGreaterThan(0)
    expect(screen.getByText('수동 대기 9')).toBeInTheDocument()
    expect(screen.getByText(/총 14개 · 수동 대기 15건/)).toBeInTheDocument()
  })

  it('제출 있는 퀴즈는 삭제 비활성, 임시저장은 제출 현황 비활성', () => {
    renderAt('/instructor/quizzes')
    const deleteButtons = screen.getAllByRole('button', { name: '삭제' })
    expect(deleteButtons[0]).toBeDisabled() // 제출 18건
    expect(deleteButtons[1]).toBeEnabled() // 제출 0건
    const submissionButtons = screen.getAllByRole('button', {
      name: '제출 현황',
    })
    expect(submissionButtons[0]).toBeEnabled()
    expect(submissionButtons[1]).toBeDisabled() // 임시저장
  })
})

describe('QuizFormPage (§6)', () => {
  it('수정 모드에서 제출 경고와 채점 모드 변경 차단을 렌더한다', () => {
    renderAt('/instructor/quizzes/quiz-algo-3/edit')
    expect(screen.getByText(/18명 응시 중/)).toBeInTheDocument()
    // MANUAL이 선택돼 있고 다른 모드는 비활성(세그먼트)
    expect(screen.getByRole('button', { name: /AUTO/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /MIXED/ })).toBeDisabled()
  })

  it('총점은 입력이 아니라 문항 합계로 자동 계산되는 읽기 전용 표시다', async () => {
    renderAt('/instructor/quizzes/quiz-algo-3/edit')
    // 총점은 문항 배점 합계에서 파생되므로 폼 입력이 아니다.
    expect(screen.queryByRole('spinbutton', { name: '총점' })).toBeNull()
    expect(
      await screen.findByText('문항 배점 합계로 자동 계산됩니다'),
    ).toBeInTheDocument()
  })

  it('생성 모드 빈 제출은 검증 에러를 보여준다', async () => {
    const user = userEvent.setup()
    // 생성 모드는 상세 데이터가 없어야 폼이 비어 있다 (mockAll 기본값 덮어쓰기).
    renderAt('/instructor/quizzes/new', () => {
      vi.mocked(useInstructorQuizDetail).mockReturnValue(
        ok(undefined) as unknown as ReturnType<typeof useInstructorQuizDetail>,
      )
    })
    // 저장 버튼은 적용될 공개 상태를 라벨에 노출한다(생성 기본값=임시저장).
    await user.click(screen.getByRole('button', { name: '저장 (임시저장)' }))
    // 시작/종료/제한시간은 생성 시 기본값(현재·다음날·60분)이라 제목만 검증 에러.
    expect(await screen.findByText('제목을 입력해주세요')).toBeInTheDocument()
  })

  it('공개 상태를 바꾸면 저장 버튼 라벨이 따라 바뀐다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/quizzes/new', () => {
      vi.mocked(useInstructorQuizDetail).mockReturnValue(
        ok(undefined) as unknown as ReturnType<typeof useInstructorQuizDetail>,
      )
    })
    await user.click(screen.getByRole('button', { name: '공개' }))
    expect(
      screen.getByRole('button', { name: '저장 (공개)' }),
    ).toBeInTheDocument()
  })
})

describe('SubmissionsPage (§8)', () => {
  it('KPI와 상태별 분기 액션을 렌더한다', () => {
    renderAt('/instructor/quizzes/quiz-algo-3/submissions')
    expect(screen.getByText('75%')).toBeInTheDocument()
    // 수동 대기 → 채점 / 완료 → 결과 보기 / 미제출 → 재독촉 알림
    expect(screen.getByRole('button', { name: '채점' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '결과 보기' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '재독촉 알림' }),
    ).toBeInTheDocument()
  })

  it('수동 대기 필터는 해당 행만 남긴다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/quizzes/quiz-algo-3/submissions')
    await user.click(screen.getByRole('button', { name: /수동 대기 \(9\)/ }))
    expect(screen.getByText('박지훈')).toBeInTheDocument()
    expect(screen.queryByText('김민준')).not.toBeInTheDocument()
  })
})

describe('GradingPage (§9)', () => {
  it('채점 헤더·진행률·문항 카드를 렌더한다', () => {
    renderAt('/instructor/quizzes/quiz-algo-3/submissions/sub-1/grade')
    expect(screen.getByText(/박지훈 · FE 7기/)).toBeInTheDocument()
    expect(screen.getByText(/1 \/ 2 문항 · 50%/)).toBeInTheDocument()
    expect(screen.getAllByText('채점 기준 (강사용)').length).toBe(2)
  })

  it('모든 수동 문항 입력 전에는 채점 완료가 비활성, 입력 후 활성', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/quizzes/quiz-algo-3/submissions/sub-1/grade')
    const completeBtn = screen.getByRole('button', { name: '채점 완료' })
    expect(completeBtn).toBeDisabled()
    await user.type(screen.getByLabelText('문제 2 점수'), '20')
    expect(completeBtn).toBeEnabled()
  })
})

describe('운영(/admin/quizzes) 마운트 — 강사 컴포넌트 재사용 (P0)', () => {
  it('admin 경로에서 내부 이동이 /admin/quizzes/*로 향한다', async () => {
    const user = userEvent.setup()
    mockAll()
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/admin/quizzes']}>
          <Routes>
            <Route path="/admin/quizzes" element={<QuizListPage />} />
            <Route
              path="/admin/quizzes/new"
              element={<div>admin-quiz-new</div>}
            />
            <Route
              path="/instructor/quizzes/new"
              element={<div>instructor-quiz-new</div>}
            />
          </Routes>
        </MemoryRouter>
      </ToastProvider>,
    )
    expect(screen.getByText('알고리즘 기초 #3')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /퀴즈 생성/ }))
    expect(screen.getByText('admin-quiz-new')).toBeInTheDocument()
  })
})
