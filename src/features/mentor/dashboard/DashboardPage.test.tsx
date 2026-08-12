import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import DashboardPage from './DashboardPage'
import { useMentorDashboard } from '../api/mentor'
import { buildDashboardData } from '../mockDb'
import { usePageHeaderStore } from '@/shared/store'
import { reachable } from '../routeReach'

vi.mock('../api/mentor')
// 상세 모달 자체는 여기서 검증하지 않는다 — '어디에' 열리는지만 본다.
vi.mock('../mentoring-logs/LogDetailModal', () => ({
  default: ({ logId }: { logId?: string }) => (
    <div>그 자리 일지 모달 {logId}</div>
  ),
}))

type Hook = ReturnType<typeof useMentorDashboard>

function mockHook(v: Partial<Hook>) {
  vi.mocked(useMentorDashboard).mockReturnValue(v as unknown as Hook)
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/mentor']}>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  it('히어로·할 일·예정·최근 일지를 렌더한다', () => {
    mockHook({ data: buildDashboardData(), isPending: false, isError: false })
    renderPage()
    // 제목은 본문 h1이 아니라 공유 헤더(usePageHeader)에 등록된다.
    expect(usePageHeaderStore.getState().title).toBe('대시보드')
    expect(screen.getByText('안녕하세요, 임수현 멘토님')).toBeInTheDocument()
    // 할 일 있는 팀만 — 목록은 '내 배정 팀'이 맡는다(2026-08-05 재구성).
    // 같은 팀이 카드로 한 번·표로 또 한 번 나오던 중복을 걷어냈다.
    const 손 = screen.getByText('지금 할 일').closest('section') as HTMLElement
    expect(within(손).getByText('일지 수정 요청')).toBeInTheDocument()
    expect(within(손).getByText('평가 필요')).toBeInTheDocument()
    expect(within(손).getByText('트러블슈팅 팀')).toBeInTheDocument()
    // 진행 중·완료 팀은 여기 나오지 않는다 — 할 일이 아니다.
    expect(within(손).queryByText('추천시스템 팀')).not.toBeInTheDocument()
    expect(within(손).queryByText('NLP 분석 팀')).not.toBeInTheDocument()
    expect(screen.getByText('예정된 멘토링')).toBeInTheDocument()
    expect(screen.getByText('최근 멘토링 일지')).toBeInTheDocument()
    // 목록으로 가는 길만 남긴다
    expect(
      screen.getByRole('link', { name: /내 배정 팀 .*전체 보기/ }),
    ).toHaveAttribute('href', '/mentor/teams')
  })

  it('비용·정산·매출 표현이 없다 — 활동 인정 요건 캡션만 허용', () => {
    mockHook({ data: buildDashboardData(), isPending: false, isError: false })
    const { container } = renderPage()
    // 그 캡션이 달려 있던 '해야 할 일' 헤더를 걷어내며 문구도 함께 사라졌다(2026-08-05).
    // 화면 어디에도 비용 표현이 없어야 한다는 규칙은 그대로다.
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
    // 예약·일지를 팀 탭으로 옮기며 독립 화면을 걷어냈을 때(2026-08-04), 이 화면의 섹션
    // 링크와 최근 일지 '일지 보기'가 옛 주소를 계속 가리켜 '찾을 수 없는 주소'로 떨어졌다.
    mockHook({ data: buildDashboardData(), isPending: false, isError: false })
    const { container } = renderPage()
    const dead = [...container.querySelectorAll('a')]
      .map((a) => a.getAttribute('href') ?? '')
      .filter((href) => href.startsWith('/mentor'))
      .filter((href) => !reachable(href))
    expect(dead).toEqual([])
  })

  it('최근 일지는 팀으로 보내지 않고 그 자리에서 연다', async () => {
    // 최근 일지는 '내가 쓴 일지'라 배정이 끝난 팀 것도 섞인다. 팀 상세로 보내면
    // '본인에게 배정된 팀만 열람할 수 있어요'로 막힌다(2026-08-05 배포 검증에서 확인).
    mockHook({ data: buildDashboardData(), isPending: false, isError: false })
    const user = userEvent.setup()
    renderPage()
    const open = screen.getAllByRole('button', { name: /일지 보기/ })[0]
    await user.click(open)
    expect(screen.getByText(/그 자리 일지 모달/)).toBeInTheDocument()
  })

  it('할 일 있는 팀이 없으면 비어 있다고 말한다', () => {
    // 빈 카드만 덩그러니 두면 로딩 중인지 할 일이 없는지 알 수 없다.
    const base = buildDashboardData()
    mockHook({
      data: {
        ...base,
        teamCards: base.teamCards.map((t) => ({
          ...t,
          status: 'in_progress' as const,
        })),
      },
      isPending: false,
      isError: false,
    })
    renderPage()
    expect(screen.getByText('지금 할 일이 없어요')).toBeInTheDocument()
    expect(screen.queryByText('지금 할 일')).not.toBeInTheDocument()
  })
})
