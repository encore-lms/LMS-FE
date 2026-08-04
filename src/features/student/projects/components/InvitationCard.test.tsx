import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/components/ui/Toast'
import { InvitationCard } from './InvitationCard'
import { useAnswerInvitation, useProjectInvitations } from '../../api/projects'

vi.mock('../../api/projects', async (orig) => ({
  ...(await orig<typeof import('../../api/projects')>()),
  useProjectInvitations: vi.fn(),
  useAnswerInvitation: vi.fn(),
}))

// 초대는 제안이라 받아들이기 전에는 프로젝트 목록에 없다 — 여기가 유일한 입구다.

const answer = vi.fn()

function setup(
  invitations: {
    projectId: string
    title: string
    invitedBy: string
    memberCount: number
    invitedAt: string
  }[],
) {
  vi.mocked(useProjectInvitations).mockReturnValue({
    data: invitations,
  } as unknown as ReturnType<typeof useProjectInvitations>)
  vi.mocked(useAnswerInvitation).mockReturnValue({
    mutate: answer,
    isPending: false,
  } as unknown as ReturnType<typeof useAnswerInvitation>)
  render(
    <ToastProvider>
      <InvitationCard />
    </ToastProvider>,
  )
}

const 초대 = {
  projectId: 'p1',
  title: 'Encore Mart',
  invitedBy: '김대표',
  memberCount: 2,
  invitedAt: '2026.08.04',
}

beforeEach(() => answer.mockReset())

describe('받은 초대', () => {
  it('프로젝트 이름·부른 사람·팀 규모를 보여 준다', () => {
    setup([초대])

    expect(screen.getByText('Encore Mart')).toBeInTheDocument()
    expect(screen.getByText(/김대표 님이 초대/)).toBeInTheDocument()
    expect(screen.getByText(/팀원 2명/)).toBeInTheDocument()
  })

  it('수락하면 그 프로젝트로 응답을 보낸다', async () => {
    const user = userEvent.setup()
    setup([초대])

    await user.click(screen.getByRole('button', { name: '수락' }))

    expect(answer).toHaveBeenCalledWith(
      { projectId: 'p1', answer: 'accept' },
      expect.anything(),
    )
  })

  it('거절도 같은 자리에서 할 수 있다', async () => {
    const user = userEvent.setup()
    setup([초대])

    await user.click(screen.getByRole('button', { name: '거절' }))

    expect(answer).toHaveBeenCalledWith(
      { projectId: 'p1', answer: 'decline' },
      expect.anything(),
    )
  })

  it('답하면 알린다', async () => {
    const user = userEvent.setup()
    answer.mockImplementation((_v, opts) => opts?.onSuccess?.())
    setup([초대])

    await user.click(screen.getByRole('button', { name: '수락' }))

    await waitFor(() =>
      expect(screen.getByText(/‘Encore Mart’ 팀에 참여했어요/)).toBeVisible(),
    )
  })

  // 초대가 없을 때 빈 상자가 남으면 목록 위에 늘 공백이 생긴다.
  it('받은 초대가 없으면 아무것도 그리지 않는다', () => {
    setup([])

    expect(screen.queryByText('받은 초대')).not.toBeInTheDocument()
  })

  it('부른 사람을 모르면 그 자리만 비운다', () => {
    setup([{ ...초대, invitedBy: '' }])

    expect(screen.getByText('Encore Mart')).toBeInTheDocument()
    expect(screen.queryByText(/님이 초대/)).not.toBeInTheDocument()
  })
})
