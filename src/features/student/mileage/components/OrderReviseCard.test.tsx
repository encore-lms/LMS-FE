import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/components/ui/Toast'
import { OrderReviseCard } from './OrderReviseCard'
import { useReviseMileageOrder, type MileageOrderRow } from '../../api/mileage'

vi.mock('../../api/mileage')

// QA: "매니저가 수정 요청하면 수정도 취소도 못 하고 검토 대기로만 남는다."
const order: MileageOrderRow = {
  id: 'ord-1',
  product: '클린 코드',
  amount: 24000,
  status: 'revision',
  statusLabel: '수정 요청',
  date: '2026.07.28',
  reviewNote: '구매 링크를 정가 판매처로 바꿔 주세요',
  lines: [
    {
      productId: 'p-1',
      productName: '클린 코드',
      quantity: 2,
      unitPrice: 12000,
      link: 'https://example.com/used',
    },
  ],
}

function renderCard(mutate = vi.fn()) {
  vi.mocked(useReviseMileageOrder).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof useReviseMileageOrder>)
  render(
    <ToastProvider>
      <OrderReviseCard order={order} />
    </ToastProvider>,
  )
  return mutate
}

describe('OrderReviseCard', () => {
  it('매니저가 남긴 수정 요청 사유를 보여준다', () => {
    renderCard()
    expect(
      screen.getByText('구매 링크를 정가 판매처로 바꿔 주세요'),
    ).toBeInTheDocument()
  })

  it('수량과 링크를 고쳐 다시 요청한다', async () => {
    const user = userEvent.setup()
    const mutate = renderCard()

    const link = screen.getByPlaceholderText('구매 링크(도서·강의만)')
    await user.clear(link)
    await user.type(link, 'https://example.com/new')
    await user.click(screen.getByRole('button', { name: '수정해서 다시 요청' }))

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'ord-1',
        items: [
          expect.objectContaining({
            productId: 'p-1',
            quantity: 2,
            link: 'https://example.com/new',
          }),
        ],
      }),
      expect.anything(),
    )
  })
})
