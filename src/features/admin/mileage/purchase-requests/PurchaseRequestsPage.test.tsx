import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import PurchaseRequestsPage from './PurchaseRequestsPage'
import { usePurchaseProcess, usePurchaseQueue } from './api'
import type { PurchaseData } from './types'

vi.mock('./api')
vi.mock('../CohortScope', () => ({
  CohortScopeSelect: () => null,
}))

// 마일리지 구매 요청 — KPI·처리 큐·정책 렌더 + 상태 필터 + 승인 → 처리 모달 → 토스트.

const overview: PurchaseData = {
  course: 'AI 캠프',
  cohortLabel: '22기',
  kpis: [
    {
      status: 'pending',
      label: 'PENDING',
      count: 12,
      note: '처리 대기 — 승인·수정·반려',
    },
    {
      status: 'approved',
      label: 'APPROVED',
      count: 87,
      note: '승인 완료 — 원장 차감 처리',
    },
  ],
  requests: [
    {
      id: 'po-1',
      status: 'pending',
      type: 'BOOK',
      studentName: '이서연',
      productName: '클린 코드',
      needsLink: true,
      qty: 1,
      price: 24300,
      date: '05-19 10:42',
    },
    {
      id: 'po-3',
      status: 'pending',
      type: 'LECTURE',
      studentName: '박지훈',
      productName: '인프런 강의',
      needsLink: true,
      qty: 1,
      price: 88000,
      date: '05-19 08:42',
      limitExceeded: true,
    },
    {
      id: 'po-6',
      status: 'approved',
      type: 'GIFTICON',
      studentName: '한지호',
      productName: '메가커피 디저트 세트',
      needsLink: false,
      qty: 2,
      price: 13800,
      date: '05-17 16:30',
    },
  ],
  typeNotes: [
    {
      type: 'GIFTICON',
      note: '고정가 상품 기준 처리 (등록된 가격으로 자동 차감)',
    },
  ],
  total: 109,
  pendingCount: 12,
  limitExceededCount: 1,
}

function renderPage() {
  vi.mocked(usePurchaseQueue).mockReturnValue({
    data: overview,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof usePurchaseQueue>)
  vi.mocked(usePurchaseProcess).mockReturnValue({
    mutate: (_vars: unknown, opts?: { onSuccess?: () => void }) =>
      opts?.onSuccess?.(),
  } as unknown as ReturnType<typeof usePurchaseProcess>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <PurchaseRequestsPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('PurchaseRequestsPage (마일리지 구매 요청)', () => {
  it('KPI·처리 큐(기본 PENDING)·한도 초과 차단을 렌더한다', () => {
    renderPage()
    expect(screen.getByText('처리 대기 — 승인·수정·반려')).toBeInTheDocument()
    // 기본 상태 필터 = PENDING → 승인 완료 행은 숨김
    expect(screen.getByText('클린 코드')).toBeInTheDocument()
    expect(screen.queryByText('메가커피 디저트 세트')).toBeNull()
    // 한도 초과 행 = 승인 차단
    expect(screen.getByText('한도 초과 — 승인 차단')).toBeInTheDocument()
  })

  it('상태 필터 — APPROVED 선택 시 승인 완료 행이 보인다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByLabelText('상태 필터'))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('button', {
        name: 'APPROVED',
      }),
    )
    expect(screen.getByText('메가커피 디저트 세트')).toBeInTheDocument()
    expect(screen.queryByText('클린 코드')).toBeNull()
  })

  it('승인 → 처리 모달 → 확인 시 토스트', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: '승인' })[0])
    expect(screen.getByText('구매 요청 승인')).toBeInTheDocument()
    const all = screen.getAllByRole('button', { name: '승인' })
    await user.click(all[all.length - 1])
    expect(await screen.findByText('구매 요청 승인 처리됨')).toBeInTheDocument()
  })
})
