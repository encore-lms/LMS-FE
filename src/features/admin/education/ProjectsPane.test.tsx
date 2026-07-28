import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/components/ui/Toast'
import { ProjectsPane } from './ProjectsPane'
import { useCohortProjects, usePeerEvalToggle } from './api'
import { useStudentAccounts } from '../api/students'
import type { CohortProject } from './types'

vi.mock('./api')
vi.mock('../api/students')

const team: CohortProject = {
  id: 'p1',
  title: '팀 프로젝트 A',
  status: 'COMPLETED',
  statusLabel: '완료',
  createdAt: '2026.05.01',
  period: '2026.05.01 ~ 2026.06.30',
  tags: [],
  memberCount: 4,
  members: [
    { userId: 'u1', role: 'OWNER' },
    { userId: 'u2', role: 'MEMBER' },
  ],
  peerEvalEnabled: false,
}
// 팀원 1명 — 서로 평가할 대상이 없어 시작 불가여야 한다.
const solo: CohortProject = {
  ...team,
  id: 'p2',
  title: '개인 프로젝트',
  memberCount: 1,
  members: [{ userId: 'u1', role: 'OWNER' }],
}

function renderPane(projects: CohortProject[], mutate = vi.fn()) {
  vi.mocked(useCohortProjects).mockReturnValue({
    data: projects,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCohortProjects>)
  vi.mocked(useStudentAccounts).mockReturnValue({
    data: { items: [{ id: 'u1', name: '김민준' }] },
  } as unknown as ReturnType<typeof useStudentAccounts>)
  vi.mocked(usePeerEvalToggle).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof usePeerEvalToggle>)
  render(
    <ToastProvider>
      <ProjectsPane courseId="c1" cohortId="co1" />
    </ToastProvider>,
  )
  return mutate
}

describe('ProjectsPane 동료 평가 토글', () => {
  it('팀원 2명 이상이면 평가를 시작할 수 있다', async () => {
    const mutate = renderPane([team])
    const user = userEvent.setup()
    const card = screen.getByText('팀 프로젝트 A').closest('div')
      ?.parentElement as HTMLElement
    await user.click(within(card).getByRole('button', { name: /평가 시작/ }))
    expect(mutate).toHaveBeenCalledWith(
      { projectId: 'p1', enabled: true },
      expect.anything(),
    )
  })

  it('이미 개시된 프로젝트는 중단할 수 있다', async () => {
    const mutate = renderPane([{ ...team, peerEvalEnabled: true }])
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /중단/ }))
    expect(mutate).toHaveBeenCalledWith(
      { projectId: 'p1', enabled: false },
      expect.anything(),
    )
  })

  // 서버도 422로 막지만, 눌러보고 실패하는 대신 이유를 먼저 보여준다.
  // 동료 평가는 프로젝트가 끝난 뒤 하는 활동 — 진행 중에 열면 아직 하지 않은 협업을 평가하게 된다.
  it('진행 중 프로젝트는 시작 버튼이 비활성이고 이유를 안내한다', () => {
    renderPane([{ ...team, status: 'IN_PROGRESS', statusLabel: '진행 중' }])
    expect(screen.getByRole('button', { name: /평가 시작/ })).toBeDisabled()
    expect(screen.getByText(/아직 진행 중이라 시작할 수 없어요/)).toBeInTheDocument()
  })

  it('진행 중이어도 이미 개시된 것은 중단할 수 있다', () => {
    renderPane([
      { ...team, status: 'IN_PROGRESS', statusLabel: '진행 중', peerEvalEnabled: true },
    ])
    expect(screen.getByRole('button', { name: /중단/ })).toBeEnabled()
  })

  it('팀원이 1명이면 시작 버튼이 비활성이고 이유를 안내한다', () => {
    renderPane([solo])
    expect(screen.getByRole('button', { name: /평가 시작/ })).toBeDisabled()
    expect(
      screen.getByText(/팀원이 1명이라 시작할 수 없어요/),
    ).toBeInTheDocument()
  })
})
