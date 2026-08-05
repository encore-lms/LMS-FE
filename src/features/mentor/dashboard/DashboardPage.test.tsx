import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  it('히어로·팀 카드·해야 할 일·예정·테이블·최근 일지를 렌더한다', () => {
    mockHook({ data: buildDashboardData(), isPending: false, isError: false })
    renderPage()
    // 제목은 본문 h1이 아니라 공유 헤더(usePageHeader)에 등록된다.
    expect(usePageHeaderStore.getState().title).toBe('대시보드')
    expect(screen.getByText('안녕하세요, 임수현 멘토님')).toBeInTheDocument()
    // 팀 3장 — 카드 + 테이블 양쪽 노출
    expect(screen.getAllByText('추천시스템 팀').length).toBeGreaterThan(1)
    expect(screen.getAllByText('데이터마트 팀').length).toBeGreaterThan(1)
    expect(screen.getAllByText('트러블슈팅 팀').length).toBeGreaterThan(1)
    // 완료 팀(NLP 분석)은 대시보드 미노출
    expect(screen.queryByText('NLP 분석 팀')).not.toBeInTheDocument()
    expect(screen.getByText('일지 작성 필요')).toBeInTheDocument()
    expect(screen.getByText('예정된 멘토링')).toBeInTheDocument()
    expect(screen.getByText('배정 팀 목록')).toBeInTheDocument()
    expect(screen.getByText('최근 멘토링 일지')).toBeInTheDocument()
    // 'N시간 완료'는 상태가 아닌 보조 라벨로 표기
    expect(screen.getAllByText(/N시간 완료/).length).toBeGreaterThan(0)
    // 수정 요청 일지 상태 칩 — 사유 메모는 칩 아래 별도 줄로 병기
    expect(screen.getAllByText('수정 요청').length).toBeGreaterThan(0)
    expect(screen.getByText('일지 보강 필요')).toBeInTheDocument()
  })

  it('비용·정산·매출 표현이 없다 — 활동 인정 요건 캡션만 허용', () => {
    mockHook({ data: buildDashboardData(), isPending: false, isError: false })
    const { container } = renderPage()
    // Figma 원문 캡션(유일하게 '비용'이 등장하는 안내 문구)은 존재해야 한다.
    expect(
      screen.getByText('비용 표현 없이 활동 인정 요건으로 안내'),
    ).toBeInTheDocument()
    const text = (container.textContent ?? '').replace(
      '비용 표현 없이 활동 인정 요건으로 안내',
      '',
    )
    expect(text).not.toMatch(/비용|정산|매출/)
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
})
