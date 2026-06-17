import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import TypeLimitsPage from './TypeLimitsPage'
import { useTypeLimits } from './api'
import type { TypeLimitsData } from './types'

vi.mock('./api')

// 마일리지 타입 한도 — 카드·정책 렌더 + 값 변경 시 저장 활성화 → 저장 모달 → 토스트.

const overview: TypeLimitsData = {
  course: 'AI 캠프',
  cohortLabel: '22기',
  limits: [
    {
      type: 'GIFTICON',
      label: '기프티콘',
      description: '고정가 상품',
      productCount: 9,
      priceMode: '고정가',
      purchaseInput: '수량',
      current: 200000,
      defaultValue: 200000,
    },
    {
      type: 'BOOK',
      label: '도서',
      description: '유연가 상품',
      productCount: 6,
      priceMode: '유연가',
      purchaseInput: '링크·가격',
      current: 100000,
      defaultValue: 100000,
    },
  ],
}

function renderPage() {
  vi.mocked(useTypeLimits).mockReturnValue({
    data: overview,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useTypeLimits>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <TypeLimitsPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('TypeLimitsPage (마일리지 타입 한도)', () => {
  it('타입 카드·정책 렌더 + 변경 전 저장 버튼 비활성', () => {
    renderPage()
    expect(screen.getByText('기프티콘')).toBeInTheDocument()
    expect(screen.getByText('도서')).toBeInTheDocument()
    expect(screen.getByText(/타입별 누적 사용 한도 검증/)).toBeInTheDocument()
    // 변경 0건 → 저장 비활성
    expect(
      screen.getByRole('button', { name: /한도 저장 — 변경 0건/ }),
    ).toBeDisabled()
  })

  it('값 변경 → 저장 활성화 → 저장 모달 → 확인 시 토스트', async () => {
    renderPage()
    const user = userEvent.setup()
    const input = screen.getByLabelText('도서 새 maxPerUser')
    await user.clear(input)
    await user.type(input, '150000')
    // 변경됨 배지 + diff + 저장 1건 활성
    expect(screen.getByText('변경됨')).toBeInTheDocument()
    const saveBtn = screen.getByRole('button', { name: /한도 저장 — 변경 1건/ })
    expect(saveBtn).toBeEnabled()
    await user.click(saveBtn)
    // 저장 확인 모달(운영 액션 모달 공통)
    expect(screen.getByText('마일리지 타입 한도 저장')).toBeInTheDocument()
    expect(screen.getByText('100,000M → 150,000M')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '한도 저장' }))
    expect(await screen.findByText('타입 한도 1건 저장됨')).toBeInTheDocument()
  })
})
