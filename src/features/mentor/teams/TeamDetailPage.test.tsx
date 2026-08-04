import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TeamDetailPage from './TeamDetailPage'
import { useMentorTeamDetail } from '../api/mentor'
import { buildTeamDetailData } from '../mockDb'
import { usePageHeaderStore } from '@/shared/store'

vi.mock('../api/mentor')

type Hook = ReturnType<typeof useMentorTeamDetail>

function mockHook(v: Partial<Hook>) {
  vi.mocked(useMentorTeamDetail).mockReturnValue(v as unknown as Hook)
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
    // 평가·추천 — 상시 작성 가능(2026-08-04 완화): 잠금 칩 없이 작성 화면 링크가 열린다.
    expect(screen.queryByText('N시간 완료 후 활성')).not.toBeInTheDocument()
    expect(
      screen.getByText('팀원 5명 평가 · 상시 작성·재제출 가능'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /평가 작성/ })).toHaveAttribute(
      'href',
      '/mentor/teams/team_rec/evaluation',
    )
    expect(screen.getByRole('link', { name: /추천 선택/ })).toHaveAttribute(
      'href',
      '/mentor/teams/team_rec/recommendation',
    )
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
})
