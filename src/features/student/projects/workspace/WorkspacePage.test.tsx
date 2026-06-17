import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import { useProjectWorkspace } from '../../api/projects'
import { mockWorkspace } from '../mocks'
import WorkspacePage from './WorkspacePage'

vi.mock('../../api/projects')

function renderPage(initialEntry = '/student/projects/p1') {
  vi.mocked(useProjectWorkspace).mockReturnValue({
    data: mockWorkspace,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useProjectWorkspace>)

  render(
    <ToastProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/student/projects/:projectId"
            element={<WorkspacePage />}
          />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('WorkspacePage home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('홈 배너와 지표 카드 액션으로 관련 탭으로 이동한다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '상호평가 작성' }))
    expect(screen.getByText('프로젝트 상호평가')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '홈' }))
    await user.click(screen.getByRole('button', { name: /열린 이슈/ }))
    expect(
      screen.getByRole('button', { name: '이슈 등록' }),
    ).toBeInTheDocument()
  })

  it('내 할 일 체크박스 상태를 토글한다', async () => {
    const user = userEvent.setup()
    renderPage()

    const checkbox = screen.getByRole('button', {
      name: '결제 실패 재시도 로직 구현 완료 전환',
    })
    await user.click(checkbox)

    expect(checkbox).toHaveTextContent('✓')
  })

  it('보드 작업 추가 모달로 새 작업을 목록에 추가한다', async () => {
    const user = userEvent.setup()
    renderPage('/student/projects/p1?tab=board')

    await user.click(screen.getByRole('button', { name: '작업 추가' }))
    await user.type(
      screen.getByPlaceholderText('작업 제목'),
      '결제 웹훅 재처리',
    )
    await user.type(screen.getByPlaceholderText('이름'), '김수강')
    await user.type(screen.getByPlaceholderText('D-3'), 'D-7')
    await user.click(screen.getByRole('button', { name: '추가' }))

    expect(screen.getByText('결제 웹훅 재처리')).toBeInTheDocument()
    expect(await screen.findByText('작업을 추가했습니다')).toBeInTheDocument()
  })

  it('캘린더 일정 추가 모달로 새 일정을 반영한다', async () => {
    const user = userEvent.setup()
    renderPage('/student/projects/p1?tab=calendar')

    await user.click(screen.getByRole('button', { name: '일정 추가' }))
    await user.clear(screen.getByRole('spinbutton'))
    await user.type(screen.getByRole('spinbutton'), '29')
    await user.type(screen.getByPlaceholderText('일정명'), '최종 리허설')
    await user.click(screen.getByRole('button', { name: '추가' }))

    expect(screen.getAllByText('최종 리허설').length).toBeGreaterThan(0)
    expect(await screen.findByText('일정을 추가했습니다')).toBeInTheDocument()
  })
})
