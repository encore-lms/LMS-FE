import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import ProfilePage from './ProfilePage'
import { useStudentProfile } from '../api/profile'
import { useChangePassword, useCurrentUser } from '@/features/profile/api'

vi.mock('../api/profile')
vi.mock('@/features/profile/api')
// 공개 프로필 폼·GitHub 연결 카드는 각자 자체 검증 범위 — 여기선 페이지 합성만 확인.
vi.mock('./components/ProfileForm', () => ({
  ProfileForm: () => <div>공개 프로필 폼</div>,
}))
vi.mock('./components/GithubConnectionCard', () => ({
  GithubConnectionCard: () => <div>GitHub 연결 카드</div>,
}))

describe('수강생 마이 프로필 페이지 합성', () => {
  it('공개 프로필 폼과 비밀번호 변경 카드를 함께 렌더한다 (#374)', () => {
    vi.mocked(useStudentProfile).mockReturnValue({
      data: {},
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useStudentProfile>)
    vi.mocked(useChangePassword).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useChangePassword>)
    vi.mocked(useCurrentUser).mockReturnValue({
      data: { mustChangePassword: false },
      isPending: false,
    } as unknown as ReturnType<typeof useCurrentUser>)

    render(
      <ToastProvider>
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      </ToastProvider>,
    )
    expect(screen.getByText('공개 프로필 폼')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '비밀번호 변경' }),
    ).toBeInTheDocument()
  })

  it('공개 프로필 조회가 실패해도 비밀번호 변경 카드는 유지된다', () => {
    vi.mocked(useStudentProfile).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useStudentProfile>)
    vi.mocked(useChangePassword).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useChangePassword>)
    vi.mocked(useCurrentUser).mockReturnValue({
      data: { mustChangePassword: true },
      isPending: false,
    } as unknown as ReturnType<typeof useCurrentUser>)

    render(
      <ToastProvider>
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      </ToastProvider>,
    )
    expect(screen.getByText('프로필을 불러오지 못했어요')).toBeInTheDocument()
    // 임시 비밀번호 변경 경로는 무관한 프로필 API 실패에 막히지 않는다
    expect(
      screen.getByRole('button', { name: '비밀번호 변경' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/임시 비밀번호로 로그인 중입니다/),
    ).toBeInTheDocument()
  })
})
