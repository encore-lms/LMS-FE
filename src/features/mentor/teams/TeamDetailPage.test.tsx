import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TeamDetailPage from './TeamDetailPage'
import { useMentorTeamDetail } from '../api/mentor'
import { useTeamEvaluation, useTeamRecommendation } from '../api/evaluations'
import { buildTeamDetailData } from '../mockDb'
import { usePageHeaderStore } from '@/shared/store'
import { reachable } from '../routeReach'

vi.mock('../api/mentor')
// 평가·추천 탭은 작성 화면을 그대로 얹는다 — 여기서는 '어느 단계가 열리는지'만 본다.
vi.mock('../api/evaluations')
vi.mock('../evaluation/EvaluationPage', () => ({
  default: () => <div>평가 작성 폼</div>,
}))
vi.mock('../recommendation/RecommendationPage', () => ({
  default: () => <div>추천 선택 폼</div>,
}))

type Hook = ReturnType<typeof useMentorTeamDetail>

function mockHook(v: Partial<Hook>) {
  vi.mocked(useMentorTeamDetail).mockReturnValue(v as unknown as Hook)
}

// 평가·추천 단계 — 제출 여부만 세워 준다.
function mockStages(evalStatus: string, recStatus: string) {
  vi.mocked(useTeamEvaluation).mockReturnValue({
    data: { status: evalStatus },
    isPending: false,
  } as unknown as ReturnType<typeof useTeamEvaluation>)
  vi.mocked(useTeamRecommendation).mockReturnValue({
    data: { status: recStatus },
    isPending: false,
  } as unknown as ReturnType<typeof useTeamRecommendation>)
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/mentor/teams/team_rec']}>
      <Routes>
        <Route path="/mentor/teams/:teamId" element={<TeamDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TeamDetailPage', () => {
  it('홈 탭에 히어로·예약 요약·평가·추천을 렌더한다', () => {
    mockHook({
      data: buildTeamDetailData('team_rec')!,
      isPending: false,
      isError: false,
    })
    renderPage()
    // 헤더는 지금 보고 있는 팀 — 운영 과정 상세와 같은 방식(제목=대상 이름)
    expect(usePageHeaderStore.getState().title).toBe('추천시스템 팀')
    expect(screen.getByText(/추천시스템 팀 · /)).toBeInTheDocument()
    expect(screen.getByText('담당 멘토 임수현')).toBeInTheDocument()
    // 평가·추천 — 상시 작성 가능(2026-08-04 완화): 잠금 칩 없이 열린다.
    // 단독 작성 화면은 걷어냈고(2026-08-04) 탭 안에서 순서대로 하므로, 링크가 아니라 버튼이다.
    expect(screen.queryByText('N시간 완료 후 활성')).not.toBeInTheDocument()
    expect(
      screen.getByText('팀원 5명 평가 · 상시 작성·재제출 가능'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /평가 작성/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /추천 선택/ }),
    ).toBeInTheDocument()
    // 다음 확정 예약 + 일지 건수(목록은 일지 탭에)
    expect(screen.getByText('예상 90분 · 요청자 김수강')).toBeInTheDocument()
    expect(screen.getByText(/팀 일지 \d+건/)).toBeInTheDocument()
    expect(screen.getByText('새 일지 작성')).toBeInTheDocument()
  })

  it('팀원은 팀원 탭에서 본다', async () => {
    mockHook({
      data: buildTeamDetailData('team_rec')!,
      isPending: false,
      isError: false,
    })
    const user = userEvent.setup()
    renderPage()
    // 홈에는 팀원 명단이 없다 — 화면을 두 번 읽지 않게 탭으로 나눴다.
    expect(screen.queryByText('김수강')).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: '팀원' }))
    expect(screen.getByText('김수강')).toBeInTheDocument()
    expect(screen.getByText('송하늘')).toBeInTheDocument()
    expect(screen.getByText('PM')).toBeInTheDocument()
  })

  it('예약·일지·평가·추천 탭이 팀 안에 있다', () => {
    mockHook({
      data: buildTeamDetailData('team_rec')!,
      isPending: false,
      isError: false,
    })
    renderPage()
    for (const label of ['홈', '팀원', '예약', '일지', '평가·추천'])
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument()
  })

  it('비용·정산·매출 표현이 없다', () => {
    mockHook({
      data: buildTeamDetailData('team_rec')!,
      isPending: false,
      isError: false,
    })
    const { container } = renderPage()
    expect(container.textContent ?? '').not.toMatch(/비용|정산|매출/)
  })

  it('로딩·에러(미배정 팀) 상태를 표시한다', () => {
    mockHook({ isPending: true })
    const { unmount } = renderPage()
    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument()
    unmount()
    mockHook({ isPending: false, isError: true, refetch: vi.fn() })
    renderPage()
    expect(
      screen.getByText('본인에게 배정된 팀만 열람할 수 있어요.'),
    ).toBeInTheDocument()
  })

  it('평가·추천 탭은 아직 안 낸 평가 작성부터 연다', async () => {
    mockHook({
      data: buildTeamDetailData('team_rec')!,
      isPending: false,
      isError: false,
    })
    mockStages('draft', 'not_started')
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: '평가·추천' }))
    expect(screen.getByText('평가 작성 폼')).toBeInTheDocument()
  })

  it('평가를 이미 냈으면 추천 선택으로 바로 넘어간다', async () => {
    mockHook({
      data: buildTeamDetailData('team_rec')!,
      isPending: false,
      isError: false,
    })
    mockStages('submitted', 'not_started')
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: '평가·추천' }))
    expect(screen.getByText('추천 선택 폼')).toBeInTheDocument()
    expect(screen.queryByText('평가 작성 폼')).not.toBeInTheDocument()
  })

  it('둘 다 냈으면 모두 마쳤다고 알린다', async () => {
    mockHook({
      data: buildTeamDetailData('team_rec')!,
      isPending: false,
      isError: false,
    })
    mockStages('submitted', 'submitted_recommended')
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: '평가·추천' }))
    expect(screen.getByText('평가와 추천을 모두 마쳤어요')).toBeInTheDocument()
    // 고치고 싶으면 그 자리에서 다시 연다 — 다른 화면으로 내보내지 않는다.
    await user.click(screen.getByRole('button', { name: '평가 수정' }))
    expect(screen.getByText('평가 작성 폼')).toBeInTheDocument()
  })

  it('그리는 모든 링크가 살아 있는 라우트를 가리킨다', async () => {
    // 화면을 걷어낼 때 링크를 함께 훑지 않으면 '찾을 수 없는 주소'로 떨어진다.
    // 홈 탭의 평가·추천 카드가 걷어낸 단독 화면을 가리키고 있었다(2026-08-05 배포 검증).
    mockHook({
      data: buildTeamDetailData('team_rec')!,
      isPending: false,
      isError: false,
    })
    mockStages('draft', 'not_started')
    const user = userEvent.setup()
    const { container } = renderPage()
    for (const tab of ['홈', '팀원', '평가·추천']) {
      await user.click(screen.getByRole('tab', { name: tab }))
      const dead = [...container.querySelectorAll('a')]
        .map((a) => a.getAttribute('href') ?? '')
        .filter((href) => href.startsWith('/mentor'))
        .filter((href) => !reachable(href))
      expect(dead, `${tab} 탭`).toEqual([])
    }
  })

  it('홈 카드의 평가 작성을 누르면 평가·추천 탭으로 간다', async () => {
    mockHook({
      data: buildTeamDetailData('team_rec')!,
      isPending: false,
      isError: false,
    })
    mockStages('draft', 'not_started')
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /평가 작성/ }))
    expect(screen.getByText('평가 작성 폼')).toBeInTheDocument()
  })

  it('팀원 탭에 참석 현황을 함께 보여 준다', async () => {
    const base = buildTeamDetailData('team_rec')!
    mockHook({
      data: {
        ...base,
        members: [
          {
            ...base.members[0],
            attendedCount: 6,
            sessionCount: 6,
            lastAttendedLabel: '7/22',
          },
          {
            ...base.members[1],
            attendedCount: 3,
            sessionCount: 6,
            lastAttendedLabel: '7/08',
          },
        ],
      },
      isPending: false,
      isError: false,
    })
    mockStages('draft', 'not_started')
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: '팀원' }))
    expect(screen.getByText('총 6회 진행')).toBeInTheDocument()
    expect(screen.getByText('최근 7/22')).toBeInTheDocument()
    // 참석률 막대 — 100% · 50%
    const bars = screen.getAllByRole('progressbar')
    expect(bars[0]).toHaveAttribute('aria-valuenow', '100')
    expect(bars[1]).toHaveAttribute('aria-valuenow', '50')
  })

  it('아직 진행한 회차가 없으면 참석률을 그리지 않는다', async () => {
    // 0으로 나누면 NaN%가 된다 — 셀 것이 없을 때는 아예 그리지 않는다.
    const base = buildTeamDetailData('team_rec')!
    mockHook({
      data: {
        ...base,
        members: [
          {
            ...base.members[0],
            attendedCount: 0,
            sessionCount: 0,
            lastAttendedLabel: null,
          },
        ],
      },
      isPending: false,
      isError: false,
    })
    mockStages('draft', 'not_started')
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: '팀원' }))
    expect(screen.getByText('진행한 회차 없음')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})
