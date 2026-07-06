import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AnswersPage from './AnswersPage'
import {
  useAnswerImpact,
  useQuizAnswers,
  useSaveAnswerChanges,
} from '../api/quizzes'
import { usePageHeaderStore } from '@/shared/store'
import type { QuizAnswerImpact, QuizAnswersData } from '@/shared/types'

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

type AnswersHook = ReturnType<typeof useQuizAnswers>
type ImpactHook = ReturnType<typeof useAnswerImpact>
type SaveHook = ReturnType<typeof useSaveAnswerChanges>

// Figma 1515:10493 대표값 — 테이블 5행(1·3·5·8·10) 원문.
const answersData: QuizAnswersData = {
  quizTitle: 'SQL 조인 퀴즈',
  kpi: {
    totalQuestions: 10,
    multipleChoiceCount: 8,
    shortAnswerCount: 2,
    changeCandidates: 3,
    affectedSubmissions: 31,
    payoutCandidates: 12,
  },
  rows: [
    {
      questionId: 'qq_1',
      questionNo: 1,
      type: 'multiple_choice',
      summary: 'SELECT 기본 문법',
      currentAnswerKey: 'B',
      maxPoints: 10,
      proposedAnswerKey: null,
      affectedCount: 0,
      status: 'normal',
    },
    {
      questionId: 'qq_3',
      questionNo: 3,
      type: 'multiple_choice',
      summary: 'JOIN 결과 행 수 계산',
      currentAnswerKey: 'A',
      maxPoints: 10,
      proposedAnswerKey: 'C',
      affectedCount: 12,
      status: 'needs_check',
    },
    {
      questionId: 'qq_5',
      questionNo: 5,
      type: 'short_answer',
      summary: '내부 조인 키워드',
      currentAnswerKey: 'JOIN',
      maxPoints: 10,
      proposedAnswerKey: 'INNER JOIN',
      affectedCount: 7,
      status: 'review',
    },
    {
      questionId: 'qq_8',
      questionNo: 8,
      type: 'multiple_choice',
      summary: '서브쿼리 실행 순서',
      currentAnswerKey: 'D',
      maxPoints: 10,
      proposedAnswerKey: null,
      affectedCount: 31,
      status: 'deactivate_candidate',
    },
    {
      questionId: 'qq_10',
      questionNo: 10,
      type: 'short_answer',
      summary: '그룹화 키워드',
      currentAnswerKey: 'GROUP BY',
      maxPoints: 10,
      proposedAnswerKey: null,
      affectedCount: 0,
      status: 'normal',
    },
  ],
}

const impactData: QuizAnswerImpact = {
  affectedSubmissionCount: 19,
  scoreChangeSummary: '문항 3 정답 A → C 변경 시 12명 점수가 변동됩니다.',
  inProgressAttemptExcluded: 2,
  payoutCandidateCount: 12,
  affectedAreas: [
    '학생 결과 화면 점수/피드백',
    '퀴즈 제출 현황 평균 점수',
    '마일리지 지급 후보',
    '증명서 학습 평가 요약',
  ],
}

const mutate = vi.fn()

beforeEach(() => {
  mutate.mockClear()
  vi.mocked(useQuizAnswers).mockReturnValue({
    data: answersData,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as AnswersHook)
  // 영향 계산 — 페이지는 impactKey(버튼 클릭)가 생겨야 결과를 신선으로 취급한다.
  vi.mocked(useAnswerImpact).mockReturnValue({
    data: impactData,
    isFetching: false,
    isError: false,
  } as unknown as ImpactHook)
  mutate.mockImplementation((_vars, opts) =>
    opts?.onSuccess?.({
      savedCount: 2,
      reGradedSubmissionCount: 19,
      inProgressAttemptCount: 2,
    }),
  )
  vi.mocked(useSaveAnswerChanges).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as SaveHook)
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/quizzes/qz_sql_join/answers']}>
      <Routes>
        <Route path="/admin/quizzes" element={<div>퀴즈 운영 목록</div>} />
        <Route
          path="/admin/quizzes/:quizId/answers"
          element={<AnswersPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

/** 행 클릭 — 문항 번호 셀 텍스트로 tr을 찾는다(DataTable onRowClick). */
async function selectRow(user: ReturnType<typeof userEvent.setup>, no: number) {
  const cell = screen.getByText(String(no), { selector: 'td span' })
  await user.click(cell.closest('tr') as HTMLElement)
}

describe('AnswersPage', () => {
  it('KPI 5종·정답 테이블·재채점 영향 패널·운영 원칙을 렌더한다', () => {
    renderPage()
    expect(usePageHeaderStore.getState().title).toBe('정답 관리')
    // KPI 5종 — 라벨·값·캡션 스펙 원문
    expect(screen.getByText('대상 문제')).toBeInTheDocument()
    expect(screen.getByText('객관식 8 · 단답형 2')).toBeInTheDocument()
    expect(screen.getByText('변경 후보')).toBeInTheDocument()
    // KPI 변경 후보 값(로컬 변경 2 + 비활성 후보 1) + 테이블 문항 3 셀
    expect(screen.getAllByText('3')).toHaveLength(2)
    expect(screen.getByText('정답/배점 수정')).toBeInTheDocument()
    expect(screen.getByText('영향 제출')).toBeInTheDocument()
    expect(screen.getByText('31')).toBeInTheDocument()
    expect(screen.getByText('지급 후보')).toBeInTheDocument()
    expect(screen.getByText('필수')).toBeInTheDocument()
    expect(screen.getByText('저장 시 자동 기록')).toBeInTheDocument()
    // 테이블 — 행 상태 4분기와 변경안 셀
    expect(screen.getByText('현재 정답')).toBeInTheDocument()
    expect(screen.getByText('INNER JOIN')).toBeInTheDocument()
    expect(screen.getByText('삭제')).toBeInTheDocument()
    expect(screen.getAllByText('정상')).toHaveLength(2)
    expect(screen.getByText('확인 필요')).toBeInTheDocument()
    expect(screen.getByText('검토')).toBeInTheDocument()
    expect(screen.getByText('비활성 후보')).toBeInTheDocument()
    expect(screen.getByText('12명')).toBeInTheDocument()
    expect(screen.getAllByText('없음')).toHaveLength(2)
    // 우측 패널 + 운영 원칙 배너
    expect(screen.getByText('재채점 영향')).toBeInTheDocument()
    expect(screen.getByText('영향 범위')).toBeInTheDocument()
    expect(screen.getByText('- 학생 결과 화면 점수/피드백')).toBeInTheDocument()
    expect(screen.getByText('운영 원칙')).toBeInTheDocument()
  })

  it('변경 저장은 영향 계산 전·사유 미입력 시 비활성이다', async () => {
    const user = userEvent.setup()
    renderPage()
    const saveAll = screen.getByRole('button', { name: '변경 저장' })
    expect(saveAll).toBeDisabled()
    // 영향 계산만 실행해도 사유가 비어 있으면 여전히 저장 불가(P0-ADM-QUIZ-006)
    await user.click(screen.getByRole('button', { name: '저장 전 영향 계산' }))
    expect(
      screen.getByText('문항 3 정답 A → C 변경 시 12명 점수가 변동됩니다.'),
    ).toBeInTheDocument()
    expect(saveAll).toBeDisabled()
  })

  it('행 선택 패널에서 사유 없이 저장(로컬 반영)이 비활성이다', async () => {
    const user = userEvent.setup()
    renderPage()
    await selectRow(user, 3)
    expect(screen.getByLabelText('변경안')).toHaveValue('C')
    const panelSave = screen.getByRole('button', { name: '저장' })
    expect(panelSave).toBeDisabled()
    await user.type(screen.getByLabelText('변경 사유'), '정답 키 오류 정정')
    expect(panelSave).toBeEnabled()
  })

  it('사유 입력 + 영향 계산 후 변경 저장이 활성되고 mutation을 호출한다', async () => {
    const user = userEvent.setup()
    renderPage()
    // 변경 후보 2건(문항 3·5)에 사유를 채워 일괄 목록에 반영
    await selectRow(user, 3)
    await user.type(screen.getByLabelText('변경 사유'), '정답 키 오류 정정')
    await user.click(screen.getByRole('button', { name: '저장' }))
    await selectRow(user, 5)
    await user.type(screen.getByLabelText('변경 사유'), '인정답 추가')
    await user.click(screen.getByRole('button', { name: '저장' }))
    // 영향 계산 실행 → 변경 저장 활성
    await user.click(screen.getByRole('button', { name: '저장 전 영향 계산' }))
    const saveAll = screen.getByRole('button', { name: '변경 저장' })
    expect(saveAll).toBeEnabled()
    await user.click(saveAll)
    expect(mutate).toHaveBeenCalledTimes(1)
    const payload = mutate.mock.calls[0][0]
    expect(payload.changes).toHaveLength(2)
    expect(payload.changes).toContainEqual({
      questionId: 'qq_3',
      afterAnswerKey: 'C',
      maxPoints: 10,
      reason: '정답 키 오류 정정',
    })
    expect(payload.changes).toContainEqual({
      questionId: 'qq_5',
      afterAnswerKey: 'INNER JOIN',
      maxPoints: 10,
      reason: '인정답 추가',
    })
  })

  it('비활성(삭제) 후보 행은 편집 대신 BE 계약 대기 안내를 표시한다', async () => {
    const user = userEvent.setup()
    renderPage()
    await selectRow(user, 8)
    expect(
      screen.getByText(/비활성\(삭제\) 후보는 BE 비활성 계약 확정 후 지원/),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('변경안')).not.toBeInTheDocument()
  })

  it('로딩·에러 상태를 표시한다', () => {
    vi.mocked(useQuizAnswers).mockReturnValue({
      isPending: true,
    } as unknown as AnswersHook)
    const { unmount } = renderPage()
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    unmount()
    vi.mocked(useQuizAnswers).mockReturnValue({
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    } as unknown as AnswersHook)
    renderPage()
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })
})
