import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import MileagePage from './MileagePage'
import { useMileageOverview } from './api'
import type { MileageOverview } from './types'

vi.mock('./api')

// 마일리지 관리 허브 — 히어로(발행/사용/잔액)·경보·콘텐츠 탭 카드·정책 렌더 + CTA 토스트.

const overview: MileageOverview = {
  hero: {
    course: 'AI 캠프',
    cohortLabel: '22기 · 121명',
    issued: 2840500,
    used: 1127800,
    usedRate: '39.7%',
    balance: 1712700,
    studentCount: 121,
  },
  alerts: [
    {
      id: 'limit',
      label: '한도 초과',
      count: '3건',
      note: '타입 한도 초과 — 처리 보류',
      tone: 'warning',
    },
    {
      id: 'failed',
      label: '처리 실패',
      count: '2건',
      note: '재처리 대상',
      tone: 'danger',
    },
  ],
  tabs: [
    {
      id: 'history',
      title: '지급 내역',
      model: 'MileageTransaction · MileageAccount',
      description: '지급·차감 원장 조회 · 일자·수강생·타입·사유별 필터',
      stats: [{ label: '이번 달 거래', value: '482건' }],
      cta: '지급 내역 보기',
      route: '/admin/mileage/history',
    },
    {
      id: 'products',
      title: '상품 관리',
      model: 'MileageProduct',
      description: '마일리지 교환 상품 등록·수정·삭제 · 활성 상태 관리',
      stats: [{ label: '활성 상품', value: '18개', positive: true }],
      cta: '상품 관리 열기',
      route: '/admin/mileage/products',
    },
  ],
}

function renderPage() {
  vi.mocked(useMileageOverview).mockReturnValue({
    data: overview,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useMileageOverview>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <MileagePage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('MileagePage (마일리지 관리 허브)', () => {
  it('히어로 발행/사용/잔액 + 경보 + 콘텐츠 탭 + 정책을 렌더한다', () => {
    renderPage()
    expect(
      screen.getByText(
        '마일리지 지급·차감·구매·상품·한도를 한 곳에서 운영합니다',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('2,840,500')).toBeInTheDocument()
    expect(screen.getByText('1,712,700')).toBeInTheDocument()
    // 경보 + 탭 카드
    expect(screen.getByText('한도 초과')).toBeInTheDocument()
    expect(screen.getByText('지급 내역')).toBeInTheDocument()
    expect(
      screen.getByText('MileageTransaction · MileageAccount'),
    ).toBeInTheDocument()
    expect(screen.getByText('상품 관리')).toBeInTheDocument()
    // 정책
    expect(screen.getByText(/5개 탭은 URL에 반영됩니다/)).toBeInTheDocument()
  })

  it('콘텐츠 탭 CTA — 준비 중 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /지급 내역 보기/ }))
    expect(
      await screen.findByText('지급 내역 보기는 준비 중입니다.'),
    ).toBeInTheDocument()
  })
})
