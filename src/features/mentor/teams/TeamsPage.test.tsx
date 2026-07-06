import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TeamsPage from './TeamsPage'
import { useMentorTeams } from '../api/mentor'
import { buildTeamsData } from '../mockDb'
import { usePageHeaderStore } from '@/shared/store'

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
  it('KPI·팀 카드·배정 팀 전체 테이블을 렌더한다', () => {
    mockHook({ data: buildTeamsData(), isPending: false, isError: false })
    renderPage()
    expect(usePageHeaderStore.getState().title).toBe('내 배정 팀')
    // KPI 4종 — Figma 대표값(진행 중 2 · 예약 대기 1 · 평가 필요 1 · 수정 요청 1)
    expect(screen.getByText('N시간 미완료 일반 진행')).toBeInTheDocument()
    expect(screen.getByText('요청 확인 필요')).toBeInTheDocument()
    expect(screen.getByText('N시간 완료 또는 조기 종료')).toBeInTheDocument()
    expect(screen.getByText('운영자 보강 요청')).toBeInTheDocument()
    // 테이블엔 완료 팀(NLP 분석) 포함 4팀 전부, 카드는 액션 필요 3팀만
    expect(screen.getByText('배정 팀 전체 (4팀)')).toBeInTheDocument()
    expect(screen.getByText('NLP 분석 팀')).toBeInTheDocument()
    // 보조 태그 — 상태가 아닌 부가 라벨
    expect(screen.getByText('✓ N시간 완료')).toBeInTheDocument()
    expect(screen.getByText('초과 멘토링 1.5h')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /CSV 내보내기/ }),
    ).toBeInTheDocument()
  })

  it('검색·상태 필터로 카드와 테이블을 거른다', async () => {
    mockHook({ data: buildTeamsData(), isPending: false, isError: false })
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('팀명·반/기수 검색'), '트러블')
    expect(screen.getAllByText('트러블슈팅 팀').length).toBeGreaterThan(0)
    expect(screen.queryByText('NLP 분석 팀')).not.toBeInTheDocument()
    await user.clear(screen.getByLabelText('팀명·반/기수 검색'))
    await user.selectOptions(screen.getByLabelText('상태 필터'), 'completed')
    expect(screen.getByText('NLP 분석 팀')).toBeInTheDocument()
    expect(screen.queryByText('트러블슈팅 팀')).not.toBeInTheDocument()
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
})
