import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProjectWorkspace } from '../../api/projects'
import { mockWorkspace } from '../mocks'
import WorkspacePage from './WorkspacePage'

vi.mock('../../api/projects')

function renderPage() {
  vi.mocked(useProjectWorkspace).mockReturnValue({
    data: mockWorkspace,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useProjectWorkspace>)

  render(
    <MemoryRouter initialEntries={['/student/projects/p1']}>
      <Routes>
        <Route
          path="/student/projects/:projectId"
          element={<WorkspacePage />}
        />
      </Routes>
    </MemoryRouter>,
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
})
