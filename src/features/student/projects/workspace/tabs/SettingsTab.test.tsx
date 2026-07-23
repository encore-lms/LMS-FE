import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsTab } from './SettingsTab'
import {
  useProjectGithub,
  useResyncProjectGithub,
  useStartProjectGithubInstall,
  useSaveProjectGithubBranches,
  useSaveMyGithubVisibility,
  useDisconnectProjectGithub,
} from '../../../api/projectGithub'
import type { WorkspaceData } from '../../types'
import type { ProjectGithubConnection } from '../../githubTypes'

vi.mock('../../../api/projectGithub')
// 프로젝트 정보·기술 카테고리 편집 훅은 useQueryClient에 의존하므로 mock으로 대체(GitHub 테스트 격리).
const { infoMutate, techMutate } = vi.hoisted(() => ({
  infoMutate: vi.fn(),
  techMutate: vi.fn(),
}))
vi.mock('../../../api/projects', () => ({
  useUpdateProjectInfo: () => ({ mutate: infoMutate, isPending: false }),
  useUpdateProjectTechStacks: () => ({ mutate: techMutate, isPending: false }),
  wsWriteError: (_e: unknown, f: string) => f,
}))
// 팀 관리는 설정 탭으로 이관됐지만 내부 훅(useInviteMember 등)이 많아 SettingsTab 테스트에선 대체.
vi.mock('./TeamTab', () => ({ TeamTab: () => <div>팀 관리 섹션</div> }))
const toast = {
  success: vi.fn(),
  danger: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  show: vi.fn(),
}
vi.mock('@/components/ui/use-toast', () => ({ useToast: () => toast }))

const base = {
  id: 'p1',
  title: '프로젝트',
  stack: [],
  status: 'draft',
} as unknown as WorkspaceData

const CONNECTED: ProjectGithubConnection = {
  githubConnectionId: 'conn-1',
  organization: {
    githubAccountId: 9919,
    login: 'playdata-encore',
    displayName: 'PLAYDATA Encore',
    avatarUrl: null,
  },
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
      totalCommits: 240,
      contributors: [],
      dailyActivity: [],
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
const resyncMutate = vi.fn()
const branchesMutate = vi.fn()
const visibilityMutate = vi.fn()
const disconnectMutate = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useStartProjectGithubInstall).mockReturnValue({
    mutate: startMutate,
    isPending: false,
  } as never)
  vi.mocked(useResyncProjectGithub).mockReturnValue({
    mutate: resyncMutate,
    isPending: false,
  } as never)
  vi.mocked(useSaveProjectGithubBranches).mockReturnValue({
    mutate: branchesMutate,
    isPending: false,
  } as never)
  vi.mocked(useSaveMyGithubVisibility).mockReturnValue({
    mutate: visibilityMutate,
    isPending: false,
  } as never)
  vi.mocked(useDisconnectProjectGithub).mockReturnValue({
    mutate: disconnectMutate,
    isPending: false,
  } as never)
})

describe('SettingsTab', () => {
  it('미연결 — 누구나 GitHub 연결 버튼을 본다', () => {
    mockQuery({
      githubConnectionId: null,
      organization: null,
      status: 'DISCONNECTED',
      repositories: [],
      lastSyncedAt: null,
    })
    render(<SettingsTab d={base} />)
    expect(screen.getByRole('button', { name: /GitHub 연결/ })).toBeEnabled()
  })

  it('연결 클릭 시 설치 시작을 호출한다', () => {
    mockQuery({
      githubConnectionId: null,
      organization: null,
      status: 'DISCONNECTED',
      repositories: [],
      lastSyncedAt: null,
    })
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
    fireEvent.click(
      screen.getByLabelText('playdata-encore/encore-lms-fe 증명서 공개'),
    )
    fireEvent.click(screen.getByRole('button', { name: '내 공개 설정 저장' }))
    expect(visibilityMutate).toHaveBeenCalledTimes(1)
    expect(visibilityMutate.mock.calls[0][0].repositories[0]).toMatchObject({
      githubRepositoryId: 101,
      isPublic: true,
    })
  })

  // ── 프로젝트 정보 편집 ──
  it('PM은 이름·기간 저장 버튼을 보고 저장을 호출한다', () => {
    mockQuery({
      githubConnectionId: null,
      organization: null,
      status: 'DISCONNECTED',
      repositories: [],
      lastSyncedAt: null,
    })
    const pm = {
      ...base,
      isOwner: true,
      startDate: '2026-05-01',
      endDate: '2026-06-01',
    } as WorkspaceData
    render(<SettingsTab d={pm} />)
    fireEvent.click(screen.getByRole('button', { name: '이름·기간 저장' }))
    expect(infoMutate).toHaveBeenCalledTimes(1)
    expect(infoMutate.mock.calls[0][0]).toMatchObject({
      title: '프로젝트',
      start: '2026-05-01',
      end: '2026-06-01',
    })
  })

  it('PM이 아니면 이름·기간 저장 버튼이 없고 입력이 비활성', () => {
    mockQuery({
      githubConnectionId: null,
      organization: null,
      status: 'DISCONNECTED',
      repositories: [],
      lastSyncedAt: null,
    })
    const member = { ...base, isOwner: false } as WorkspaceData
    render(<SettingsTab d={member} />)
    expect(screen.queryByRole('button', { name: '이름·기간 저장' })).toBeNull()
    expect(screen.getByLabelText('프로젝트명')).toBeDisabled()
  })

  it('기술 카테고리는 팀원 누구나 저장할 수 있다', () => {
    mockQuery({
      githubConnectionId: null,
      organization: null,
      status: 'DISCONNECTED',
      repositories: [],
      lastSyncedAt: null,
    })
    const member = {
      ...base,
      isOwner: false,
      stack: ['Spring Boot'],
    } as WorkspaceData
    render(<SettingsTab d={member} />)
    fireEvent.click(screen.getByRole('button', { name: '기술 카테고리 저장' }))
    expect(techMutate).toHaveBeenCalledTimes(1)
    expect(techMutate.mock.calls[0][0]).toEqual({ stacks: ['Spring Boot'] })
  })

  it('인증 완료면 정보·기술 편집이 잠긴다', () => {
    mockQuery({
      githubConnectionId: null,
      organization: null,
      status: 'DISCONNECTED',
      repositories: [],
      lastSyncedAt: null,
    })
    const certified = {
      ...base,
      isOwner: true,
      status: 'certified',
    } as WorkspaceData
    render(<SettingsTab d={certified} />)
    expect(screen.queryByRole('button', { name: '이름·기간 저장' })).toBeNull()
    expect(
      screen.queryByRole('button', { name: '기술 카테고리 저장' }),
    ).toBeNull()
    expect(
      screen.getByText(/인증이 완료된 프로젝트는 정보를 수정할 수 없어요/),
    ).toBeInTheDocument()
  })
})
