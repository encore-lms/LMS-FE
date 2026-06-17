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

  it('회의록 작성 모달로 새 회의록을 목록에 추가한다', async () => {
    const user = userEvent.setup()
    renderPage('/student/projects/p1?tab=meetings')

    await user.click(screen.getByRole('button', { name: '회의록 작성' }))
    await user.type(
      screen.getByPlaceholderText('회의 제목'),
      '릴리즈 점검 회의',
    )
    await user.type(
      screen.getByPlaceholderText('결정 사항 또는 액션 아이템'),
      '릴리즈 전 인증 요청 자료를 점검했습니다.',
    )
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(screen.getByText('릴리즈 점검 회의')).toBeInTheDocument()
    expect(await screen.findByText('회의록을 작성했습니다')).toBeInTheDocument()
  })

  it('문서 카테고리 필터와 문서 추가 액션을 반영한다', async () => {
    const user = userEvent.setup()
    renderPage('/student/projects/p1?tab=docs')

    await user.click(screen.getByRole('button', { name: '설계 문서' }))
    expect(screen.getByText('ERD 설계 문서')).toBeInTheDocument()
    expect(screen.queryByText('API 명세서 v2')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '문서 추가' }))
    await user.selectOptions(screen.getByRole('combobox'), '설계 문서')
    await user.type(
      screen.getByPlaceholderText('문서 제목'),
      '릴리즈 체크리스트',
    )
    await user.click(screen.getByRole('button', { name: '추가' }))

    expect(screen.getByText('릴리즈 체크리스트')).toBeInTheDocument()
    expect(await screen.findByText('문서를 추가했습니다')).toBeInTheDocument()
  })

  it('이슈 등록 모달로 새 이슈를 목록에 추가한다', async () => {
    const user = userEvent.setup()
    renderPage('/student/projects/p1?tab=issues')

    await user.click(screen.getByRole('button', { name: '이슈 등록' }))
    await user.type(screen.getByPlaceholderText('이슈 제목'), 'Redis 연결 지연')
    await user.selectOptions(screen.getByRole('combobox'), 'P0')
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(screen.getByText('Redis 연결 지연')).toBeInTheDocument()
    expect(await screen.findByText('이슈를 등록했습니다')).toBeInTheDocument()
  })
})
