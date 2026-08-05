import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TeamTab } from './TeamTab'
import type { WorkspaceData } from '../../types'

// 팀 구성 변경 가드만 보는 테스트 — 쓰기 훅·이름 해석은 대체한다.
vi.mock('../../../api/projects', () => ({
  useInviteMember: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveMember: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateMember: () => ({ mutate: vi.fn(), isPending: false }),
  wsWriteError: (_e: unknown, f: string) => f,
}))
vi.mock('../components/useMemberNames', () => ({
  useMemberNames: () => (_id: string | undefined, name: string) => name,
}))
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    danger: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    show: vi.fn(),
  }),
}))

const base = {
  id: 'p1',
  title: '프로젝트',
  status: 'draft',
  isOwner: true,
  peerEvalEnabled: false,
  members: [
    {
      memberId: 'm1',
      userId: 'u1',
      name: '이장우',
      role: '백엔드',
      kind: 'PM',
      avatarTone: 'brand',
    },
    {
      memberId: 'm2',
      userId: 'u2',
      name: '박수진',
      role: '프론트',
      kind: '팀원',
      avatarTone: 'info',
    },
  ],
} as unknown as WorkspaceData

const inviteButton = () => screen.getByRole('button', { name: '팀원 초대' })
const removeButtons = () => screen.getAllByRole('button', { name: '삭제' })

describe('TeamTab 팀 구성 가드', () => {
  // 지우면 그 팀원이 주고받은 평가가 갈 곳 없는 행으로 남는다.
  it('상호평가 기록이 있는 팀원은 삭제 버튼이 잠긴다', () => {
    const members = [
      base.members[0],
      { ...base.members[1], hasPeerRecord: true },
    ]
    render(<TeamTab d={{ ...base, members } as WorkspaceData} />)

    expect(removeButtons()[1]).toBeDisabled()
    expect(removeButtons()[1]).toHaveAttribute(
      'title',
      '상호평가 기록이 있는 팀원은 삭제할 수 없어요',
    )
  })

  it('PM이고 작성 중이면 초대·삭제가 열려 있다', () => {
    render(<TeamTab d={base} />)

    expect(inviteButton()).toBeEnabled()
    // 0번은 PM(자기 자신) — 원래 삭제 불가라 팀원 행만 본다.
    expect(removeButtons()[1]).toBeEnabled()
  })

  // 팀원 누구나 남을 넣고 뺄 수 있으면 PM이 모르는 사이 팀이 바뀐다.
  it('PM이 아니면 초대·삭제가 모두 막힌다', () => {
    render(<TeamTab d={{ ...base, isOwner: false }} />)

    expect(inviteButton()).toBeDisabled()
    expect(removeButtons()[1]).toBeDisabled()
    expect(screen.getByText('PM만 팀원을 초대할 수 있어요')).toBeInTheDocument()
  })

  // 평가 도중 대상이 사라지면 이미 낸 평가가 갈 곳을 잃는다.
  it('상호평가가 열려 있으면 팀 구성이 동결된다', () => {
    render(<TeamTab d={{ ...base, status: 'completed', peerEvalEnabled: true }} />)

    expect(inviteButton()).toBeDisabled()
    expect(removeButtons()[1]).toBeDisabled()
    expect(
      screen.getByText('상호평가가 진행 중이라 팀원을 바꿀 수 없어요'),
    ).toBeInTheDocument()
  })

  // 끝난 프로젝트에 사람을 넣으면 하지도 않은 협업이 증명서 근거가 된다.
  // 다만 잘못 들어온 팀원 정리는 평가 전이라면 남겨 둔다.
  it('종료된 프로젝트는 초대만 막고 삭제는 남긴다', () => {
    render(<TeamTab d={{ ...base, status: 'completed' }} />)

    expect(inviteButton()).toBeDisabled()
    expect(removeButtons()[1]).toBeEnabled()
    expect(
      screen.getByText('종료된 프로젝트에는 팀원을 초대할 수 없어요'),
    ).toBeInTheDocument()
  })
})
