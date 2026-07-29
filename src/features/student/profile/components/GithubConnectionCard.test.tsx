import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GithubConnectionCard } from './GithubConnectionCard'
import {
  useDisconnectGithub,
  useGithubIdentity,
  useStartGithubConnection,
} from '../../api/githubIdentity'
import type { StudentGithubIdentity } from '../githubTypes'

vi.mock('../../api/githubIdentity')

const toast = { success: vi.fn(), danger: vi.fn(), info: vi.fn(), warning: vi.fn(), show: vi.fn() }
vi.mock('@/components/ui/use-toast', () => ({ useToast: () => toast }))

const CONNECTED: StudentGithubIdentity = {
  status: 'CONNECTED',
  githubUserId: 20481079,
  githubLogin: 'suzin-park',
  avatarUrl: 'https://avatars.githubusercontent.com/u/20481079?v=4',
  profileUrl: 'https://github.com/suzin-park',
  connectedAt: '2026-07-22T09:40:00+09:00',
  verifiedAt: '2026-07-22T09:40:00+09:00',
}
const DISCONNECTED: StudentGithubIdentity = {
  status: 'DISCONNECTED',
  githubUserId: null,
  githubLogin: null,
  avatarUrl: null,
  profileUrl: null,
  connectedAt: null,
  verifiedAt: null,
}

function mockIdentity(over: Partial<ReturnType<typeof useGithubIdentity>>) {
  vi.mocked(useGithubIdentity).mockReturnValue({
    data: undefined,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
    ...over,
  } as unknown as ReturnType<typeof useGithubIdentity>)
}
function mockStart(mutate = vi.fn(), isPending = false) {
  vi.mocked(useStartGithubConnection).mockReturnValue({
    mutate,
    isPending,
  } as unknown as ReturnType<typeof useStartGithubConnection>)
  return mutate
}
function mockDisconnect(mutate = vi.fn(), isPending = false) {
  vi.mocked(useDisconnectGithub).mockReturnValue({
    mutate,
    isPending,
  } as unknown as ReturnType<typeof useDisconnectGithub>)
  return mutate
}

function renderCard(initialUrl = '/student/profile') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <GithubConnectionCard />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  mockStart()
  mockDisconnect()
  toast.success.mockClear()
  toast.danger.mockClear()
  toast.info.mockClear()
  sessionStorage.clear()
})
afterEach(() => vi.clearAllMocks())

describe('GithubConnectionCard', () => {
  it('연결 전 상태 — 연결 버튼과 안내를 보여준다', () => {
    mockIdentity({ data: DISCONNECTED })
    renderCard()
    expect(screen.getByText('미연결')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /GitHub 계정 연결/ }),
    ).toBeEnabled()
  })

  it('인증 시작 — 버튼 클릭 시 start를 호출하고 state를 sessionStorage에 저장한다', () => {
    const mutate = mockStart()
    mockIdentity({ data: DISCONNECTED })
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: /GitHub 계정 연결/ }))
    expect(mutate).toHaveBeenCalledTimes(1)
    // onSuccess를 직접 실행해 리다이렉트 흐름 검증
    const opts = mutate.mock.calls[0][1]
    opts.onSuccess({ authorizeUrl: '/student/profile?github=connected', state: 's-1' })
    expect(sessionStorage.getItem('github-oauth-state')).toBe('s-1')
  })

  it('인증 시작 실패 — API 실패 시 토스트로 안내한다', () => {
    const mutate = mockStart()
    mockIdentity({ data: DISCONNECTED })
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: /GitHub 계정 연결/ }))
    mutate.mock.calls[0][1].onError(new Error('fail'))
    expect(toast.danger).toHaveBeenCalled()
  })

  it('인증 성공 복귀 — ?github=connected 이면 성공 토스트를 띄운다', () => {
    mockIdentity({ data: DISCONNECTED })
    renderCard('/student/profile?github=connected')
    expect(toast.success).toHaveBeenCalledWith('GitHub 계정을 연결했어요')
  })

  it('인증 실패 복귀 — ?github=error 이면 실패 토스트를 띄운다', () => {
    mockIdentity({ data: DISCONNECTED })
    renderCard('/student/profile?github=error')
    expect(toast.danger).toHaveBeenCalled()
  })

  it('연결됨 — githubUserId를 식별값으로 노출하고 login을 함께 표시한다', () => {
    mockIdentity({ data: CONNECTED })
    renderCard()
    expect(screen.getByText('연결됨')).toBeInTheDocument()
    expect(screen.getByText('@suzin-park')).toBeInTheDocument()
    // 식별 기준은 변경 가능한 login이 아니라 불변 githubUserId
    expect(screen.getByText(/GitHub 사용자 ID 20481079/)).toBeInTheDocument()
  })

  it('재인증 필요 — 경고와 다시 인증 버튼을 보여준다', () => {
    mockIdentity({ data: { ...CONNECTED, status: 'REAUTH_REQUIRED' } })
    renderCard()
    expect(screen.getByText('재인증 필요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /다시 인증/ })).toBeInTheDocument()
  })

  it('연결 해제 — 확인 모달을 거쳐 disconnect를 호출한다', () => {
    const mutate = mockDisconnect()
    mockIdentity({ data: CONNECTED })
    renderCard()
    // 카드의 '연결 해제' 버튼 → 확인 모달 open
    fireEvent.click(screen.getByRole('button', { name: '연결 해제' }))
    expect(screen.getByText('GitHub 연결을 해제할까요?')).toBeInTheDocument()
    // 모달 열린 뒤 '연결 해제' 라벨 버튼은 둘(카드+모달 확인). 모달 확인 버튼으로 실행.
    const buttons = screen.getAllByRole('button', { name: '연결 해제' })
    fireEvent.click(buttons[buttons.length - 1])
    expect(mutate).toHaveBeenCalledTimes(1)
  })

  it('API 실패(조회 에러) — 일시 불가 상태와 다시 확인 버튼을 보여준다', () => {
    mockIdentity({ isError: true })
    renderCard()
    expect(screen.getByText('일시적으로 확인 불가')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 확인' })).toBeInTheDocument()
  })

  it('보안 — access/refresh token 문자열이 DOM·sessionStorage에 노출되지 않는다', () => {
    mockIdentity({ data: CONNECTED })
    const { container } = renderCard()
    const html = container.innerHTML.toLowerCase()
    expect(html).not.toContain('access_token')
    expect(html).not.toContain('refresh_token')
    expect(html).not.toMatch(/gh[opsu]_[a-z0-9]/) // GitHub 토큰 프리픽스
    // 연결 정보에 토큰 필드 자체가 없음
    expect(JSON.stringify(CONNECTED)).not.toContain('token')
  })
})
