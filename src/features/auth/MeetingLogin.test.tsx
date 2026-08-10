import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './LoginPage'
import { useAuthStore } from '@/shared/store'
import { apiClient } from '@/shared/api'

vi.mock('@/shared/api', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

function renderMeetingLogin() {
  return render(
    <MemoryRouter>
      <LoginPage variant="meeting" />
    </MemoryRouter>,
  )
}

// /login2 — 개발자 회의용 입구. 시연용 데모 계정이 노출되지 않는 것이 존재 이유이므로
// 그 경계를 테스트로 고정한다.
describe('LoginPage (meeting variant, /login2)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
    vi.clearAllMocks()
  })

  it('회의용 표식과 QA 빠른 로그인 버튼을 렌더한다', () => {
    renderMeetingLogin()
    expect(
      screen.getByText('개발자 회의용 — 시연 계정 사용 금지'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('회의용 QA 계정 · 클릭하면 바로 입장'),
    ).toBeInTheDocument()
    for (const label of [
      'QA 수강생',
      'QA 멘토',
      'QA 강사',
      'QA 매니저',
      'QA 관리자',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('시연용 데모 계정 버튼(수강생·멘토·강사·매니저)은 노출하지 않는다', () => {
    renderMeetingLogin()
    for (const label of ['수강생', '멘토', '강사', '매니저']) {
      expect(
        screen.queryByRole('button', { name: label }),
      ).not.toBeInTheDocument()
    }
  })

  it('QA 버튼을 누르면 해당 QA 계정으로 로그인을 요청한다', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        token: 't',
        user: { id: 'u1', name: 'QA 수강생', role: 'STUDENT' },
      },
    })
    const user = userEvent.setup()
    renderMeetingLogin()
    await user.click(screen.getByRole('button', { name: 'QA 수강생' }))
    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        userId: 'qa-student',
        password: 'LmsQa2026!',
      }),
    )
  })

  it('기본 /login(variant 미지정)은 데모 계정 버튼을 그대로 렌더한다', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: '수강생' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'QA 수강생' }),
    ).not.toBeInTheDocument()
  })
})
