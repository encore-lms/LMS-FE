import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsTab } from './SettingsTab'
import {
  useProjectGithub,
  useStartProjectGithubInstall,
  useSaveProjectGithub,
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
      analysisBranch: 'develop',
      isSelected: false,
      isCertificatePublic: false,
      permissionStatus: 'ACCESSIBLE',
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
const saveMutate = vi.fn()
const disconnectMutate = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useStartProjectGithubInstall).mockReturnValue({ mutate: startMutate, isPending: false } as never)
  vi.mocked(useSaveProjectGithub).mockReturnValue({ mutate: saveMutate, isPending: false } as never)
  vi.mocked(useDisconnectProjectGithub).mockReturnValue({ mutate: disconnectMutate, isPending: false } as never)
})

describe('SettingsTab', () => {
  it('PM 미연결 — GitHub 연결 버튼을 보여준다', () => {
    mockQuery({ githubConnectionId: null, organization: null, status: 'DISCONNECTED', repositories: [], lastSyncedAt: null })
    render(<SettingsTab d={{ ...base, isOwner: true }} />)
    expect(screen.getByRole('button', { name: /GitHub 연결/ })).toBeEnabled()
  })

  it('비PM — 연결 버튼 없이 PM 전용 안내를 보여준다', () => {
    mockQuery({ githubConnectionId: null, organization: null, status: 'DISCONNECTED', repositories: [], lastSyncedAt: null })
    render(<SettingsTab d={{ ...base, isOwner: false }} />)
    expect(screen.getByText(/PM\(팀장\)만 변경할 수 있어요/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /GitHub 연결/ })).toBeNull()
  })

  it('연결 버튼 클릭 시 설치 시작을 호출한다', () => {
    mockQuery({ githubConnectionId: null, organization: null, status: 'DISCONNECTED', repositories: [], lastSyncedAt: null })
    render(<SettingsTab d={{ ...base, isOwner: true }} />)
    fireEvent.click(screen.getByRole('button', { name: /GitHub 연결/ }))
    expect(startMutate).toHaveBeenCalledTimes(1)
  })

  it('연결됨 — Org와 레포 목록·저장 버튼을 보여준다', () => {
    mockQuery(CONNECTED)
    render(<SettingsTab d={{ ...base, isOwner: true }} />)
    expect(screen.getByText('PLAYDATA Encore')).toBeInTheDocument()
    expect(screen.getByText('playdata-encore/encore-lms-fe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '변경사항 저장' })).toBeInTheDocument()
  })

  it('레포 선택 후 저장 시 선택 상태를 전송한다', () => {
    mockQuery(CONNECTED)
    render(<SettingsTab d={{ ...base, isOwner: true }} />)
    fireEvent.click(screen.getByLabelText('playdata-encore/encore-lms-fe 선택'))
    fireEvent.click(screen.getByRole('button', { name: '변경사항 저장' }))
    expect(saveMutate).toHaveBeenCalledTimes(1)
    const req = saveMutate.mock.calls[0][0]
    expect(req.repositories[0]).toMatchObject({ githubRepositoryId: 101, isSelected: true })
  })

  it('비PM 연결됨 — 저장 버튼 없이 읽기 전용', () => {
    mockQuery(CONNECTED)
    render(<SettingsTab d={{ ...base, isOwner: false }} />)
    expect(screen.getByText('playdata-encore/encore-lms-fe')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '변경사항 저장' })).toBeNull()
  })
})
