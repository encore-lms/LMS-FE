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

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
    vi.clearAllMocks()
  })

  it('페이지 제목과 핵심 폼 요소를 렌더한다', () => {
    renderLogin()
    expect(
      screen.getByRole('heading', { name: '로그인', level: 1 }),
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('이메일 또는 수강생 코드'),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /로그인/ })).toBeEnabled()
  })

  it('Brand Panel의 PLAYDATA 카피를 렌더한다', () => {
    renderLogin()
    expect(screen.getByText('PLAYDATA')).toBeInTheDocument()
    expect(screen.getByText(/실력은 결과가 아니라/)).toBeInTheDocument()
  })

  it('이메일 기억하기 체크박스를 토글한다', async () => {
    const user = userEvent.setup()
    renderLogin()
    const checkbox = screen.getByRole('checkbox', { name: '아이디 기억하기' })
    expect(checkbox).not.toBeChecked()
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it('이메일 input에 입력하면 값이 반영된다 (RHF register)', async () => {
    const user = userEvent.setup()
    renderLogin()
    const input = screen.getByPlaceholderText('이메일 또는 수강생 코드')
    await user.type(input, 'test@playdata.io')
    expect(input).toHaveValue('test@playdata.io')
  })

  it('Caps Lock 상태를 OFF로 초기 표시한다', () => {
    renderLogin()
    expect(screen.getByTestId('caps-lock-indicator')).toHaveTextContent(
      'Caps Lock OFF',
    )
  })

  it('로그인 성공 시 apiClient 호출 후 store에 세션을 저장한다', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        token: 'tok',
        user: { id: '1', email: 'a@b.com', name: '김수강', role: 'STUDENT' },
      },
    })
    renderLogin()
    await user.type(
      screen.getByPlaceholderText('이메일 또는 수강생 코드'),
      'a@b.com',
    )
    await user.type(screen.getByPlaceholderText('••••••••••'), 'pw1234')
    await user.click(screen.getByRole('button', { name: /로그인/ }))

    await waitFor(() => {
      expect(useAuthStore.getState().user?.role).toBe('STUDENT')
    })
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      userId: 'a@b.com',
      password: 'pw1234',
    })
  })

  it('이메일이 아닌 숫자 수강생 코드도 검증을 통과해 제출된다', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        token: 'tok',
        user: { id: '1', email: '', name: '수강생', role: 'STUDENT' },
      },
    })
    renderLogin()
    await user.type(
      screen.getByPlaceholderText('이메일 또는 수강생 코드'),
      '109012389',
    )
    await user.type(screen.getByPlaceholderText('••••••••••'), 'pw1234')
    await user.click(screen.getByRole('button', { name: /로그인/ }))

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        userId: '109012389',
        password: 'pw1234',
      })
    })
  })

  it('데모 빠른 로그인 버튼을 누르면 해당 역할 ID/PW가 폼에 채워진다(제출 안 함)', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: '강사' }))
    expect(screen.getByPlaceholderText('이메일 또는 수강생 코드')).toHaveValue(
      'instructor@playdata.io',
    )
    expect(screen.getByPlaceholderText('••••••••••')).toHaveValue(
      'playdata123!',
    )
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('스타일 가이드로 이동 링크가 /_styleguide를 가리킨다', () => {
    renderLogin()
    expect(
      screen.getByRole('link', { name: /스타일 가이드로 이동/ }),
    ).toHaveAttribute('href', '/_styleguide')
  })

  it('빈 값으로 제출하면 zod 검증 에러를 표시하고 API를 호출하지 않는다', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: /로그인/ }))
    expect(await screen.findByText('아이디를 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('비밀번호를 입력해주세요')).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalled()
  })
})
