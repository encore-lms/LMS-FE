import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { CertPublishBar } from './CertPublishBar'

// 공개 여부는 서버가 정본이라(검증 페이지는 다른 기기에서 열린다) 훅을 목으로 세운다.
const mutate = vi.fn()
let published = false
// 진행 단계도 서버가 정본이다 — 예전 zustand 시뮬레이션(useCertFlow)은 걷어냈다(2026-08-07).
let stage: 'before' | 'certified' = 'before'

vi.mock('../../api/certificate', () => ({
  useCertPublicationSettings: () => ({
    data: {
      publicToken: 'tok_test',
      publicUrl: 'https://verify.playdata.io/v/tok_test',
      published,
      peerReputationPublic: false,
      shortCommentPublic: false,
    },
  }),
  useUpdateCertPublication: () => ({ mutate }),
  useCertStatus: () => ({ data: { status: 'x', stage, canRequest: false, changeRequest: null } }),
}))

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
  mutate.mockClear()
  published = false
  stage = 'before'
})

describe('증명서 공개 바', () => {
  it('인증 전에는 공개 상태를 바꾸지 못한다', async () => {
    const user = userEvent.setup()
    renderBar()

    const button = screen.getByRole('switch', { name: '외부 검증 URL 공개' })
    expect(button).toBeDisabled()
    await user.click(button)

    expect(mutate).not.toHaveBeenCalled()
    expect(screen.getByText(/정식 인증이 끝나면/)).toBeInTheDocument()
  })

  it('인증이 끝나면 공개로 바꿀 수 있다', async () => {
    stage = 'certified'
    const user = userEvent.setup()
    renderBar()

    await user.click(screen.getByRole('switch', { name: '외부 검증 URL 공개' }))

    expect(mutate).toHaveBeenCalledWith({ published: true }, expect.anything())
  })

  it('공개 중이면 다시 비공개로 되돌릴 수 있다', async () => {
    published = true
    stage = 'certified'
    const user = userEvent.setup()
    renderBar()

    expect(
      screen.getByRole('switch', { name: '외부 검증 URL 공개' }),
    ).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText(/공개 중/)).toBeInTheDocument()
    await user.click(screen.getByRole('switch', { name: '외부 검증 URL 공개' }))

    expect(mutate).toHaveBeenCalledWith({ published: false }, expect.anything())
  })

  it('공개 설정 화면으로 갈 수 있다', () => {
    renderBar()
    expect(screen.getByRole('button', { name: '공개 설정' })).toBeInTheDocument()
  })

  // 폭 규칙 회귀 — 예전엔 `fixed left-[232px]` 로 사이드바 폭을 하드코딩해서, 사이드바를
  // 접거나 좁은 화면에서 숨으면 왼쪽에 232px 빈 칸이 남고 바가 붕 떠 보였다.
  // jsdom 은 레이아웃을 계산하지 않으므로 규칙(클래스)을 고정한다.
  it('본문 칸 안에서 sticky 로 붙는다 — 사이드바 폭을 가정하지 않는다', () => {
    renderBar()
    const bar = screen
      .getByRole('switch', { name: '외부 검증 URL 공개' })
      .closest('div.sticky')

    expect(bar).not.toBeNull()
    expect(bar?.className).not.toContain('fixed')
    expect(bar?.className).not.toMatch(/left-\[/)
    // 내용이 짧은 탭(이력서 빈 상태)에서 바가 위로 딸려 올라오지 않게 아래로 밀어 둔다.
    expect(bar?.className).toContain('mt-auto')
    expect(bar?.className).toContain('bottom-8')
  })
})
