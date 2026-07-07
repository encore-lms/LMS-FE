import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LoginPage } from './LoginPage'
import { useAuthStore } from '@/shared/store'
import { apiClient } from '@/shared/api'
import { queryClient } from '@/app/queryClient'

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

  it('데모 빠른 로그인 버튼을 누르면 해당 실제 계정으로 즉시 로그인한다', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        token: 'tok',
        user: {
          id: '1',
          email: 'rkdtk123@naver.com',
          name: '박강사',
          role: 'INSTRUCTOR',
        },
      },
    })
    renderLogin()
    await user.click(screen.getByRole('button', { name: '강사' }))
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        userId: 'rkdtk123@naver.com',
        password: 'Lms@RAmGcDJBCqw9',
      })
    })
    expect(useAuthStore.getState().user?.role).toBe('INSTRUCTOR')
  })

  it('로그아웃 없이 다른 계정으로 로그인하면 이전 세션 캐시가 정리된다', async () => {
    const user = userEvent.setup()
    // 이전 사용자 세션 + 캐시가 남아 있는 상태(데모 빠른 로그인으로 계정 교체하는 흐름)
    useAuthStore.getState().setSession('old-tok', {
      id: 'u0',
      email: 'old@playdata.io',
      name: '이전유저',
      role: 'MANAGER',
    })
    queryClient.setQueryData(['profile', 'me'], { name: '이전유저' })
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
      expect(useAuthStore.getState().user?.id).toBe('1')
    })
    expect(queryClient.getQueryData(['profile', 'me'])).toBeUndefined()
  })

  it('임시 비밀번호(mustChangePassword) 사용자는 역할 홈 대신 마이 프로필로 이동한다', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        token: 'tok',
        user: {
          id: 'm1',
          email: 'mentor@x.com',
          name: '김멘토',
          role: 'MENTOR',
          mustChangePassword: true,
        },
        nextRoute: '/mentor/dashboard',
      },
    })
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/mentor/profile" element={<div>멘토 프로필 화면</div>} />
          <Route path="/mentor/dashboard" element={<div>멘토 대시보드</div>} />
        </Routes>
      </MemoryRouter>,
    )
    await user.type(
      screen.getByPlaceholderText('이메일 또는 수강생 코드'),
      'mentor@x.com',
    )
    await user.type(screen.getByPlaceholderText('••••••••••'), 'Temp1234!')
    await user.click(screen.getByRole('button', { name: /로그인/ }))
    // nextRoute(/mentor/dashboard)보다 임시 비밀번호 유도가 우선한다
    expect(await screen.findByText('멘토 프로필 화면')).toBeInTheDocument()
  })

  it('온보딩이 필요한 수강생은 임시 비밀번호여도 온보딩부터 진행한다', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        token: 'tok',
        user: {
          id: 's1',
          email: '',
          name: '박수진',
          role: 'STUDENT',
          mustChangePassword: true,
        },
        nextRoute: '/student/onboarding',
      },
    })
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/student/onboarding" element={<div>온보딩 화면</div>} />
          <Route
            path="/student/profile"
            element={<div>수강생 프로필 화면</div>}
          />
        </Routes>
      </MemoryRouter>,
    )
    await user.type(
      screen.getByPlaceholderText('이메일 또는 수강생 코드'),
      '100058794696',
    )
    await user.type(screen.getByPlaceholderText('••••••••••'), 'Temp1234!')
    await user.click(screen.getByRole('button', { name: /로그인/ }))
    // 온보딩 게이트에 튕기지 않도록 온보딩을 우선한다 (완료 화면이 프로필 유도를 이어받음)
    expect(await screen.findByText('온보딩 화면')).toBeInTheDocument()
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
