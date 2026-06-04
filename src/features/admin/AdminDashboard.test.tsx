import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminDashboard from './AdminDashboard'
import { useAdminDashboard } from './api/dashboard'
import type { AdminDashboardSummary } from '@/shared/types'

vi.mock('./api/dashboard')

type DashboardHook = ReturnType<typeof useAdminDashboard>

const summary: AdminDashboardSummary = {
  status: { level: 'caution', message: '마트 오류 1건' },
  martUpdatedAt: '2026-05-18T06:00:00Z',
  kpis: {
    certificationRequests: { value: 24, newCount: 12, total: 24 },
    reviewing: { value: 8, avgDays: 1.8 },
    changesRequested: { value: 5, awaitingStudent: 3 },
    certified: { value: 142, monthDelta: 18 },
    martErrors: { value: 1 },
  },
  urgentReviews: [
    {
      id: 'u1',
      cohort: '데이터분석 6기',
      name: '김지원',
      detail: '인증 요청 · 5일 경과',
      isNew: true,
    },
  ],
  riskFlags: [
    {
      id: 'r1',
      cohort: '데이터분석 5기',
      name: '강유진',
      detail: '위험 플래그 4건 · 출결 미달',
    },
  ],
  quickEntry: [
    {
      key: 'review',
      title: '인증 검토 큐',
      meta: '대기 8건 · 평균 1.8일',
      to: '/admin/certification-review',
      cta: '인증 검토로 이동',
    },
  ],
}

function mockHook(value: Partial<DashboardHook>) {
  vi.mocked(useAdminDashboard).mockReturnValue(
    value as unknown as DashboardHook,
  )
}

function renderDash() {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>,
  )
}

describe('AdminDashboard', () => {
  it('KPI 5칸과 전체 상태 배지를 렌더한다', () => {
    mockHook({ data: summary, isPending: false, isError: false })
    renderDash()
    expect(
      screen.getByRole('heading', { name: '운영 대시보드', level: 1 }),
    ).toBeInTheDocument()
    // KPI 5칸 값
    for (const v of ['24', '8', '5', '142', '1']) {
      expect(screen.getByText(v)).toBeInTheDocument()
    }
    expect(screen.getByText('인증 완료')).toBeInTheDocument()
    expect(screen.getByText(/주의/)).toBeInTheDocument()
  })

  it('긴급 검토·위험 플래그·빠른 진입 항목을 렌더한다', () => {
    mockHook({ data: summary, isPending: false, isError: false })
    renderDash()
    expect(screen.getByText(/김지원/)).toBeInTheDocument()
    expect(screen.getByText(/강유진/)).toBeInTheDocument()
    expect(screen.getByText('인증 검토 큐')).toBeInTheDocument()
  })

  it('로딩 상태를 표시한다', () => {
    mockHook({ isPending: true })
    renderDash()
    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument()
  })

  it('에러 시 재시도 버튼을 표시한다', () => {
    mockHook({ isPending: false, isError: true, refetch: vi.fn() })
    renderDash()
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })
})
