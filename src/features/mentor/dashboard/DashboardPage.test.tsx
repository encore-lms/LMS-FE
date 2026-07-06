import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardPage from './DashboardPage'
import { useMentorDashboard } from '../api/mentor'
import { buildDashboardData } from '../mockDb'
import { usePageHeaderStore } from '@/shared/store'

vi.mock('../api/mentor')

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
    // 수정 요청 일지 상태 칩 — 사유 메모 병기
    expect(screen.getByText('수정 요청 — 일지 보강 필요')).toBeInTheDocument()
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
})
