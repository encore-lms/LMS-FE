import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  it('팀 헤더·팀원·예약·평가 잠금·팀 최근 일지를 렌더한다', () => {
    mockHook({
      data: buildTeamDetailData('team_rec')!,
      isPending: false,
      isError: false,
    })
    renderPage()
    // 헤더 타이틀은 고정 '팀 상세' — 팀명은 본문 카드에만
    expect(usePageHeaderStore.getState().title).toBe('팀 상세')
    expect(screen.getByText('추천시스템 팀')).toBeInTheDocument()
    expect(screen.getByText('담당 멘토 임수현')).toBeInTheDocument()
    // 팀원 5명 + PM 태그
    expect(screen.getByText('김수강')).toBeInTheDocument()
    expect(screen.getByText('송하늘')).toBeInTheDocument()
    expect(screen.getByText('PM')).toBeInTheDocument()
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
    // 다음 확정 예약 + 일지 4건
    expect(screen.getByText('예상 90분 · 요청자 김수강')).toBeInTheDocument()
    expect(
      screen.getByText('추천 모델 v2 평가 지표 검토 + 다음 액션 정리'),
    ).toBeInTheDocument()
    expect(screen.getByText('새 일지 작성')).toBeInTheDocument()
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
