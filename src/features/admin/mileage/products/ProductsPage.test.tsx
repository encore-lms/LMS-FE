import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import ProductsPage from './ProductsPage'
import { useMileageProducts } from './api'
import type { ProductsData } from './types'

vi.mock('./api')

// 마일리지 상품 관리 — 카드 그리드·가격 방식·참조 중 삭제 제한·정책 렌더 + 타입 필터.

const overview: ProductsData = {
  course: 'AI 캠프',
  cohortLabel: '22기',
  total: 18,
  typeCounts: [
    { type: 'all', label: '전체', count: 18 },
    { type: 'GIFTICON', label: '기프티콘', count: 9 },
    { type: 'BOOK', label: '도서', count: 6 },
  ],
  products: [
    {
      id: 'pd-1',
      emoji: '🎁',
      type: 'GIFTICON',
      name: '문화상품권 5만원권',
      priceMode: 'fixed',
      price: '50,000',
      order: 1,
      salesCount: 42,
      active: true,
    },
    {
      id: 'pd-4',
      emoji: '📘',
      type: 'BOOK',
      name: '클린 코드',
      priceMode: 'flexible',
      price: null,
      order: 4,
      salesCount: 24,
      active: true,
    },
    {
      id: 'pd-8',
      emoji: '🎟️',
      type: 'GIFTICON',
      name: '기프티콘 5천원 — 폐기 예정',
      priceMode: 'fixed',
      price: '5,000',
      order: 8,
      salesCount: 42,
      active: false,
      referenced: true,
    },
  ],
  typePricing: [
    {
      type: 'GIFTICON',
      mode: '고정가',
      note: '상품 가격 필수 — 등록 시 매니저가 입력',
    },
    {
      type: 'BOOK',
      mode: '유연가',
      note: '수강생이 구매 시 가격 입력 — 매니저는 가격 입력 안 함',
    },
  ],
}

function renderPage() {
  vi.mocked(useMileageProducts).mockReturnValue({
    data: overview,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useMileageProducts>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('ProductsPage (마일리지 상품 관리)', () => {
  it('상품 카드·가격 방식·참조 중 삭제 제한·정책을 렌더한다', () => {
    renderPage()
    expect(screen.getByText('문화상품권 5만원권')).toBeInTheDocument()
    expect(screen.getByText('50,000 M')).toBeInTheDocument()
    // 유연가 상품(BOOK)은 가격 대신 '유연가'(카드 + 타입 안내 양쪽 등장)
    expect(screen.getByText('클린 코드')).toBeInTheDocument()
    expect(screen.getAllByText('유연가').length).toBeGreaterThan(0)
    // 참조 중 상품 = 삭제 불가
    expect(screen.getByText('참조 중 — 삭제 불가')).toBeInTheDocument()
    expect(
      screen.getByText(/참조 중 상품\(구매 요청 이력 존재\)은 삭제 제한/),
    ).toBeInTheDocument()
  })

  it('타입 필터(도서) — 기프티콘 상품이 사라진다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /도서/ }))
    expect(screen.getByText('클린 코드')).toBeInTheDocument()
    expect(screen.queryByText('문화상품권 5만원권')).toBeNull()
  })

  it('상품 등록 — 폼 모달을 열고 제출 시 성공 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /상품 등록/ }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('상품 등록')).toBeInTheDocument()
    // 빈 제출 → 검증 에러
    await user.click(within(dialog).getByRole('button', { name: '등록' }))
    expect(screen.getByText('상품명을 입력해주세요')).toBeInTheDocument()
    // 입력 후 제출 (기본 타입 GIFTICON=고정가 → 가격 필요)
    await user.type(
      screen.getByPlaceholderText('상품명을 입력하세요'),
      '신규 상품',
    )
    await user.type(screen.getByPlaceholderText('예: 50000'), '30000')
    await user.click(within(dialog).getByRole('button', { name: '등록' }))
    expect(await screen.findByText('상품을 등록했습니다.')).toBeInTheDocument()
  })

  it('수정 — 폼 모달이 수정 모드로 열린다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: '수정' })[0])
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('상품 수정')).toBeInTheDocument()
  })
})
