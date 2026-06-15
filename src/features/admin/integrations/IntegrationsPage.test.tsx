import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import IntegrationsPage from './IntegrationsPage'
import { useIntegrations } from './api'
import type { IntegrationsData } from './types'

vi.mock('./api')

// 외부 연동 — KPI·연동 표·작업 표·운영 기준 렌더 + 필터 + 새로고침 토스트.

const overview: IntegrationsData = {
  summary: {
    normal: 4,
    normalHint: '최근 15분',
    warning: 2,
    warningHint: '권한 만료 임박',
    error: 1,
    errorHint: 'GitHub webhook',
    pendingJobs: 18,
    pendingHint: 'SyncJob',
    failureRate: '2.1%',
    failureHint: '24h',
  },
  integrations: [
    {
      id: 'notion',
      name: 'Notion',
      purpose: '문서/위키 백필',
      lastSync: '05-19 10:22',
      status: 'normal',
      statusLabel: '정상',
      owner: '운영 김',
      actionLabel: '수동 동기화',
    },
    {
      id: 'github',
      name: 'GitHub',
      purpose: '프로젝트 저장소',
      lastSync: '05-19 09:40',
      status: 'error',
      statusLabel: 'Webhook 오류',
      owner: '운영 이',
      actionLabel: '재연결',
    },
  ],
  jobs: [
    {
      id: 'j1',
      name: 'notion.sync',
      target: '문서 42건',
      status: 'done',
      nextRun: '15분 후',
    },
    {
      id: 'j2',
      name: 'github.webhook.replay',
      target: '이벤트 7건',
      status: 'failed',
      nextRun: '수동',
    },
  ],
}

function renderPage() {
  vi.mocked(useIntegrations).mockReturnValue({
    data: overview,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useIntegrations>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <IntegrationsPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('IntegrationsPage (외부 연동)', () => {
  it('KPI·연동 표·작업 표·운영 기준을 렌더한다', () => {
    renderPage()
    expect(screen.getByText('2.1%')).toBeInTheDocument()
    expect(screen.getByText('Notion')).toBeInTheDocument()
    expect(screen.getByText('Webhook 오류')).toBeInTheDocument()
    expect(screen.getByText('notion.sync')).toBeInTheDocument()
    expect(
      screen.getByText('토큰·Secret 값은 화면에 노출하지 않음'),
    ).toBeInTheDocument()
  })

  it('오류 필터 — 정상 연동이 사라진다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '오류' }))
    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.queryByText('Notion')).toBeNull()
  })

  it('연동 상태 새로고침 — 준비 중 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /연동 상태 새로고침/ }))
    expect(
      await screen.findByText('연동 상태 새로고침은 준비 중입니다.'),
    ).toBeInTheDocument()
  })
})
