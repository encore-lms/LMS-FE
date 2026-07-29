import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api'
import { useAuthStore } from '@/shared/store'
import OnboardingPage from './OnboardingPage'
import { OnboardingGate } from './OnboardingGate'
import type { StudentOnboardingResponse } from './types'

vi.mock('@/shared/api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

const JAVA_ID = '11111111-1111-1111-1111-111111111111'
const SPRING_ID = '22222222-2222-2222-2222-222222222222'

function onboardingFixture(
  overrides: Partial<StudentOnboardingResponse> = {},
): StudentOnboardingResponse {
  return {
    completed: false,
    profile: {
      promise: '끝까지 완주하겠습니다.',
      blogUrl: 'https://blog.example.com',
      githubUrl: '',
      selectedSkillIds: [JAVA_ID],
    },
    skillOptions: [
      {
        skillId: JAVA_ID,
        name: 'Java',
        category: 'backend',
        selected: true,
      },
      {
        skillId: SPRING_ID,
        name: 'Spring',
        category: 'backend',
        selected: false,
      },
    ],
    ...overrides,
  }
}

function renderWithProviders(
  ui: ReactElement,
  initialEntries = ['/student/onboarding'],
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().clearSession()
  })

  it('서버 온보딩 값을 채우고 완료 시 PATCH payload를 전송한다', async () => {
    const user = userEvent.setup()
    const current = onboardingFixture()
    vi.mocked(apiClient.get).mockResolvedValue({ data: current })
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: onboardingFixture({ completed: true }),
    })

    renderWithProviders(<OnboardingPage />, ['/student/onboarding?step=skills'])

    expect(await screen.findByRole('button', { name: /Java/ })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: /Spring/ }))
    await user.click(screen.getByRole('button', { name: '건너뛰기' }))
    await user.click(screen.getByRole('button', { name: '시작하기' }))

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith('/student/onboarding', {
        promise: '끝까지 완주하겠습니다.',
        skillIds: [JAVA_ID, SPRING_ID],
        blogUrl: 'https://blog.example.com',
        githubUrl: null,
      })
    })
  })
})

describe('OnboardingGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().clearSession()
  })

  it('온보딩 미완료 수강생을 온보딩 화면으로 보낸다', async () => {
    useAuthStore.getState().setSession('tok', {
      id: 'student-1',
      email: 'student@playdata.io',
      name: '김수강',
      role: 'STUDENT',
    })
    vi.mocked(apiClient.get).mockResolvedValue({ data: onboardingFixture() })

    renderWithProviders(
      <Routes>
        <Route path="/student" element={<OnboardingGate />}>
          <Route index element={<div>학생 홈</div>} />
        </Route>
        <Route path="/student/onboarding" element={<div>온보딩 화면</div>} />
      </Routes>,
      ['/student'],
    )

    expect(await screen.findByText('온보딩 화면')).toBeInTheDocument()
  })
})
