import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import ChangesRequestedPage from './ChangesRequestedPage'
import type { CertStatusData } from './types'

// 보완 요청은 코멘트 한 덩어리만 받는다(2026-08-07 결정) — 사유 카드·관련 영역·체크리스트는
// 만들 재료가 없어 걷어냈다. 화면이 그 코멘트를 그대로 보여주는지 본다.
const mutate = vi.fn()
let status: CertStatusData

vi.mock('../api/certificate', () => ({
  useCertStatus: () => ({
    data: status,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useRequestCertification: () => ({ mutate, isPending: false }),
}))

function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <ChangesRequestedPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

beforeEach(() => {
  mutate.mockClear()
  status = {
    status: 'changes_requested',
    stage: 'changes_requested',
    canRequest: true,
    changeRequest: {
      comment: 'GitHub URL 이 비어 있어\n근거 확인이 어렵습니다.',
      reviewerName: '박지수',
      requestedAt: '2026-08-07 10:20',
      resolved: false,
    },
  }
})

describe('보완 요청 상세', () => {
  it('매니저 코멘트를 그대로 보여준다', () => {
    renderPage()

    expect(screen.getByText(/GitHub URL 이 비어 있어/)).toBeInTheDocument()
    expect(screen.getByText(/박지수/)).toBeInTheDocument()
    expect(screen.getByText(/2026-08-07 10:20/)).toBeInTheDocument()
  })

  it('재요청 버튼이 인증 요청을 보낸다', async () => {
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: '정식 인증 재요청' }))

    expect(mutate).toHaveBeenCalledTimes(1)
  })

  // 요청할 수 없는 단계에서는 버튼을 막는다 — 서버도 422 로 막지만 화면에서 먼저 잠근다.
  it('요청할 수 없는 단계면 재요청 버튼이 잠긴다', () => {
    status = { ...status, canRequest: false }
    renderPage()

    expect(screen.getByRole('button', { name: '정식 인증 재요청' })).toBeDisabled()
  })

  it('보완 요청이 없으면 빈 상태를 보여준다', () => {
    status = { ...status, changeRequest: null }
    renderPage()

    expect(screen.getByText('보완 요청이 없어요')).toBeInTheDocument()
  })
})
