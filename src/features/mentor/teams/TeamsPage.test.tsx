import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TeamsPage from './TeamsPage'
import { useMentorTeams } from '../api/mentor'
import { buildTeamsData } from '../mockDb'
import { usePageHeaderStore } from '@/shared/store'
import { reachable } from '../routeReach'

vi.mock('../api/mentor')

type Hook = ReturnType<typeof useMentorTeams>

function mockHook(v: Partial<Hook>) {
  vi.mocked(useMentorTeams).mockReturnValue(v as unknown as Hook)
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/mentor/teams']}>
      <TeamsPage />
    </MemoryRouter>,
  )
}

describe('TeamsPage', () => {
  it('요약 카드와 배정 팀 목록을 렌더한다', () => {
    mockHook({ data: buildTeamsData(), isPending: false, isError: false })
    renderPage()
    expect(usePageHeaderStore.getState().title).toBe('내 배정 팀')
    // KPI 4종 — Figma 대표값(진행 중 2 · 예약 대기 1 · 평가 필요 1 · 수정 요청 1)
    expect(screen.getByText('배정 시간 미완료 · 진행 중')).toBeInTheDocument()
    expect(screen.getByText('요청 확인 필요')).toBeInTheDocument()
    expect(screen.getByText('배정 시간 완료 또는 조기 종료')).toBeInTheDocument()
    expect(screen.getByText('운영자 보강 요청')).toBeInTheDocument()
    // 목록은 한 벌 — 완료 팀(NLP 분석)까지 4팀 전부가 표에만 나온다.
    expect(
      screen.getByText('배정 4팀 (진행 중 2 · 평가 필요 1 · 완료 1)'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('NLP 분석 팀')).toHaveLength(1)
    // 보조 태그 — 상태가 아닌 부가 라벨. 변수 이름 'N'이 아니라 실제 배정 시간을 적는다(2026-08-06 QA).
    expect(screen.getByText(/✓ \d+시간 완료/)).toBeInTheDocument()
    expect(screen.queryByText(/N시간/)).toBeNull()
    expect(screen.getByText('초과 멘토링 1.5h')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /CSV 내보내기/ }),
    ).toBeInTheDocument()
  })

  it('검색과 상태 탭으로 목록을 거른다', async () => {
    mockHook({ data: buildTeamsData(), isPending: false, isError: false })
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('팀명·반/기수 검색'), '트러블')
    expect(screen.getByText('트러블슈팅 팀')).toBeInTheDocument()
    expect(screen.queryByText('NLP 분석 팀')).not.toBeInTheDocument()
    await user.clear(screen.getByLabelText('팀명·반/기수 검색'))
    // 상태는 할 일 기준으로 묶인 탭 — 완료(조기 종료 포함)만 남긴다.
    await user.click(screen.getByRole('button', { name: '완료 (1)' }))
    expect(screen.getByText('NLP 분석 팀')).toBeInTheDocument()
    expect(screen.queryByText('트러블슈팅 팀')).not.toBeInTheDocument()
  })

  it('진행 중 탭은 예약 대기·일지 필요·수정 요청까지 묶어 보여 준다', async () => {
    mockHook({ data: buildTeamsData(), isPending: false, isError: false })
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: '진행 중 (2)' }))
    expect(screen.getByText('추천시스템 팀')).toBeInTheDocument()
    expect(screen.getByText('트러블슈팅 팀')).toBeInTheDocument()
    expect(screen.queryByText('NLP 분석 팀')).not.toBeInTheDocument()
  })

  it('비용·정산·매출 표현이 없다', () => {
    mockHook({ data: buildTeamsData(), isPending: false, isError: false })
    const { container } = renderPage()
    expect(container.textContent ?? '').not.toMatch(/비용|정산|매출/)
  })

  it('로딩·에러 상태를 표시한다', () => {
    mockHook({ isPending: true })
    const { unmount } = renderPage()
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    unmount()
    mockHook({ isPending: false, isError: true, refetch: vi.fn() })
    renderPage()
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })

  it('그리는 모든 링크가 살아 있는 라우트를 가리킨다', () => {
    // 화면을 걷어낼 때 링크를 함께 훑지 않으면 '찾을 수 없는 주소'로 떨어진다(2026-08-04).
    mockHook({ data: buildTeamsData(), isPending: false, isError: false })
    const { container } = renderPage()
    const dead = [...container.querySelectorAll('a')]
      .map((a) => a.getAttribute('href') ?? '')
      .filter((href) => href.startsWith('/mentor'))
      .filter((href) => !reachable(href))
    expect(dead).toEqual([])
  })
})
