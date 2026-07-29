import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PeerTab } from './PeerTab'
import type { WorkspaceData } from '../../types'

vi.mock('../../../api/projects', () => ({
  useSubmitPeerEval: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSaveSelfReview: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSavePeerEvalDraft: () => ({ mutateAsync: vi.fn(), isPending: false }),
  wsWriteError: (_e: unknown, fallback: string) => fallback,
}))
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ success: vi.fn(), danger: vi.fn(), info: vi.fn() }),
}))
vi.mock('../components/useMemberNames', () => ({
  // 실제 시그니처는 (memberId, fallbackName) — 이름 join 실패 시 fallback 을 쓴다.
  useMemberNames: () => (_id: string, name: string) => name,
}))

// 완료 확정된 프로젝트(phase !== 'active') — 개시 여부만으로 갈린다.
const base = {
  id: 'p1',
  title: '팀 프로젝트',
  status: 'certified',
  peerDue: 'D-3',
  peerMyStatus: { label: '미제출', tone: 'warning' },
  peerTeamStatus: { label: '팀 제출 0/2', tone: 'info' },
  peerTargets: [
    {
      memberId: 'm1',
      name: '김팀원',
      role: '팀원',
      axes: [{ key: 'collaboration', label: '협업', score: 0 }],
      tags: [],
    },
  ],
  peerEvalEnabled: true,
} as unknown as WorkspaceData

describe('PeerTab 동료 평가 개시 게이트', () => {
  it('개시되면 평가 폼을 보여준다', () => {
    render(<PeerTab d={base} />)
    expect(screen.getByText('김팀원')).toBeInTheDocument()
    expect(screen.queryByText('아직 상호평가가 열리지 않았어요')).toBeNull()
  })

  // 회귀 — 개시 전에도 폼이 떠서, 다 입력하고 제출에서만 400이 나 입력이 통째로 날아갔다.
  it('개시 전에는 폼 대신 안내를 보여준다', () => {
    render(<PeerTab d={{ ...base, peerEvalEnabled: false }} />)
    expect(
      screen.getByText('아직 상호평가가 열리지 않았어요'),
    ).toBeInTheDocument()
    expect(screen.queryByText('김팀원')).toBeNull()
  })
})
