import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import IngestionQueuePage from './IngestionQueuePage'
import { useIngestionAction, useIngestionQueue } from './api'
import type { IngestionOverview } from './types'

vi.mock('./api')

// 인입 격리 큐 — 히어로·KPI·세션 표·세션 상세(기본 sess-1) 렌더 + 행 선택으로 상세 전환 + 액션 토스트.

const overview: IngestionOverview = {
  summary: {
    totalSessions: 42,
    totalSessionsHint: '최근 30일',
    successRows: 12847,
    successRowsHint: '총 인입의 96.4%',
    quarantinedRows: 483,
    inProgress: 1,
    inProgressHint: 'AI 캠프 22기 학생 명단',
  },
  sessions: [
    {
      id: 'sess-1',
      at: '05-19 09:42',
      domain: '학생 명단 (과거)',
      successRows: 1247,
      failedRows: 8,
      status: 'in_progress',
    },
    {
      id: 'sess-2',
      at: '05-18 16:30',
      domain: '프로젝트',
      successRows: 328,
      failedRows: 42,
      status: 'has_failure',
    },
  ],
  details: {
    'sess-1': {
      sessionId: 'sess-1',
      status: 'in_progress',
      summaryLine: '05-19 09:42 · 학생 명단 (과거) · 1,255행 중 8건 실패',
      categories: [{ id: 'dup', reason: '중복 UUID', count: 3 }],
      rows: [
        {
          id: 'r42',
          lineNo: 42,
          reason: '중복 UUID',
          detail: 'studentUuid abc-1234 (4행과 중복)',
        },
      ],
    },
    'sess-2': {
      sessionId: 'sess-2',
      status: 'has_failure',
      summaryLine: '05-18 16:30 · 프로젝트 · 370행 중 42건 실패',
      categories: [{ id: 'required', reason: '필수 컬럼 누락', count: 20 }],
      rows: [
        {
          id: 'r5',
          lineNo: 5,
          reason: '필수 컬럼 누락',
          detail: 'repoUrl 비어 있음',
        },
      ],
    },
  },
}

function renderPage() {
  vi.mocked(useIngestionQueue).mockReturnValue({
    data: overview,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useIngestionQueue>)
  vi.mocked(useIngestionAction).mockReturnValue({
    mutate: (_vars: unknown, opts?: { onSuccess?: () => void }) =>
      opts?.onSuccess?.(),
  } as unknown as ReturnType<typeof useIngestionAction>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <IngestionQueuePage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('IngestionQueuePage (인입 격리 큐)', () => {
  it('히어로 + KPI + 세션 표 + 기본 세션 상세(sess-1)를 렌더한다', () => {
    renderPage()
    expect(
      screen.getByText('CSV 대량 인입의 실패 행을 추적·수정·재시도합니다'),
    ).toBeInTheDocument()
    expect(screen.getByText('12,847')).toBeInTheDocument()
    expect(screen.getByText('483')).toBeInTheDocument()
    // 기본 상세 = 첫 세션
    expect(
      screen.getByText('05-19 09:42 · 학생 명단 (과거) · 1,255행 중 8건 실패'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('studentUuid abc-1234 (4행과 중복)'),
    ).toBeInTheDocument()
  })

  it('세션 행 클릭 — 우측 상세가 해당 세션으로 바뀐다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByText('05-18 16:30'))
    expect(
      screen.getByText('05-18 16:30 · 프로젝트 · 370행 중 42건 실패'),
    ).toBeInTheDocument()
    expect(screen.getByText('repoUrl 비어 있음')).toBeInTheDocument()
    expect(
      screen.queryByText(
        '05-19 09:42 · 학생 명단 (과거) · 1,255행 중 8건 실패',
      ),
    ).toBeNull()
  })

  it('실패 행 일괄 다운로드 — 준비 중 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(
      screen.getByRole('button', { name: /실패 행 일괄 다운로드/ }),
    )
    expect(
      await screen.findByText('실패 행 일괄 다운로드는 준비 중입니다.'),
    ).toBeInTheDocument()
  })

  it('재시도 — 확인 모달을 열고 확정 시 성공 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: '재시도' })[0])
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('세션 재시도')).toBeInTheDocument()
    expect(
      within(dialog).getByText('실패 행만 재인입 (성공 행 유지)'),
    ).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: '재시도' }))
    expect(
      await screen.findByText(/재시도 요청을 보냈습니다/),
    ).toBeInTheDocument()
  })
})
