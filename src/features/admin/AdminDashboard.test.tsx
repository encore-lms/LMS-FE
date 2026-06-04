import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminDashboard from './AdminDashboard'
import { useAdminDashboard } from './api/dashboard'

vi.mock('./api/dashboard')

type DashboardHook = ReturnType<typeof useAdminDashboard>

describe('AdminDashboard', () => {
  it('요약 데이터를 KPI 카드로 렌더한다', () => {
    vi.mocked(useAdminDashboard).mockReturnValue({
      data: {
        certificationRequests: 12,
        reviewPending: 5,
        changesRequested: 3,
        mart: { state: 'stale', updatedAt: '2026-06-04T01:00:00Z' },
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as DashboardHook)

    render(<AdminDashboard />)
    expect(
      screen.getByRole('heading', { name: '운영 대시보드' }),
    ).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('갱신 필요')).toBeInTheDocument()
  })

  it('로딩 상태를 표시한다', () => {
    vi.mocked(useAdminDashboard).mockReturnValue({
      isPending: true,
    } as unknown as DashboardHook)
    render(<AdminDashboard />)
    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument()
  })

  it('에러 시 재시도 버튼을 표시한다', () => {
    vi.mocked(useAdminDashboard).mockReturnValue({
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    } as unknown as DashboardHook)
    render(<AdminDashboard />)
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })
})
