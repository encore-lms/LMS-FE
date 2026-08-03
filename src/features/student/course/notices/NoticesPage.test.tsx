import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import NoticesPage from './NoticesPage'
import {
  useCourseNotices,
  useDeleteCourseNotice,
  type NoticePost,
} from '@/shared/api'

vi.mock('@/shared/api', async (orig) => ({
  ...(await orig()),
  useCourseNotices: vi.fn(),
  useDeleteCourseNotice: vi.fn(),
}))
vi.mock('../CourseTabs', () => ({ CourseTabs: () => null }))

// 수강생은 공지를 읽기만 한다 — 삭제 버튼은 서버가 canDelete 로 허락한 글에만 나온다.
const notice = (over: Partial<NoticePost> = {}): NoticePost => ({
  id: 'n1',
  title: '2주차 특강 안내',
  content: '금요일 19시, 3강의실에서 진행합니다.',
  authorName: '김강사',
  authorRole: 'INSTRUCTOR',
  roleLabel: '강사',
  pinned: false,
  createdAt: '2026.07.29',
  timeAgo: '2시간 전',
  canDelete: false,
  ...over,
})

function renderPage(notices: NoticePost[]) {
  vi.mocked(useCourseNotices).mockReturnValue({
    data: { notices, canWrite: false },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCourseNotices>)
  vi.mocked(useDeleteCourseNotice).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteCourseNotice>)
  render(
    <ToastProvider>
      <MemoryRouter>
        <NoticesPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('강의 홈 공지', () => {
  it('공지 제목과 본문을 보여준다', () => {
    renderPage([notice()])

    expect(screen.getByText('2주차 특강 안내')).toBeInTheDocument()
    expect(
      screen.getByText('금요일 19시, 3강의실에서 진행합니다.'),
    ).toBeInTheDocument()
    expect(screen.getByText('강사')).toBeInTheDocument()
  })

  it('지울 수 없는 공지에는 삭제 버튼이 없다', () => {
    renderPage([notice({ canDelete: false })])

    expect(
      screen.queryByRole('button', { name: /삭제/ }),
    ).not.toBeInTheDocument()
  })

  it('지울 수 있는 공지에만 삭제 버튼이 나온다', () => {
    renderPage([notice({ canDelete: true })])

    expect(
      screen.getByRole('button', { name: '2주차 특강 안내 삭제' }),
    ).toBeInTheDocument()
  })

  it('공지가 없으면 없다고 알려준다', () => {
    renderPage([])

    expect(screen.getByText('등록된 공지가 없어요')).toBeInTheDocument()
  })

  // 파일·북마크는 본문 안에 있다 — 카드로 그려진다.
  it('본문 안의 파일·북마크를 카드로 보여준다', () => {
    renderPage([
      notice({
        content: '[안내문.pdf](upload:u1 "file::2048")',
      }),
    ])

    expect(screen.getByText('안내문.pdf')).toBeInTheDocument()
    expect(screen.getByText('2KB')).toBeInTheDocument()
  })
})
