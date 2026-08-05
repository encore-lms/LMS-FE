import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import ProjectListPage from './ProjectListPage'
import {
  useAnswerInvitation,
  useDeleteProject,
  useProjectInvitations,
  useProjectList,
} from '../api/projects'
import { MAX_REPRESENTATIVES, useRepresentatives } from './representatives'
import type { ProjectListData, ProjectSummary } from './types'

// 교육과정 허브 탭바(2026-08-05) — 페이지 본문 테스트에 집중하도록 껍데기만 둔다.
vi.mock('../course/CourseTabs', () => ({ CourseTabs: () => null }))
// 허브 공통 헤더 훅(과정명/기간) — useQuery 의존이라 껍데기로 대체한다.
vi.mock('../course/useCourseHubHeader', () => ({
  useCourseHubHeader: () => {},
}))

vi.mock('../api/projects')

const data: ProjectListData = {
  headerTitle: '프로젝트 — 백엔드 부트캠프 · 3기',
  headerSub: '프로젝트 현황을 정리하세요.',
  stats: [
    {
      key: 'joined',
      label: '참여 프로젝트',
      value: '3',
      unit: '건',
      sub: '팀 2건 · 개인 1건',
      tone: 'brand',
    },
  ],
  filters: [
    { key: 'all', label: '전체', count: 3 },
    { key: 'certified', label: '인증 완료', count: 1 },
    { key: 'reviewing', label: '검토 중', count: 1 },
    { key: 'draft', label: '작성 중', count: 1 },
    { key: 'representative', label: '대표 후보', count: 1 },
  ],
  projects: [
    {
      id: 'p1',
      kind: 'team',
      kindLabel: '팀',
      status: 'certified',
      statusLabel: '인증 완료',
      representative: true,
      accentTone: 'success',
      title: '주문 관리 MSA 백엔드',
      pm: '예칼 PM',
      teamLabel: '팀 4명',
      period: '2026-04-01 ~ 2026-05-30 · 80일 · 종료',
      tags: ['Spring Boot', 'Kafka'],
      outcomes: ['Kafka 이벤트 라우팅'],
      actionLabel: '워크스페이스 열기',
    },
    {
      id: 'p2',
      kind: 'team',
      kindLabel: '팀',
      status: 'reviewing',
      statusLabel: '검토 중',
      representative: false,
      accentTone: 'warning',
      title: '실시간 채팅 서버',
      pm: '예칼 팀장',
      teamLabel: '팀 3명',
      period: '2026-03-20 ~ 2026-04-25 · 36일 · 종료',
      tags: ['WebSocket', 'Redis'],
      outcomes: ['동시 5천명 안정 운영'],
      actionLabel: '검토 상태 보기',
    },
    {
      id: 'p3',
      kind: 'personal',
      kindLabel: '개인',
      status: 'draft',
      statusLabel: '작성 중',
      representative: false,
      accentTone: 'accent',
      title: '포트폴리오 REST API',
      pm: '예칼 PM',
      teamLabel: '개인 프로젝트',
      period: '2026-05-02 ~ 진행 중 · 24일째 진행 중',
      tags: ['JPA', 'PostgreSQL'],
      outcomes: ['JWT 인증·인가'],
      actionLabel: '워크스페이스 열기',
    },
  ],
  shownLabel: '3건 모두 표시 · 인증 완료 1 / 검토 중 1 / 작성 중 1',
}

function LocationProbe() {
  const location = useLocation()
  return (
    <span data-testid="location">{location.pathname + location.search}</span>
  )
}

function renderPage(listData: ProjectListData = data) {
  const refetch = vi.fn()
  vi.mocked(useProjectList).mockReturnValue({
    data: listData,
    isPending: false,
    isError: false,
    refetch,
  } as unknown as ReturnType<typeof useProjectList>)
  vi.mocked(useDeleteProject).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteProject>)
  // 목록 위 '받은 초대' — 여기서는 초대가 없는 상태만 본다(초대 카드는 자기 테스트에서).
  vi.mocked(useProjectInvitations).mockReturnValue({
    data: [],
  } as unknown as ReturnType<typeof useProjectInvitations>)
  vi.mocked(useAnswerInvitation).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useAnswerInvitation>)

  render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/student/projects']}>
        <Routes>
          <Route path="/student/projects" element={<ProjectListPage />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

// 인증 완료 4건(대표 후보 최대 3 검증용) — 정렬·페이지네이션 영향 없이 단독 사용.
const certifiedData = (): ProjectListData => ({
  ...data,
  projects: ['c1', 'c2', 'c3', 'c4'].map(
    (id, i): ProjectSummary => ({
      id,
      kind: 'team',
      kindLabel: '팀',
      status: 'certified',
      statusLabel: '인증 완료',
      representative: false,
      accentTone: 'success',
      title: `인증 프로젝트 ${i + 1}`,
      pm: '예칼 PM',
      teamLabel: '팀 3명',
      period: `2026-0${i + 1}-01 ~ 2026-06-30 · 종료`,
      tags: ['Spring Boot'],
      outcomes: ['성과'],
      actionLabel: '워크스페이스 열기',
    }),
  ),
})

describe('ProjectListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 대표 후보 스토어 초기화(시드 p1) — 테스트 간 누수 방지.
    useRepresentatives.setState({ ids: ['p1'] })
  })

  it('프로젝트명·스택 검색어로 목록을 필터링한다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('프로젝트명·스택 검색'), 'Redis')

    expect(screen.getByText('실시간 채팅 서버')).toBeInTheDocument()
    expect(screen.queryByText('주문 관리 MSA 백엔드')).not.toBeInTheDocument()
    expect(screen.queryByText('포트폴리오 REST API')).not.toBeInTheDocument()
    expect(screen.getByText(/1건 표시/)).toBeInTheDocument()
  })

  it('상태 필터와 팀/개인 필터를 실제 목록에 반영한다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /검토 중/ }))

    expect(screen.getByText('실시간 채팅 서버')).toBeInTheDocument()
    expect(screen.queryByText('주문 관리 MSA 백엔드')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /개인/ }))

    expect(
      screen.getByText('조건에 맞는 프로젝트가 없어요'),
    ).toBeInTheDocument()
  })

  it('검토 중 프로젝트 CTA는 인증 요청 탭으로 이동한다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /검토 상태 보기/ }))

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/student/projects/p2?tab=certification',
    )
  })

  it('인증 완료 프로젝트만 대표 후보 별을 노출하고 토글로 해제한다', async () => {
    const user = userEvent.setup()
    renderPage()

    // 검토 중(p2)·작성 중(p3)은 별 토글이 없다.
    expect(
      screen.queryByRole('button', { name: /실시간 채팅 서버 대표 후보/ }),
    ).not.toBeInTheDocument()

    // 인증 완료(p1)는 별 노출 + 시드로 이미 대표 후보 → 해제 가능.
    await user.click(
      screen.getByRole('button', { name: /주문 관리 MSA 백엔드 대표 후보/ }),
    )
    expect(
      await screen.findByText(/대표 후보에서 해제했어요/),
    ).toBeInTheDocument()
  })

  it('대표 후보는 최대 3개까지만 지정된다', async () => {
    const user = userEvent.setup()
    useRepresentatives.setState({ ids: ['c1', 'c2', 'c3'] })
    renderPage(certifiedData())

    // 대표 3건(c1~c3)이 먼저, 비대표 c4는 2페이지에 위치.
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(
      screen.getByRole('button', { name: /인증 프로젝트 4 대표 후보 지정/ }),
    )

    expect(
      await screen.findByText(
        `대표 후보는 최대 ${MAX_REPRESENTATIVES}개까지 지정할 수 있어요`,
      ),
    ).toBeInTheDocument()
  })
})
