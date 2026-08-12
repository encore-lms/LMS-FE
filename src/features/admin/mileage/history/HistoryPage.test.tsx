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
    granted: '+312,500M',
    grantedHint: '이번 기수 누적',
    deducted: '-187,200M',
    deductedHint: '구매 사용 + 회수',
    net: '+125,300M',
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
      amount: '+50,000M',
      amountSign: 'plus',
      txType: 'grant',
      balance: '82,500M',
      handler: '이매니저',
      handlerNote: '직접 지급',
    },
    {
      id: 'tx-2',
      date: '05-19 11:08',
      studentName: '이서연',
      reason: '문화상품권 5만원권 구매',
      amount: '-50,000M',
      amountSign: 'minus',
      txType: 'deduct',
      balance: '24,200M',
      handler: '시스템',
      handlerNote: '구매 승인 → 차감',
    },
  ],
  footer: { total: 482, grant: 312, deduct: 162, partial: 5, failed: 3 },
}

function renderPage(over: Partial<MileageHistoryData> = {}) {
  vi.mocked(useMileageHistory).mockReturnValue({
    data: { ...overview, ...over },
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
    expect(screen.getByText('+312,500M')).toBeInTheDocument()
    expect(screen.getByText('중간 발표 우수상 지급')).toBeInTheDocument()
    expect(screen.getByText('구매 승인 → 차감')).toBeInTheDocument()
    // 하단 집계는 화면에 보이는 행 기준 — 서버 전체값(482건)은 괄호로 덧붙인다.
    expect(
      screen.getByText(/총 2건 · 지급 1 · 차감 1 · 부분 0 · 실패 0/),
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

  // 필터를 걸면 표는 줄어드는데 KPI·하단은 서버 전체값이라 숫자가 어긋났다(2026-08-05 QA).
  it('필터를 걸면 건수도 함께 줄어든다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByLabelText('구분 필터'))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('button', { name: '차감' }),
    )

    expect(
      screen.getByText(/총 1건 · 지급 0 · 차감 1 · 부분 0 · 실패 0/),
    ).toBeInTheDocument()
    expect(screen.getByText('1건')).toBeInTheDocument()
  })

  // 구매는 요청 즉시 차감이라 승인 전에도 원장에 남는다 — 확정 차감과 구분해야 한다.
  it('승인 전 구매는 승인 검토로 표시한다', () => {
    renderPage({ rows: [{ ...overview.rows[1], pending: true }] })

    expect(screen.getByText('승인 검토')).toBeInTheDocument()
  })

  it('승인이 끝난 거래는 원래 구분 배지를 쓴다', () => {
    renderPage()

    expect(screen.queryByText('승인 검토')).not.toBeInTheDocument()
  })
})
