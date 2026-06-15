import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import AuditLogPage from './AuditLogPage'
import { useAuditLog } from './api'
import type { AuditLogData } from './types'

vi.mock('./api')

// 감사 로그 — KPI·표·보존 기준 렌더 + 분류 필터 + CSV 토스트.

const overview: AuditLogData = {
  certificateId: 'CERT-1842',
  summary: {
    total: 28,
    totalHint: 'CERT-1842 기준',
    reviewActions: 9,
    reviewHint: '승인/보완 포함',
    publicChanges: 4,
    publicHint: 'URL/비공개 전환',
    martJobs: 6,
    martHint: '재계산 포함',
    securityEvents: 2,
    securityHint: '권한 확인',
  },
  events: [
    {
      id: 'a1',
      at: '05-19 09:32',
      actor: '이정훈',
      event: '정식 인증 승인',
      category: 'auth',
      target: 'CERT-1842',
      result: 'success',
      resultLabel: '성공',
      basis: '승인 모달',
    },
    {
      id: 'a2',
      at: '05-19 09:28',
      actor: '시스템',
      event: '마트 재계산',
      category: 'mart',
      target: 'StudentCertificateCandidateMart',
      result: 'success',
      resultLabel: '성공',
      basis: '작업 #MJ-43',
    },
  ],
}

function renderPage() {
  vi.mocked(useAuditLog).mockReturnValue({
    data: overview,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useAuditLog>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <AuditLogPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('AuditLogPage (감사 로그)', () => {
  it('KPI·이벤트 표·보존 기준을 렌더한다', () => {
    renderPage()
    expect(screen.getByText('28')).toBeInTheDocument()
    expect(screen.getByText('정식 인증 승인')).toBeInTheDocument()
    expect(
      screen.getByText('StudentCertificateCandidateMart'),
    ).toBeInTheDocument()
    expect(screen.getByText('감사 로그 보존 기준')).toBeInTheDocument()
  })

  it('인증 필터 — 인증 외 이벤트가 사라진다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '인증' }))
    expect(screen.getByText('정식 인증 승인')).toBeInTheDocument()
    expect(screen.queryByText('마트 재계산')).toBeNull()
  })

  it('CSV 내보내기 — 준비 중 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /CSV 내보내기/ }))
    expect(
      await screen.findByText('감사 로그 CSV 내보내기는 준비 중입니다.'),
    ).toBeInTheDocument()
  })
})
