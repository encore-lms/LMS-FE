import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsTab } from './SettingsTab'
import {
  useProjectGithub,
  useStartProjectGithubInstall,
  useSaveProjectGithubBranches,
  useSaveMyGithubVisibility,
  useDisconnectProjectGithub,
} from '../../../api/projectGithub'
import type { WorkspaceData } from '../../types'
import type { ProjectGithubConnection } from '../../githubTypes'

vi.mock('../../../api/projectGithub')
const toast = { success: vi.fn(), danger: vi.fn(), info: vi.fn(), warning: vi.fn(), show: vi.fn() }
vi.mock('@/components/ui/use-toast', () => ({ useToast: () => toast }))

const base = { id: 'p1' } as unknown as WorkspaceData

const CONNECTED: ProjectGithubConnection = {
  githubConnectionId: 'conn-1',
  organization: { githubAccountId: 9919, login: 'playdata-encore', displayName: 'PLAYDATA Encore', avatarUrl: null },
  status: 'CONNECTED',
  repositories: [
    {
      githubRepositoryId: 101,
      name: 'encore-lms-fe',
      fullName: 'playdata-encore/encore-lms-fe',
      visibility: 'PRIVATE',
      defaultBranch: 'develop',
      analysisBranch: 'main',
      availableBranches: ['develop', 'main', 'release/1.0'],
      isSelected: false,
      permissionStatus: 'ACCESSIBLE',
      isPublicForMe: false,
      myCommits: 92,
      myContribPercent: 38,
    },
  ],
  lastSyncedAt: '2026-07-22T00:00:00Z',
}

function mockQuery(data: ProjectGithubConnection | undefined, over = {}) {
  vi.mocked(useProjectGithub).mockReturnValue({
    data,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
    ...over,
  } as unknown as ReturnType<typeof useProjectGithub>)
}
const startMutate = vi.fn()
const branchesMutate = vi.fn()
const visibilityMutate = vi.fn()
const disconnectMutate = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useStartProjectGithubInstall).mockReturnValue({ mutate: startMutate, isPending: false } as never)
  vi.mocked(useSaveProjectGithubBranches).mockReturnValue({ mutate: branchesMutate, isPending: false } as never)
  vi.mocked(useSaveMyGithubVisibility).mockReturnValue({ mutate: visibilityMutate, isPending: false } as never)
  vi.mocked(useDisconnectProjectGithub).mockReturnValue({ mutate: disconnectMutate, isPending: false } as never)
})

describe('SettingsTab', () => {
  it('미연결 — 누구나 GitHub 연결 버튼을 본다', () => {
    mockQuery({ githubConnectionId: null, organization: null, status: 'DISCONNECTED', repositories: [], lastSyncedAt: null })
    render(<SettingsTab d={base} />)
    expect(screen.getByRole('button', { name: /GitHub 연결/ })).toBeEnabled()
  })

  it('연결 클릭 시 설치 시작을 호출한다', () => {
    mockQuery({ githubConnectionId: null, organization: null, status: 'DISCONNECTED', repositories: [], lastSyncedAt: null })
    render(<SettingsTab d={base} />)
    fireEvent.click(screen.getByRole('button', { name: /GitHub 연결/ }))
    expect(startMutate).toHaveBeenCalledTimes(1)
  })

  it('연결됨 — 팀 공통 분석 브랜치와 개인 공개 섹션을 함께 보여준다', () => {
    mockQuery(CONNECTED)
    render(<SettingsTab d={base} />)
    expect(screen.getByText('분석 브랜치 · 팀 공통')).toBeInTheDocument()
    expect(screen.getByText('내 증명서에 공개할 저장소')).toBeInTheDocument()
    expect(screen.getByText(/내 커밋 92 · 기여 38%/)).toBeInTheDocument()
  })

  it('분석 브랜치 저장 시 팀 공통 브랜치를 전송한다', () => {
    mockQuery(CONNECTED)
    render(<SettingsTab d={base} />)
    fireEvent.click(screen.getByRole('button', { name: '분석 브랜치 저장' }))
    expect(branchesMutate).toHaveBeenCalledTimes(1)
    expect(branchesMutate.mock.calls[0][0].repositories[0]).toMatchObject({
      githubRepositoryId: 101,
      analysisBranch: 'main',
    })
  })

  it('내 공개 체크 후 저장 시 개인 공개를 전송한다', () => {
    mockQuery(CONNECTED)
    render(<SettingsTab d={base} />)
    fireEvent.click(screen.getByLabelText('playdata-encore/encore-lms-fe 증명서 공개'))
    fireEvent.click(screen.getByRole('button', { name: '내 공개 설정 저장' }))
    expect(visibilityMutate).toHaveBeenCalledTimes(1)
    expect(visibilityMutate.mock.calls[0][0].repositories[0]).toMatchObject({
      githubRepositoryId: 101,
      isPublic: true,
    })
  })
})
