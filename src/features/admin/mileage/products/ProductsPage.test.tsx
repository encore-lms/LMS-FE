import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import ProductsPage from './ProductsPage'
import {
  useDeleteProduct,
  useMileageProducts,
  useUpsertProduct,
  useUploadProductImage,
} from './api'
import type { ProductsData } from './types'

vi.mock('./api')

// 마일리지 상품 관리 — 카드 그리드·가격·참조 중 삭제 제한·정책 렌더 + 타입 필터 + 등록.
const overview: ProductsData = {
  course: 'AI 캠프',
  cohortLabel: '22기',
  total: 18,
  typeCounts: [
    { type: 'all', label: '전체', count: 18 },
    { type: 'COUPON', label: '쿠폰', count: 9 },
    { type: 'GOODS', label: '굿즈', count: 6 },
  ],
  products: [
    {
      id: 'pd-1',
      emoji: '🎁',
      type: 'COUPON',
      name: '문화상품권 5만원권',
      priceMode: 'fixed',
      price: '50,000',
      order: 1,
      salesCount: 42,
      active: true,
    },
    {
      id: 'pd-4',
      emoji: '👕',
      type: 'GOODS',
      name: 'PLAYDATA 후드 집업',
      priceMode: 'fixed',
      price: '30,000',
      order: 4,
      salesCount: 24,
      active: true,
    },
    {
      id: 'pd-8',
      emoji: '🎟️',
      type: 'COUPON',
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
    { type: 'COUPON', mode: '고정가', note: '결제 시 마일리지 차감' },
    { type: 'GOODS', mode: '고정가', note: '결제 시 마일리지 차감' },
  ],
}

function renderPage() {
  vi.mocked(useMileageProducts).mockReturnValue({
    data: overview,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useMileageProducts>)
  const mutateMock = {
    mutate: (_vars: unknown, opts?: { onSuccess?: () => void }) =>
      opts?.onSuccess?.(),
    mutateAsync: async () => 'pd-new',
    isPending: false,
  }
  vi.mocked(useUpsertProduct).mockReturnValue(
    mutateMock as unknown as ReturnType<typeof useUpsertProduct>,
  )
  vi.mocked(useDeleteProduct).mockReturnValue(
    mutateMock as unknown as ReturnType<typeof useDeleteProduct>,
  )
  vi.mocked(useUploadProductImage).mockReturnValue(
    mutateMock as unknown as ReturnType<typeof useUploadProductImage>,
  )
  return render(
    <ToastProvider>
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('ProductsPage (마일리지 상품 관리)', () => {
  it('상품 카드·가격·참조 중 삭제 제한을 렌더한다', () => {
    renderPage()
    expect(screen.getByText('문화상품권 5만원권')).toBeInTheDocument()
    expect(screen.getByText('50,000 M')).toBeInTheDocument()
    expect(screen.getByText('PLAYDATA 후드 집업')).toBeInTheDocument()
    expect(screen.getByText('30,000 M')).toBeInTheDocument()
    // 수정은 전 상품(3개), 삭제는 참조 중(pd-8) 제외 → 2개
    expect(screen.getAllByRole('button', { name: '수정' })).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: '삭제' })).toHaveLength(2)
  })

  it('타입 필터(굿즈) — 쿠폰 상품이 사라진다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /굿즈/ }))
    expect(screen.getByText('PLAYDATA 후드 집업')).toBeInTheDocument()
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
    // 입력 후 제출
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
