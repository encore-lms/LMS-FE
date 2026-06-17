import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProjectListPage from './ProjectListPage'
import { useProjectList } from '../api/projects'
import type { ProjectListData } from './types'

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

function renderPage() {
  const refetch = vi.fn()
  vi.mocked(useProjectList).mockReturnValue({
    data,
    isPending: false,
    isError: false,
    refetch,
  } as unknown as ReturnType<typeof useProjectList>)

  render(
    <MemoryRouter initialEntries={['/student/projects']}>
      <Routes>
        <Route path="/student/projects" element={<ProjectListPage />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProjectListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})
