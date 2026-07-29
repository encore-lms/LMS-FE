import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { CertPublishBar } from './CertPublishBar'
import { useCertFlow } from '../useCertFlow'

// 외부 검증 URL 공개는 수강생이 직접 켜고 끈다.
// 정식 인증 전에는 켤 수 없다 — 검증되지 않은 증명서를 밖에 내보내면 안 된다.
function renderBar() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <CertPublishBar />
      </MemoryRouter>
    </ToastProvider>,
  )
}

beforeEach(() => {
  useCertFlow.setState({ status: 'draft', published: false })
})

describe('증명서 공개 바', () => {
  it('인증 전에는 공개 상태를 바꾸지 못한다', async () => {
    const user = userEvent.setup()
    renderBar()

    const button = screen.getByRole('switch', { name: '외부 검증 URL 공개' })
    expect(button).toBeDisabled()
    await user.click(button)

    expect(useCertFlow.getState().published).toBe(false)
    expect(screen.getByText(/정식 인증이 끝나면/)).toBeInTheDocument()
  })

  it('인증이 끝나면 공개로 바꿀 수 있다', async () => {
    useCertFlow.setState({ status: 'issued' })
    const user = userEvent.setup()
    renderBar()

    await user.click(screen.getByRole('switch', { name: '외부 검증 URL 공개' }))

    expect(useCertFlow.getState().published).toBe(true)
    expect(screen.getByText(/공개 중/)).toBeInTheDocument()
  })

  it('공개 중이면 다시 비공개로 되돌릴 수 있다', async () => {
    useCertFlow.setState({ status: 'issued', published: true })
    const user = userEvent.setup()
    renderBar()

    expect(
      screen.getByRole('switch', { name: '외부 검증 URL 공개' }),
    ).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('switch', { name: '외부 검증 URL 공개' }))

    expect(useCertFlow.getState().published).toBe(false)
  })

  it('공개 설정 화면으로 갈 수 있다', () => {
    renderBar()
    expect(screen.getByRole('button', { name: '공개 설정' })).toBeInTheDocument()
  })
})
