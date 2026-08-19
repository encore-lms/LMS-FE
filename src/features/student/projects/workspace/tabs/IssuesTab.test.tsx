import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
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
  useDeleteTsCase: () => ({ mutate: vi.fn(), isPending: false }),
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

function Here() {
  const loc = useLocation()
  return <div data-testid="here">{loc.pathname + loc.search}</div>
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
      <MemoryRouter initialEntries={['/student/projects/p1?tab=issues']}>
        <ToastProvider>
          <Routes>
            <Route
              path="/student/projects/:id"
              element={<IssuesTab d={d} {...props} />}
            />
            {/* 이동한 곳을 그대로 찍어 확인한다 — 작성·열람 진입점이 이 탭의 핵심이다. */}
            <Route path="*" element={<Here />} />
          </Routes>
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

  // 게시판형 CRUD — 내 기록만 지울 수 있다.
  it('삭제는 내가 쓴 사례에만 뜬다', () => {
    renderTab([mine, teammates])

    expect(screen.getAllByRole('button', { name: '삭제' })).toHaveLength(1)
  })

  it('검토자는 연결 관리도 해제도 없이 목록만 본다', () => {
    renderTab([mine, teammates], { readOnly: true, onOpenCase: vi.fn() })

    expect(screen.getByText(teammates.title)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '트러블슈팅 관리' })).toBeNull()
    expect(screen.queryByRole('button', { name: '연결 해제' })).toBeNull()
  })

  // 작성은 프로젝트에서 시작한다 — 사례가 어느 프로젝트에서 나온 문제인지 함께 남아야 한다.
  it('[트러블슈팅 작성]은 이 프로젝트에 묶어 작성 화면으로 보낸다', async () => {
    const user = userEvent.setup()
    renderTab([])

    await user.click(screen.getByRole('button', { name: '트러블슈팅 작성' }))

    expect(screen.getByTestId('here')).toHaveTextContent(
      '/student/troubleshooting/new?projectId=p1',
    )
  })

  // 내 사례는 이어 쓰거나 인증을 요청해야 한다 — 보기 전용으로 열면 막다른 길이다.
  it('내 사례는 편집으로, 팀원 사례는 보기 전용으로 연다', async () => {
    const user = userEvent.setup()
    renderTab([mine])
    await user.click(screen.getByRole('button', { name: '이어 쓰기' }))
    expect(screen.getByTestId('here')).toHaveTextContent(
      '/student/troubleshooting/ts1',
    )
    expect(screen.getByTestId('here')).not.toHaveTextContent('view=1')
  })

  it('팀원 사례는 보기 전용으로 연다', async () => {
    const user = userEvent.setup()
    renderTab([teammates])
    await user.click(screen.getByRole('button', { name: '보기' }))
    expect(screen.getByTestId('here')).toHaveTextContent(
      '/student/troubleshooting/ts2?view=1',
    )
  })

  it('검토자가 [보기]를 누르면 넘겨받은 열람 함수를 부른다', async () => {
    const user = userEvent.setup()
    const onOpenCase = vi.fn()
    renderTab([teammates], { readOnly: true, onOpenCase })

    await user.click(screen.getByRole('button', { name: '보기' }))

    expect(onOpenCase).toHaveBeenCalledWith('ts2')
  })
})
