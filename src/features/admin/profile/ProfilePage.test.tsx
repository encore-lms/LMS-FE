import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import ProfilePage from './ProfilePage'
import { useChangePassword, useCurrentUser } from './api'
import { useMyCohorts } from '../api/dashboard'

vi.mock('./api')
vi.mock('../api/dashboard')

// 운영 매니저 마이 페이지 — 계정 정보·담당 기수 렌더 + 비밀번호 변경 검증.

function mockAll() {
  vi.mocked(useCurrentUser).mockReturnValue({
    data: {
      id: 'u1',
      email: 'admin@playdata.io',
      name: '최초 관리자',
      role: 'ADMIN',
      primaryRole: 'ADMIN',
      status: 'active',
      mustChangePassword: false,
      lastLoginAt: '2026-07-06T01:53:00Z',
      cohortIds: ['c24'],
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCurrentUser>)
  vi.mocked(useMyCohorts).mockReturnValue({
    data: [
      {
        cohortId: 'c24',
        courseId: 'course1',
        courseName: 'SK네트웍스 Family AI 캠프',
        cohortNo: '24',
        startDate: '2025-12-30',
        endDate: '2026-06-30',
      },
    ],
    isPending: false,
  } as unknown as ReturnType<typeof useMyCohorts>)
}

function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('운영 매니저 마이 프로필', () => {
  it('계정 정보와 담당 기수를 렌더한다', () => {
    mockAll()
    vi.mocked(useChangePassword).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useChangePassword>)
    renderPage()
    expect(screen.getAllByText('최초 관리자').length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText('admin@playdata.io').length,
    ).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('담당 과정·기수')).toBeInTheDocument()
    expect(
      screen.getByText(/SK네트웍스 Family AI 캠프 24기/),
    ).toBeInTheDocument()
  })

  it('새 비밀번호 불일치 시 에러를 표시하고 요청하지 않는다', async () => {
    mockAll()
    const mutate = vi.fn()
    vi.mocked(useChangePassword).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useChangePassword>)
    renderPage()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/현재 비밀번호/), 'oldpass12')
    await user.type(
      screen.getByLabelText(
        (c) => c.startsWith('새 비밀번호') && !c.includes('확인'),
      ),
      'newpass1234',
    )
    await user.type(screen.getByLabelText(/새 비밀번호 확인/), 'different99')
    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }))
    expect(
      await screen.findByText('새 비밀번호가 서로 일치하지 않아요.'),
    ).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })
})
