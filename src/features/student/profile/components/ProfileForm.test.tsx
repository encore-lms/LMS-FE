import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { ProfileForm } from './ProfileForm'
import { useUpdateProfile } from '../../api/profile'
import type { StudentProfile } from '../types'

vi.mock('../../api/profile')

// 저장 토스트는 공용 Toast 를 그대로 쓴다.
// 예전에는 여기서만 자체 배너 JSX 를 넘겨, 보라색 success 박스 위에 어두운 글씨가 얹혀 묻혔다.
const profile: StudentProfile = {
  name: '박수진',
  displayName: '박수진',
  courseName: 'SK네트웍스 Family AI 캠프',
  cohortName: '32기',
  email: 'park@playdata.io',
  profileImageUrl: null,
  githubUrl: 'https://github.com/parksujin',
  blogUrl: 'https://blog.example.com/parksujin',
  portfolioUrl: '',
  linkedinUrl: '',
  skills: [],
  interests: [],
  promise: '매일 한 문제씩 풀고 기록하기',
  publicSettings: {
    profileImage: true,
    githubUrl: true,
    blogUrl: true,
    portfolioUrl: true,
    linkedinUrl: true,
  },
  completion: {
    pct: 60,
    requiredDone: 3,
    requiredTotal: 5,
    missingCount: 2,
    updatedAt: '2026-07-29T00:00:00Z',
  },
}

function renderForm(mutate: ReturnType<typeof vi.fn>) {
  vi.mocked(useUpdateProfile).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateProfile>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <ProfileForm profile={profile} />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('ProfileForm 저장 토스트', () => {
  it('저장에 성공하면 공용 토스트 문구 한 줄만 띄운다', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn((_values, opts) => opts?.onSuccess?.())
    renderForm(mutate)

    // 변경이 있어야 저장 버튼이 열린다.
    const inputs = screen.getAllByDisplayValue('박수진')
    await user.type(inputs[inputs.length - 1], '님')
    await user.click(screen.getByRole('button', { name: '변경사항 저장' }))

    expect(await screen.findByText('변경사항을 저장했어요')).toBeInTheDocument()
    // 자체 배너의 흔적이 남아 있으면 안 된다.
    expect(screen.queryByText('SAVED')).not.toBeInTheDocument()
    expect(
      screen.queryByText('변경사항이 즉시 반영되었습니다.'),
    ).not.toBeInTheDocument()
  })
})
