import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RecommendationPage from './RecommendationPage'
import RecommendationsSubmittedPage from './RecommendationsSubmittedPage'
import {
  useRecommendationSubmissions,
  useSaveRecommendationDraft,
  useSubmitRecommendation,
  useTeamRecommendation,
} from '../api/evaluations'
import {
  buildRecommendationsData,
  buildTeamRecommendationSheet,
} from '../mockDb'
import type { MentorRecommendationSheetData } from '../types'
import { ToastProvider } from '@/components/ui/Toast'

vi.mock('../api/evaluations')

type SheetHook = ReturnType<typeof useTeamRecommendation>

const draftMutate = vi.fn()
const submitAsync = vi.fn()

/** NLP 팀(평가 제출 완료) 시트를 미제출 상태로 변환 — 작성 폼 시나리오 공용. */
function editableSheet(): MentorRecommendationSheetData {
  return {
    ...buildTeamRecommendationSheet('team_nlp')!,
    status: 'not_started',
    draft: { mode: null, studentId: null, summary: '', notify: true },
    submittedAtLabel: null,
  }
}

function mockSheet(sheet: MentorRecommendationSheetData | null) {
  vi.mocked(useTeamRecommendation).mockReturnValue({
    data: sheet,
    isPending: false,
    isError: false,
  } as unknown as SheetHook)
}

function renderPage(teamId: string) {
  return render(
    <MemoryRouter initialEntries={[`/mentor/teams/${teamId}/recommendation`]}>
      <ToastProvider>
        <Routes>
          <Route
            path="/mentor/teams/:teamId/recommendation"
            element={<RecommendationPage />}
          />
          <Route
            path="/mentor/recommendations"
            element={<div>추천 제출 완료 페이지</div>}
          />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useSaveRecommendationDraft).mockReturnValue({
    mutate: draftMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useSaveRecommendationDraft>)
  vi.mocked(useSubmitRecommendation).mockReturnValue({
    mutateAsync: submitAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useSubmitRecommendation>)
})

describe('RecommendationPage', () => {
  it('정책·모드 카드·후보 5장을 렌더하고, 팀원은 단일 선택만 허용한다(선택 1/1)', async () => {
    mockSheet(editableSheet())
    const user = userEvent.setup()
    renderPage('team_nlp')

    expect(screen.getByText('추천 정책')).toBeInTheDocument()
    expect(screen.getByText('팀당 1명 또는 추천 안 함')).toBeInTheDocument()
    expect(screen.getByText('추천 모드 선택')).toBeInTheDocument()
    expect(screen.getByText('선택 0 / 1')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /팀원 1명 추천/ }))
    expect(screen.getByText('선택됨')).toBeInTheDocument()

    // 단일 선택 — 한예린 → 김도윤 선택 시 한예린은 해제(팀당 1명)
    await user.click(screen.getByRole('radio', { name: '한예린 추천' }))
    expect(screen.getByText('선택 1 / 1')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: '김도윤 추천' }))
    expect(screen.getByRole('radio', { name: '김도윤 추천' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '한예린 추천' })).not.toBeChecked()
    expect(screen.getByText('선택 1 / 1')).toBeInTheDocument()
    expect(screen.getByText('추천 대상')).toBeInTheDocument()
    expect(screen.getByText('김도윤 님 증명서용 간략 요약')).toBeInTheDocument()
  })

  it('요약 필수 — 추천 모드는 요약 입력 후에만 제출, 확인 모달 → 최종 제출 payload', async () => {
    mockSheet(editableSheet())
    submitAsync.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage('team_nlp')

    await user.click(screen.getByRole('radio', { name: /팀원 1명 추천/ }))
    await user.click(screen.getByRole('radio', { name: '한예린 추천' }))
    // 요약 미입력 — 제출 차단 + 액션바 필수 안내
    expect(screen.getByRole('button', { name: /추천 제출/ })).toBeDisabled()
    expect(
      screen.getByText('한예린 님 추천 · 증명서용 간략 요약 필수'),
    ).toBeInTheDocument()

    await user.type(
      screen.getByLabelText('증명서용 간략 요약'),
      '분석 파이프라인 전 구간을 주도한 핵심 기여자입니다.',
    )
    const submitButton = screen.getByRole('button', { name: /추천 제출/ })
    expect(submitButton).toBeEnabled()
    await user.click(submitButton)

    expect(screen.getByText('추천 선택을 제출할까요?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '최종 제출' }))
    expect(submitAsync).toHaveBeenCalledWith({
      teamId: 'team_nlp',
      payload: {
        mode: 'recommend',
        studentId: 'stu_han_y',
        summary: '분석 파이프라인 전 구간을 주도한 핵심 기여자입니다.',
        notify: true,
      },
    })
    expect(await screen.findByText('추천 제출 완료 페이지')).toBeInTheDocument()
  })

  it("'추천하지 않음' — 팀원 그리드 비활성 + 사유 없이 제출(payload mode none)", async () => {
    mockSheet(editableSheet())
    submitAsync.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage('team_nlp')

    await user.click(screen.getByRole('radio', { name: /추천하지 않음/ }))
    expect(
      screen.getByText('추천하지 않음 · 사유 입력 없이 제출'),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '한예린 추천' })).toBeDisabled()
    expect(screen.queryByLabelText('증명서용 간략 요약')).toBeNull()

    await user.click(screen.getByRole('button', { name: /추천 제출/ }))
    await user.click(screen.getByRole('button', { name: '최종 제출' }))
    expect(submitAsync).toHaveBeenCalledWith({
      teamId: 'team_nlp',
      payload: { mode: 'none', studentId: null, summary: '', notify: true },
    })
  })

  // 정책 완화(2026-08-04) — 평가 선행 게이트 폐기, 평가 미작성이어도 폼이 열린다.
  it('상시 추천 — 평가 미제출 팀도 폼이 열리고 후보 점수는 미작성으로 표시한다', () => {
    // 데이터마트 팀 — 본 테스트 파일 모듈 상태에선 평가 미제출(점수 없음)
    mockSheet(buildTeamRecommendationSheet('team_dm'))
    renderPage('team_dm')
    expect(screen.getByText('추천 모드 선택')).toBeInTheDocument()
    expect(screen.getAllByText('평가 미작성').length).toBeGreaterThan(0)
    expect(
      screen.queryByText('평가 제출 후 추천을 선택할 수 있어요'),
    ).not.toBeInTheDocument()
  })

  // 계약 종료 마감 — 선택값은 보이되 입력·제출 전부 잠금.
  it('계약 종료 마감 — 읽기 전용 폼 + 제출 마감 CTA·칩을 보여준다', () => {
    const base = buildTeamRecommendationSheet('team_nlp')!
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
    expect(screen.getByRole('radio', { name: /팀원 1명 추천/ })).toBeDisabled()
    expect(screen.getByRole('radio', { name: '한예린 추천' })).toBeDisabled()
  })

  // 정책 완화(2026-08-04) — 제출본은 값이 채워진 폼으로 열려 자세히 보기 · 재제출을 겸한다.
  it('제출본 재진입 — 선택값 채워진 폼 + 수정 재제출 CTA를 노출한다', () => {
    mockSheet(buildTeamRecommendationSheet('team_nlp'))
    renderPage('team_nlp')
    expect(screen.getByText(/제출됨 · /)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /수정 재제출/ }),
    ).toBeInTheDocument()
    // 제출본의 추천 대상(한예린)이 라디오에 선택된 채 열린다.
    expect(screen.getByRole('radio', { name: '한예린 추천' })).toBeChecked()
  })
})

describe('RecommendationsSubmittedPage', () => {
  it('?toast=submitted — 공통 토스트 + 추천 대상·증명서 반영 요약을 렌더한다', async () => {
    vi.mocked(useRecommendationSubmissions).mockReturnValue({
      data: buildRecommendationsData(),
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useRecommendationSubmissions>)
    render(
      <MemoryRouter
        initialEntries={[
          '/mentor/recommendations?teamId=team_nlp&toast=submitted',
        ]}
      >
        <ToastProvider>
          <Routes>
            <Route
              path="/mentor/recommendations"
              element={<RecommendationsSubmittedPage />}
            />
          </Routes>
        </ToastProvider>
      </MemoryRouter>,
    )

    expect(
      await screen.findByText(
        '추천 선택이 제출되었습니다. 팀당 1명 추천 정책으로 저장됩니다.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('추천 선택이 제출되었습니다')).toBeInTheDocument()
    expect(screen.getByText('한예린 (PM)')).toBeInTheDocument()
    expect(screen.getByText(/자 · 필수 충족/)).toBeInTheDocument()
    expect(
      screen.getByText('증명서 전체 공개 + 인증 완료 + 최신화 스냅샷 기준'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: '추천 자세히 보기 · 수정' }),
    ).toHaveAttribute('href', '/mentor/teams/team_nlp/recommendation')
    expect(screen.getByRole('link', { name: /멘토 대시보드/ })).toHaveAttribute(
      'href',
      '/mentor',
    )
  })
})
