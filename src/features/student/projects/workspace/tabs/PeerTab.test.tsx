import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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

// QA: "미평가 항목이 있어도 제출이 성공한다."
// 빈 축을 0 점으로 채워 보내면 '안 매긴 것'과 '1점 미만'을 구분할 수 없고,
// 증명서에는 매기지도 않은 점수가 반영된다.
describe('PeerTab 제출 전 점수 검증', () => {
  const twoAxes = {
    ...base,
    peerTargets: [
      {
        memberId: 'm1',
        name: '김팀원',
        role: '팀원',
        axes: [
          { key: '협업', label: '협업', score: 0 },
          { key: '소통', label: '소통', score: 0 },
        ],
        tags: [],
      },
    ],
  } as unknown as WorkspaceData

  it('축이 하나라도 비면 제출이 잠긴다', () => {
    render(<PeerTab d={twoAxes} />)
    expect(screen.getByRole('button', { name: '제출' })).toBeDisabled()

    fireEvent.change(screen.getByRole('slider', { name: /김팀원 협업 점수/ }), {
      target: { value: '4' },
    })
    // 소통이 아직 비어 있다.
    expect(screen.getByRole('button', { name: '제출' })).toBeDisabled()
  })

  it('그려진 축을 모두 매기면 잠금이 풀린다', () => {
    render(<PeerTab d={twoAxes} />)
    for (const s of screen.getAllByRole('slider')) {
      fireEvent.change(s, { target: { value: '4' } })
    }
    expect(screen.getByRole('button', { name: '제출' })).toBeEnabled()
  })
})
