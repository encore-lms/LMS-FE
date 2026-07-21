import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import HistoryPage from './HistoryPage'
import { useMileageHistory } from './api'
import type { MileageHistoryData } from './types'

vi.mock('./api')
// 기수 필터 드롭다운은 자체 useQuery(useMileageCohorts)를 쓰므로 테스트에선 no-op 스텁.
vi.mock('../CohortScope', () => ({
  CohortScopeSelect: () => null,
}))

// 마일리지 지급 내역 — KPI·원장 표·구분 배지·정책 렌더 + 구분 필터 + CSV 토스트.

const overview: MileageHistoryData = {
  course: 'AI 캠프',
  cohortLabel: '22기',
  summary: {
    granted: '+312,500',
    grantedHint: '이번 기수 누적',
    deducted: '-187,200',
    deductedHint: '구매 사용 + 회수',
    net: '+125,300',
    netHint: '지급 - 차감',
    count: 482,
    countHint: '이번 기수 거래',
  },
  rows: [
    {
      id: 'tx-1',
      date: '05-19 14:32',
      studentName: '김민준',
      reason: '중간 발표 우수상 지급',
      amount: '+50,000',
      amountSign: 'plus',
      txType: 'grant',
      balance: '82,500',
      handler: '이매니저',
      handlerNote: '직접 지급',
    },
    {
      id: 'tx-2',
      date: '05-19 11:08',
      studentName: '이서연',
      reason: '문화상품권 5만원권 구매',
      amount: '-50,000',
      amountSign: 'minus',
      txType: 'deduct',
      balance: '24,200',
      handler: '시스템',
      handlerNote: '구매 승인 → 차감',
    },
  ],
  footer: { total: 482, grant: 312, deduct: 162, partial: 5, failed: 3 },
}

function renderPage() {
  vi.mocked(useMileageHistory).mockReturnValue({
    data: overview,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useMileageHistory>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('HistoryPage (마일리지 지급 내역)', () => {
  it('KPI·원장 표·구분 배지를 렌더한다', () => {
    renderPage()
    expect(screen.getByText('+312,500 M')).toBeInTheDocument()
    expect(screen.getByText('중간 발표 우수상 지급')).toBeInTheDocument()
    expect(screen.getByText('구매 승인 → 차감')).toBeInTheDocument()
    expect(
      screen.getByText('총 482건 · 지급 312 · 차감 162 · 부분 5 · 실패 3'),
    ).toBeInTheDocument()
  })

  it('구분 필터 — 차감만 보면 지급 거래가 사라진다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByLabelText('구분 필터'))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('button', {
        name: '차감',
      }),
    )
    expect(screen.getByText('문화상품권 5만원권 구매')).toBeInTheDocument()
    expect(screen.queryByText('중간 발표 우수상 지급')).toBeNull()
  })

  it('CSV 내보내기 — 준비 중 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /CSV 내보내기/ }))
    expect(
      await screen.findByText('CSV 내보내기는 준비 중입니다.'),
    ).toBeInTheDocument()
  })
})
