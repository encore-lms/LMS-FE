import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import { mockWorkspace } from '../../mocks'
import type { WorkspaceData, WsTsCase } from '../../types'
import { IssuesTab } from './IssuesTab'

vi.mock('../../../api/projects')
// 연결 피커용 목록만 쓰는 훅 — 이 화면의 목록은 워크스페이스 응답에서 온다.
vi.mock('../../../api/troubleshooting', () => ({
  useTsList: () => ({ data: { cases: [] }, isPending: false }),
}))

/**
 * 연결된 트러블슈팅 목록.
 *
 * <p>예전에는 화면이 '내가 쓴 사례 목록'에서 id를 되찾아 그려, 같은 프로젝트인데도 팀원이
 * 연결한 사례는 서로 보이지 않았다. 이제 서버가 만든 목록(작성자 포함)을 그대로 그린다.</p>
 */
const mine: WsTsCase = {
  id: 'ts1',
  title: '환불 행 중복으로 결제 금액이 2배로 집계되던 문제',
  author: '황수빈',
  status: { label: '인증 완료', tone: 'success' },
  date: '2026.08.14',
  mine: true,
}
const teammates: WsTsCase = {
  id: 'ts2',
  title: 'XGBoost 학습이 로컬 메모리에서 터지던 문제',
  author: '김건우',
  status: { label: '인증 완료', tone: 'success' },
  date: '2026.08.16',
  mine: false,
}

function renderTab(
  cases: WsTsCase[],
  props: Partial<{ readOnly: boolean; onOpenCase: (id: string) => void }> = {},
) {
  const d: WorkspaceData = { ...mockWorkspace, troubleshootingCases: cases }
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <ToastProvider>
          <IssuesTab d={d} {...props} />
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('IssuesTab 연결된 트러블슈팅', () => {
  it('팀원이 연결한 사례도 작성자와 함께 보인다', () => {
    renderTab([mine, teammates])

    expect(screen.getByText(teammates.title)).toBeInTheDocument()
    expect(screen.getByText(/김건우/)).toBeInTheDocument()
    expect(screen.getByText(/황수빈 \(본인\)/)).toBeInTheDocument()
  })

  // 남의 사례를 프로젝트에서 걷어낼 수는 없다 — 열람만 열어 준 것이다.
  it('연결 해제는 내가 쓴 사례에만 뜬다', () => {
    renderTab([mine, teammates])

    expect(screen.getAllByRole('button', { name: '연결 해제' })).toHaveLength(1)
  })

  it('검토자는 연결 관리도 해제도 없이 목록만 본다', () => {
    renderTab([mine, teammates], { readOnly: true, onOpenCase: vi.fn() })

    expect(screen.getByText(teammates.title)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '트러블슈팅 관리' })).toBeNull()
    expect(screen.queryByRole('button', { name: '연결 해제' })).toBeNull()
  })

  it('검토자가 [보기]를 누르면 넘겨받은 열람 함수를 부른다', async () => {
    const user = userEvent.setup()
    const onOpenCase = vi.fn()
    renderTab([teammates], { readOnly: true, onOpenCase })

    await user.click(screen.getByRole('button', { name: '보기' }))

    expect(onOpenCase).toHaveBeenCalledWith('ts2')
  })
})
