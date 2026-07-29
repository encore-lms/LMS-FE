import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import EvaluationPage from './EvaluationPage'
import EvaluationsSubmittedPage from './EvaluationsSubmittedPage'
import {
  useEvaluationSubmissions,
  useSaveEvaluationDraft,
  useSubmitEvaluation,
  useTeamEvaluation,
} from '../api/evaluations'
import { buildEvaluationsData, buildTeamEvaluationSheet } from '../mockDb'
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

function renderPage(teamId: string) {
  return render(
    <MemoryRouter initialEntries={[`/mentor/teams/${teamId}/evaluation`]}>
      <ToastProvider>
        <Routes>
          <Route
            path="/mentor/teams/:teamId/evaluation"
            element={<EvaluationPage />}
          />
          <Route
            path="/mentor/evaluations"
            element={<div>평가 제출 완료 페이지</div>}
          />
        </Routes>
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

    // 최종 제출 확인 모달 — 제출 후 수정 불가 + 운영자 조회 전용 안내
    expect(screen.getByText('평가를 최종 제출할까요?')).toBeInTheDocument()
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
    // 제출 성공 → 완료 페이지(?toast=submitted)로 이동
    expect(await screen.findByText('평가 제출 완료 페이지')).toBeInTheDocument()
  })

  it('잠금 — N시간 미완료 팀은 작성 폼 대신 잠금 사유를 표시한다', () => {
    mockSheet(buildTeamEvaluationSheet('team_rec'))
    renderPage('team_rec')
    expect(screen.getByText('아직 평가를 시작할 수 없어요')).toBeInTheDocument()
    expect(
      screen.getByText(/N시간 완료 후 활성 — 인정 8h \/ 배정 12h/),
    ).toBeInTheDocument()
    expect(screen.queryByText('평가 기준 · 5축 고정')).not.toBeInTheDocument()
  })

  it('제출 후 수정 불가 — 재진입 시 안내와 추천 단계 링크만 노출한다', () => {
    mockSheet(buildTeamEvaluationSheet('team_nlp'))
    renderPage('team_nlp')
    expect(screen.getByText('평가가 이미 제출되었습니다')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: '추천 선택 단계로 이동' }),
    ).toHaveAttribute('href', '/mentor/teams/team_nlp/recommendation')
    expect(screen.queryByRole('button', { name: /평가 제출/ })).toBeNull()
  })
})

describe('EvaluationsSubmittedPage', () => {
  it('?toast=submitted — 공통 토스트 1회 + 성공 hero·제출 요약·다음 단계를 렌더한다', async () => {
    vi.mocked(useEvaluationSubmissions).mockReturnValue({
      data: buildEvaluationsData(),
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useEvaluationSubmissions>)
    render(
      <MemoryRouter
        initialEntries={['/mentor/evaluations?teamId=team_nlp&toast=submitted']}
      >
        <ToastProvider>
          <Routes>
            <Route
              path="/mentor/evaluations"
              element={<EvaluationsSubmittedPage />}
            />
          </Routes>
        </ToastProvider>
      </MemoryRouter>,
    )

    // 공통 토스트 — Figma 토스트 z-order 버그는 최상위 고정 레이어로 정정
    expect(
      await screen.findByText(
        '평가가 제출되었습니다. 팀원별 평가 이력에 반영됩니다.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('평가가 제출되었습니다')).toBeInTheDocument()
    expect(screen.getByText('제출 시각 2026-05-15 20:40')).toBeInTheDocument()
    expect(screen.getByText('DA 4기 · NLP 분석 팀')).toBeInTheDocument()
    expect(screen.getByText('팀원 5명 전체')).toBeInTheDocument()
    expect(
      screen.getByText(
        '기술 4 · 책임감 4.2 · 소통 4.4 · 성장 4.4 · 팀워크 4.4',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('5명 모두 작성')).toBeInTheDocument()
    expect(screen.getByText('수정 가능 여부')).toBeInTheDocument()
    expect(screen.getByText('최종 제출 완료 — 수정 불가')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '평가 목록' })).toHaveAttribute(
      'href',
      '/mentor/teams',
    )
    expect(
      screen.getByRole('link', { name: /추천 선택 단계로 이동/ }),
    ).toHaveAttribute('href', '/mentor/teams/team_nlp/recommendation')
  })
})
