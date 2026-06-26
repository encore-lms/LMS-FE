import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import SettingsAuditPage from './SettingsAuditPage'
import { useSettingsAudit } from '../api/settings'
import type { SettingsAuditData } from './settingsAudit.types'

vi.mock('../api/settings')

const audit: SettingsAuditData = {
  summary: {
    total: 142,
    totalHint: '최근 30일',
    accounts: 38,
    accountsHint: '권한 부여·회수 포함',
    hrdKey: 12,
    hrdKeyHint: '등록·교체·폐기',
    courseConfig: 21,
    courseConfigHint: '기능 토글·정책',
    security: 4,
    securityHint: '실패·재시도 포함',
  },
  events: [
    {
      id: 'sa1',
      at: '05-27 09:05',
      actor: '김매니저',
      category: 'account',
      origin: '계정 관리',
      action: '강사 권한 부여',
      target: '이지훈 강사',
      result: 'success',
    },
    {
      id: 'sa3',
      at: '05-26 14:21',
      actor: '김매니저',
      category: 'hrd',
      origin: 'HRD API Key',
      action: '키 교체',
      target: 'prod-key-2026Q2',
      result: 'success',
    },
  ],
}

function ok(data: unknown) {
  return { data, isPending: false, isError: false }
}

function renderPage() {
  vi.mocked(useSettingsAudit).mockReturnValue(
    ok(audit) as unknown as ReturnType<typeof useSettingsAudit>,
  )
  return render(
    <ToastProvider>
      <MemoryRouter>
        <SettingsAuditPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('SettingsAuditPage', () => {
  it('설정 히어로·KPI·표를 렌더한다', () => {
    renderPage()
    expect(screen.getByText('설정 변경 감사 로그')).toBeInTheDocument()
    expect(screen.getByText('강사 권한 부여')).toBeInTheDocument()
    expect(screen.getByText('키 교체')).toBeInTheDocument()
    // 보존 기준 안내
    expect(screen.getByText('감사 로그 보존 기준')).toBeInTheDocument()
  })

  it('출처 필터(HRD API Key)는 해당 분류만 남긴다', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'HRD API Key' }))
    expect(screen.queryByText('강사 권한 부여')).not.toBeInTheDocument()
    expect(screen.getByText('키 교체')).toBeInTheDocument()
  })
})
