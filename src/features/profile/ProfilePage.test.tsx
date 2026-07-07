import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import ProfilePage from './ProfilePage'
import { useChangePassword, useCurrentUser } from './api'

vi.mock('./api')

// 공용 마이 프로필 — 강사·멘토처럼 부가 섹션 없이 쓰일 때의 기본 렌더 검증.

function mockMe(
  role: 'INSTRUCTOR' | 'MENTOR',
  overrides: { mustChangePassword?: boolean } = {},
) {
  vi.mocked(useCurrentUser).mockReturnValue({
    data: {
      id: 'u2',
      email: 'mentor@playdata.io',
      name: '김멘토',
      role,
      primaryRole: role,
      status: 'active',
      mustChangePassword: false,
      lastLoginAt: null,
      cohortIds: [],
      ...overrides,
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCurrentUser>)
  vi.mocked(useChangePassword).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useChangePassword>)
}

describe('공용 마이 프로필 (강사·멘토)', () => {
  it('계정 정보와 비밀번호 변경 폼을 렌더하고, 담당 기수 카드는 없다', () => {
    mockMe('MENTOR')
    render(
      <ToastProvider>
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      </ToastProvider>,
    )
    expect(screen.getAllByText('김멘토').length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText('mentor@playdata.io').length,
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getByRole('button', { name: '비밀번호 변경' }),
    ).toBeInTheDocument()
    // 담당 과정·기수는 운영 전용 주입 섹션 — 공용 본체에는 없다
    expect(screen.queryByText('담당 과정·기수')).not.toBeInTheDocument()
    // 일반 상태에서는 임시 비밀번호 배너가 없다
    expect(
      screen.queryByText(/임시 비밀번호로 로그인 중입니다/),
    ).not.toBeInTheDocument()
  })

  it('임시 비밀번호 상태(mustChangePassword)면 변경 유도 배너를 노출한다 (#375)', () => {
    mockMe('MENTOR', { mustChangePassword: true })
    render(
      <ToastProvider>
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      </ToastProvider>,
    )
    expect(
      screen.getByText(/임시 비밀번호로 로그인 중입니다/),
    ).toBeInTheDocument()
  })
})
