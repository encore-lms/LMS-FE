import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import GradingPage from './GradingPage'
import { useAdminGradingDetail, useSaveGrading } from '../api/quizzes'
import { usePageHeaderStore } from '@/shared/store'
import type { AdminGradingDetail } from '@/shared/types'

vi.mock('../api/quizzes')
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    danger: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    show: vi.fn(),
  }),
}))

type DetailHook = ReturnType<typeof useAdminGradingDetail>
type SaveHook = ReturnType<typeof useSaveGrading>

// Figma 1515:10710 대표값 — 박서연(점수 입력 완료) + 내비 시연용 2건.
const sub1: AdminGradingDetail = {
  submissionId: 'sub_1',
  quizId: 'qz_sql_join',
  student: { name: '박서연', cohort: 'DA 4기' },
  quizTitle: 'SQL 조인 퀴즈',
  submittedAt: '2026-05-19 09:34',
  gradingStatus: 'pending_manual',
  currentScore: 68,
  ungradedCount: 0,
  changeLogCount: 3,
  elapsedMinutes: 12,
  avgElapsedMinutes: 8,
  timeLimitMinutes: 40,
  timeUsedMinutes: 38,
  autoGradedCount: 6,
  totalQuestionCount: 8,
  prevSubmissionId: null,
  nextSubmissionId: 'sub_2',
  items: [
    {
      questionId: 'gq_5',
      questionNo: 5,
      type: 'short_answer',
      maxPoints: 12,
      prompt: '집계 결과에서 부서별 평균 급여를 구하는 SQL 절을 작성하세요.',
      studentAnswer: 'SELECT dept, AVG(salary) FROM employees GROUP BY dept',
      rubric: 'GROUP BY 포함, 집계 함수 정확성, alias 선택은 감점 없음',
      score: 10,
      feedback: '',
      feedbackVisible: false,
      resultStatus: 'partial',
    },
    {
      questionId: 'gq_8',
      questionNo: 8,
      type: 'essay',
      maxPoints: 20,
      prompt: 'INNER JOIN과 LEFT JOIN의 결과 차이를 예시로 설명하세요.',
      studentAnswer:
        'LEFT JOIN은 왼쪽 테이블 기준으로 매칭되지 않은 행도 남기며 NULL이 채워집니다.',
      score: 16,
      feedback: '예시는 적절하나 INNER JOIN 누락으로 4점 감점',
      feedbackVisible: true,
      resultStatus: 'partial',
    },
  ],
}

const sub2: AdminGradingDetail = {
  ...sub1,
  submissionId: 'sub_2',
  student: { name: '김도윤', cohort: 'DA 4기' },
  currentScore: 52,
  ungradedCount: 1,
  changeLogCount: 1,
  prevSubmissionId: 'sub_1',
  nextSubmissionId: 'sub_3',
  items: [
    { ...sub1.items[0], score: null, resultStatus: undefined },
    { ...sub1.items[1], score: 12, feedback: '', feedbackVisible: false },
  ],
}

const sub3: AdminGradingDetail = {
  ...sub1,
  submissionId: 'sub_3',
  student: { name: '이하늘', cohort: 'DA 4기' },
  currentScore: 38,
  ungradedCount: 2,
  changeLogCount: 0,
  prevSubmissionId: 'sub_2',
  nextSubmissionId: null,
  items: [
    { ...sub1.items[0], score: null, resultStatus: undefined },
    { ...sub1.items[1], score: null, feedback: '', feedbackVisible: false },
  ],
}

const details: Record<string, AdminGradingDetail> = {
  sub_1: sub1,
  sub_2: sub2,
  sub_3: sub3,
}

const ok = (data: AdminGradingDetail) => ({
  data,
  isPending: false,
  isError: false,
  refetch: vi.fn(),
})

const mutate = vi.fn()

beforeEach(() => {
  mutate.mockClear()
  // submissionId별 분기 — 이전/다음 학생 내비에서 다른 학생 데이터가 나온다.
  vi.mocked(useAdminGradingDetail).mockImplementation(
    (_quizId, submissionId) =>
      ok(details[submissionId] ?? sub1) as unknown as DetailHook,
  )
  mutate.mockImplementation((_vars, opts) => opts?.onSuccess?.(sub1))
  vi.mocked(useSaveGrading).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as SaveHook)
})

function renderPage(submissionId = 'sub_1') {
  return render(
    <MemoryRouter
      initialEntries={[
        `/admin/quizzes/qz_sql_join/submissions/${submissionId}/grade`,
      ]}
    >
      <Routes>
        <Route
          path="/admin/quizzes/:quizId/submissions"
          element={<div>제출 현황 목록</div>}
        />
        <Route
          path="/admin/quizzes/:quizId/submissions/:submissionId/grade"
          element={<GradingPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminGradingPage', () => {
  it('KPI 5종·제출 요약·문항 카드·저장 정책을 렌더한다', () => {
    renderPage()
    expect(usePageHeaderStore.getState().title).toBe('수동 채점')
    // KPI 5종 — 라벨·값·캡션 스펙 원문
    expect(screen.getByText('현재 점수')).toBeInTheDocument()
    expect(screen.getByText('68')).toBeInTheDocument()
    expect(screen.getByText('임시 저장됨')).toBeInTheDocument()
    expect(screen.getByText('미채점 문항')).toBeInTheDocument()
    expect(screen.getByText('주관식 2개')).toBeInTheDocument()
    // KPI 라벨 1 + 문항 카드 토글 라벨 2
    expect(screen.getAllByText('피드백 공개')).toHaveLength(3)
    expect(screen.getByText('대기')).toBeInTheDocument()
    expect(screen.getByText('완료 후 공개')).toBeInTheDocument()
    expect(screen.getByText('변경 이력')).toBeInTheDocument()
    expect(screen.getByText('자동 저장 포함')).toBeInTheDocument()
    expect(screen.getByText('소요 시간')).toBeInTheDocument()
    expect(screen.getByText('12m')).toBeInTheDocument()
    expect(screen.getByText('평균 8m')).toBeInTheDocument()
    // 제출 요약 바
    expect(
      screen.getByText('박서연 · DA 4기 · SQL 조인 퀴즈'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        '제출 2026-05-19 09:34 · 제한 시간 40분 중 38분 사용 · 자동 채점 6/8 완료',
      ),
    ).toBeInTheDocument()
    // 문항 카드 — 헤더·문제·학생 답안·채점 기준·상태 pill(점수에서 파생)
    expect(screen.getByText('문항 5 · 단답형 · 12점')).toBeInTheDocument()
    expect(screen.getByText('문항 8 · 서술형 · 20점')).toBeInTheDocument()
    expect(
      screen.getByText(
        '문제: 집계 결과에서 부서별 평균 급여를 구하는 SQL 절을 작성하세요.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('SELECT dept, AVG(salary) FROM employees GROUP BY dept'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        '채점 기준: GROUP BY 포함, 집계 함수 정확성, alias 선택은 감점 없음',
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByText('부분 정답')).toHaveLength(2)
    expect(screen.getByLabelText('문항 5 점수')).toHaveValue('10')
    expect(screen.getByLabelText('문항 8 피드백')).toHaveValue(
      '예시는 적절하나 INNER JOIN 누락으로 4점 감점',
    )
    // 저장 정책 배너 — Figma 원문
    expect(screen.getByText('저장 정책')).toBeInTheDocument()
    expect(
      screen.getByText(
        '문항별 점수와 피드백은 임시 저장되며, 채점 완료 후 학생 결과 화면에 공개됩니다.',
      ),
    ).toBeInTheDocument()
  })

  it('점수 입력은 0~배점으로 클램프된다', async () => {
    const user = userEvent.setup()
    renderPage()
    const score = screen.getByLabelText('문항 5 점수')
    await user.clear(score)
    await user.type(score, '15') // 배점 12 초과 — 12로 클램프
    expect(score).toHaveValue('12')
    await user.clear(score)
    await user.type(score, '7')
    expect(score).toHaveValue('7')
  })

  it('미입력 수동 문항이 있으면 채점 완료가 비활성, 전부 입력하면 확정 후 제출 현황으로 복귀한다', async () => {
    const user = userEvent.setup()
    renderPage('sub_2') // 문항 5 점수 미입력
    const done = screen.getByRole('button', { name: '채점 완료' })
    expect(done).toBeDisabled()
    await user.type(screen.getByLabelText('문항 5 점수'), '8')
    expect(done).toBeEnabled()
    await user.click(done)
    // 확정+학생 공개는 비가역이라 ActionModal 확인을 거친다
    expect(screen.getByText('채점 완료 확인')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: '채점 완료' })[1])
    // finalize PATCH — 드래프트 일괄 플러시 + gradingStatus 확정
    const payload = mutate.mock.calls.at(-1)?.[0]
    expect(payload.finalize).toBe(true)
    expect(payload.items).toContainEqual({
      questionId: 'gq_5',
      earnedPoints: 8,
      feedback: '',
      feedbackVisible: false,
    })
    expect(screen.getByText('제출 현황 목록')).toBeInTheDocument()
  })

  it('이전/다음 학생으로 제출 건을 전환하고 끝단은 비활성이다', async () => {
    const user = userEvent.setup()
    renderPage('sub_1')
    expect(screen.getByRole('button', { name: '이전 학생' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '다음 학생' }))
    expect(
      screen.getByText('김도윤 · DA 4기 · SQL 조인 퀴즈'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '다음 학생' }))
    expect(
      screen.getByText('이하늘 · DA 4기 · SQL 조인 퀴즈'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음 학생' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '이전 학생' })).toBeEnabled()
  })

  it('점수·피드백 blur 시 변경분만 PATCH 자동 저장한다', async () => {
    const user = userEvent.setup()
    renderPage('sub_1')
    // 변경 없이 blur — 저장 안 함(서버 값과 동일)
    await user.click(screen.getByLabelText('문항 5 점수'))
    await user.tab()
    expect(mutate).not.toHaveBeenCalled()
    // 피드백 변경 후 blur — 해당 문항만 PATCH
    await user.type(screen.getByLabelText('문항 5 피드백'), 'alias 무관 인정')
    await user.tab()
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate.mock.calls[0][0]).toEqual({
      items: [
        {
          questionId: 'gq_5',
          earnedPoints: 10,
          feedback: 'alias 무관 인정',
          feedbackVisible: false,
        },
      ],
    })
  })

  it('로딩·에러 상태를 표시한다', () => {
    vi.mocked(useAdminGradingDetail).mockReturnValue({
      isPending: true,
    } as unknown as DetailHook)
    const { unmount } = renderPage()
    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument()
    unmount()
    vi.mocked(useAdminGradingDetail).mockReturnValue({
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    } as unknown as DetailHook)
    renderPage()
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })
})
