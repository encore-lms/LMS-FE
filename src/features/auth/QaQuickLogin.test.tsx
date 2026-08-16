import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './LoginPage'
import { useAuthStore } from '@/shared/store'
import { apiClient } from '@/shared/api'

vi.mock('@/shared/api', () => ({
  apiClient: { post: vi.fn(), postCredentialed: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

// /login 빠른 로그인 — 데모(시연)와 QA(개발·테스트) 두 그룹이 한 입구에 공존한다.
// (구 /login2 회의용 입구는 08-11 시연 종료 후 폐쇄.)
describe('LoginPage 빠른 로그인 그룹', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
    vi.clearAllMocks()
  })

  it('데모 4계정과 QA 5계정 버튼을 함께 렌더한다', () => {
    renderLogin()
    for (const label of ['수강생', '멘토', '강사', '매니저']) {
      // Testing Library의 getByRole name 문자열은 완전 일치라 'QA 수강생'과 충돌하지 않는다.
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
    expect(screen.getByText('QA 계정 · 개발·테스트용')).toBeInTheDocument()
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

  it('QA 버튼을 누르면 해당 QA 계정으로 로그인을 요청한다', async () => {
    vi.mocked(apiClient.postCredentialed).mockResolvedValue({
      data: {
        token: 't',
        user: { id: 'u1', name: 'QA 수강생', role: 'STUDENT' },
      },
    })
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: 'QA 수강생' }))
    await waitFor(() =>
      expect(apiClient.postCredentialed).toHaveBeenCalledWith('/auth/login', {
        userId: 'qa-student',
        password: 'LmsQa2026!',
      }),
    )
  })
})
