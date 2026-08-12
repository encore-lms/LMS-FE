import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import NoticesPage from './NoticesPage'
import { useCourseNotices, type NoticePost } from '@/shared/api'

// 2026-08-05 — 매니저·강사 공지 한 벌(NoticesPane)을 읽기 전용으로 소비.
// 목록은 테이블(제목+평문 요약), 본문 전문·첨부는 상세 라우트가 담당한다.
vi.mock('@/shared/api', async (orig) => ({
  ...(await orig()),
  useCourseNotices: vi.fn(),
  // 스태프 미러 — 수강생 경로에선 꺼진 채 선언만 된다.
  useStaffCourseNotices: () => ({
    data: undefined,
    isPending: false,
    isError: false,
    refetch: () => {},
  }),
  useDeleteCourseNotice: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('../CourseTabs', () => ({ CourseTabs: () => null }))
// 허브 공통 헤더 훅(과정명/기간) — useQuery 의존이라 껍데기로 대체한다.
vi.mock('../useCourseHubHeader', () => ({ useCourseHubHeader: () => {} }))

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
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/student/course/notices']}>
        <Routes>
          <Route path="/student/course/notices" element={<NoticesPage />} />
          <Route
            path="/student/course/notices/:noticeId"
            element={<div>공지 상세 화면</div>}
          />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('교육과정 공지(수강생 읽기 전용)', () => {
  it('제목·요약·작성자를 표로 보여준다', () => {
    renderPage([notice()])

    expect(screen.getByText('2주차 특강 안내')).toBeInTheDocument()
    expect(
      screen.getByText('금요일 19시, 3강의실에서 진행합니다.'),
    ).toBeInTheDocument()
    expect(screen.getByText('김강사')).toBeInTheDocument()
    expect(screen.getByText('강사')).toBeInTheDocument()
  })

  it('읽기 전용 — 서버가 삭제를 허락해도 작성·삭제 UI가 없다', () => {
    renderPage([notice({ canDelete: true })])

    expect(screen.queryByRole('button', { name: /삭제/ })).toBeNull()
    expect(screen.queryByText('공지 작성')).toBeNull()
  })

  it('행을 누르면 상세로 이동한다', async () => {
    const user = userEvent.setup()
    renderPage([notice()])

    await user.click(screen.getByText('2주차 특강 안내'))
    expect(await screen.findByText('공지 상세 화면')).toBeInTheDocument()
  })

  it('공지가 없으면 없다고 알려준다', () => {
    renderPage([])

    expect(screen.getByText('등록된 공지가 없어요')).toBeInTheDocument()
    expect(
      screen.getByText('새 공지가 올라오면 여기에서 확인할 수 있어요.'),
    ).toBeInTheDocument()
  })

  it('검색 입력이 있다', () => {
    renderPage([notice()])

    expect(screen.getByLabelText('공지 검색')).toBeInTheDocument()
  })
})
