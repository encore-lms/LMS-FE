import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import EvaluationPage from './EvaluationPage'
import {
  useSaveEvaluationDraft,
  useSubmitEvaluation,
  useTeamEvaluation,
} from '../api/evaluations'
import { buildTeamEvaluationSheet } from '../mockDb'
import type { EvaluationScoreTuple, MentorEvaluationSheetData } from '../types'
import { ToastProvider } from '@/components/ui/Toast'

vi.mock('../api/evaluations')

type SheetHook = ReturnType<typeof useTeamEvaluation>

const draftMutate = vi.fn()
const submitAsync = vi.fn()

function mockSheet(sheet: MentorEvaluationSheetData | null) {
  vi.mocked(useTeamEvaluation).mockReturnValue({
    data: sheet,
    isPending: false,
    isError: false,
  } as unknown as SheetHook)
}

const onSubmitted = vi.fn()

function renderPage(teamId: string) {
  onSubmitted.mockClear()
  return render(
    <MemoryRouter>
      <ToastProvider>
        <EvaluationPage teamId={teamId} onSubmitted={onSubmitted} />
      </ToastProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useSaveEvaluationDraft).mockReturnValue({
    mutate: draftMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useSaveEvaluationDraft>)
  vi.mocked(useSubmitEvaluation).mockReturnValue({
    mutateAsync: submitAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useSubmitEvaluation>)
})

describe('EvaluationPage', () => {
  it('평가 가능 팀 — 진행률·5축 기준·카드 상태를 렌더하고 미완료면 제출 비활성', () => {
    // 데이터마트 팀 — 초안 시드(완료 2 · 작성 중 1 · 대기 1)
    mockSheet(buildTeamEvaluationSheet('team_dm'))
    renderPage('team_dm')

    expect(screen.getByText('진행률')).toBeInTheDocument()
    expect(screen.getByText('2 / 4명')).toBeInTheDocument()
    expect(screen.getByText('N시간 완료 · 평가 가능')).toBeInTheDocument()
    expect(screen.getByText('평가 기준 · 5축 고정')).toBeInTheDocument()
    expect(
      screen.getByText('고정 5축 · 0~5점 필수 · 줄글 평가 필수'),
    ).toBeInTheDocument()
    // 고정 5축 — 기준 칩 + 카드 축 라벨 양쪽 노출
    for (const axis of ['기술', '책임감', '소통', '성장', '팀워크']) {
      expect(screen.getAllByText(axis).length).toBeGreaterThan(1)
    }
    // 카드 상태 — 완료 2 · 작성 중 1(첫 미완료) · 대기 1
    expect(screen.getAllByText('완료')).toHaveLength(2)
    expect(screen.getByText('작성 중')).toBeInTheDocument()
    expect(screen.getByText('대기')).toBeInTheDocument()
    expect(screen.getByText('대기 중 — 위에서 순차 작성')).toBeInTheDocument()
    // 전원 입력 전 — 제출 차단(부족 인원 카피)
    expect(
      screen.getByRole('button', { name: /제출 불가 \(2명 평가 필요\)/ }),
    ).toBeDisabled()
  })

  it('줄글 필수 게이트 — 점수만으로는 제출 불가, 전원 코멘트 입력 시 확인 모달 → 최종 제출', async () => {
    // 전원 5축 점수 입력 + 마지막 1명만 줄글 미입력 상태
    const base = buildTeamEvaluationSheet('team_dm')!
    mockSheet({
      ...base,
      members: base.members.map((m, i) => ({
        ...m,
        scores: [5, 4, 5, 4, 5] as EvaluationScoreTuple,
        comment: i < base.members.length - 1 ? '안정적인 협업 태도입니다.' : '',
      })),
    })
    submitAsync.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage('team_dm')

    // 점수가 모두 있어도 줄글 미입력 1명이면 제출 차단
    expect(
      screen.getByRole('button', { name: /제출 불가 \(1명 평가 필요\)/ }),
    ).toBeDisabled()

    const lastComment = screen.getAllByLabelText('줄글 평가 코멘트')[3]
    await user.type(lastComment, '마감 직전 데이터 검증을 책임졌습니다.')

    const submitButton = screen.getByRole('button', { name: /평가 제출/ })
    expect(submitButton).toBeEnabled()
    await user.click(submitButton)

    // 제출 확인 모달 — 상시 재제출 안내 + 운영자 조회 전용 안내
    expect(screen.getByText('평가를 제출할까요?')).toBeInTheDocument()
    expect(
      screen.getByText(
        '운영자는 통계 및 평가 결과만 조회할 수 있으며, 제출된 평가·추천을 수정하거나 반려하지 않습니다.',
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '최종 제출' }))
    expect(submitAsync).toHaveBeenCalledWith({
      teamId: 'team_dm',
      payload: expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({
            studentId: 'stu_jung',
            comment: '마감 직전 데이터 검증을 책임졌습니다.',
          }),
        ]),
      }),
    })
    // 제출 후 화면을 옮기지 않는다 — 팀 상세 탭 안에서 다음 단계로 이어진다(2026-08-05).
    expect(onSubmitted).toHaveBeenCalled()
  })

  // 정책 완화(2026-08-04) — N시간 미완료여도 상시 작성 폼이 열린다.
  it('상시 작성 — N시간 미완료 팀도 작성 폼과 상시 라벨을 보여준다', () => {
    mockSheet(buildTeamEvaluationSheet('team_rec'))
    renderPage('team_rec')
    expect(screen.getByText('상시 평가 가능')).toBeInTheDocument()
    expect(screen.getByText('평가 기준 · 5축 고정')).toBeInTheDocument()
    expect(
      screen.queryByText('아직 평가를 시작할 수 없어요'),
    ).not.toBeInTheDocument()
  })

  // 계약 종료 마감 — 값은 보이되(자세히 보기) 입력·제출 전부 잠금.
  it('계약 종료 마감 — 읽기 전용 폼 + 제출 마감 CTA·칩을 보여준다', () => {
    const base = buildTeamEvaluationSheet('team_nlp')!
    mockSheet({
      ...base,
      submissionClosed: true,
      submissionDeadlineLabel: '2026-08-01 까지',
    })
    renderPage('team_nlp')
    expect(
      screen.getByText('제출 마감 — 계약 종료 (2026-08-01 까지)'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /제출 마감 — 계약 종료/ }),
    ).toBeDisabled()
    expect(screen.queryByRole('button', { name: '임시 저장' })).toBeNull()
    // 점수 버튼 잠금 — 자세히 보기 전용
    expect(screen.getAllByRole('radio', { name: '5점' })[0]).toBeDisabled()
  })

  // 정책 완화(2026-08-04) — 제출본은 값이 채워진 폼으로 열려 자세히 보기 · 재제출을 겸한다.
  it('제출본 재진입 — 값 채워진 폼 + 수정 재제출 CTA, 임시 저장은 숨긴다', () => {
    mockSheet(buildTeamEvaluationSheet('team_nlp'))
    renderPage('team_nlp')
    expect(screen.getByText(/제출됨 · /)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /수정 재제출/ })).toBeEnabled()
    expect(screen.queryByRole('button', { name: '임시 저장' })).toBeNull()
    expect(screen.getByText('평가 기준 · 5축 고정')).toBeInTheDocument()
  })
})
