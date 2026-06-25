import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminDashboard from './AdminDashboard'
import { useAdminDashboard } from './api/dashboard'
import type { AdminDashboardSummary } from '@/shared/types'

vi.mock('./api/dashboard')

type DashboardHook = ReturnType<typeof useAdminDashboard>

const summary: AdminDashboardSummary = {
  hero: {
    status: { level: 'normal', label: '운영 정상' },
    riskCount: 3,
    martUpdatedAt: '09:20',
    martNextAt: '09:50',
    todayPending: { value: 45, deltaLabel: '어제 대비 +6' },
    todayDone: { value: 12, avgLabel: '평균 처리 8분' },
  },
  kpis: [
    {
      key: 'request',
      label: '인증 요청',
      value: '18',
      delta: '+3',
      hint: '보완 요청 4건 포함',
      icon: 'request',
    },
    {
      key: 'certified',
      label: '인증 완료',
      value: '1,243',
      delta: '−4',
      hint: '누적 마지막 60일',
      icon: 'certified',
    },
    {
      key: 'mart',
      label: '마트 오류',
      value: '2',
      delta: '+2',
      hint: '재계산 필요',
      icon: 'mart',
    },
  ],
  queue: [
    {
      id: 'q1',
      priority: 'P0',
      type: '출결 이상',
      target: 'AI 백엔드 3기 김민준',
      status: 'HRD 퇴실 누락',
      due: '오늘',
      action: { label: '확인', to: '/admin/students' },
    },
    {
      id: 'q3',
      priority: 'P1',
      type: '기록실',
      target: 'Airflow 장애 회고',
      status: '승인 대기',
      due: '오늘',
      action: { label: '검토', to: '/admin/records/review' },
    },
  ],
  queueSummary: { total: 6, p0: 2, p1: 2, p2: 2 },
  risks: [{ title: 'HRD 원본 수정 불가', desc: '동기화 값은 읽기 전용' }],
  shortcuts: [
    {
      key: 'accounts',
      title: '사용자·권한',
      desc: '계정·역할·기수 관리',
      to: '/admin/settings',
      icon: 'accounts',
    },
  ],
  sync: [{ name: 'HRD-Net 수강생', at: '05-19 09:10', status: 'normal' }],
  decisionLog: [{ at: '09:20', text: '출결 이상 2건을 수동 확인으로 전환' }],
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

describe('AdminDashboard (통합 보강)', () => {
  it('히어로·KPI·우선순위 큐·바로가기·동기화·결정 로그를 렌더한다', () => {
    mockHook({ data: summary, isPending: false, isError: false })
    renderDash()
    expect(
      screen.getByText('오늘 처리할 운영 이슈를 한 화면에서 파악합니다'),
    ).toBeInTheDocument()
    expect(screen.getByText('운영 정상')).toBeInTheDocument()
    expect(screen.getByText('인증 요청')).toBeInTheDocument()
    expect(screen.getByText('1,243')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '긴급 검토 대상' }),
    ).toBeInTheDocument()
    expect(screen.getByText('AI 백엔드 3기 김민준')).toBeInTheDocument()
    expect(screen.getByText('사용자·권한')).toBeInTheDocument()
    expect(screen.getByText('데이터 동기화 상태')).toBeInTheDocument()
    expect(screen.getByText('우선순위 결정 로그')).toBeInTheDocument()
  })

  it('로딩·에러 상태를 표시한다', () => {
    mockHook({ isPending: true })
    const { unmount } = renderDash()
    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument()
    unmount()
    mockHook({ isPending: false, isError: true, refetch: vi.fn() })
    renderDash()
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })
})
