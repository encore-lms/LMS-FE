import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { NoticesPane } from './NoticesPane'
import {
  useDeleteCourseNotice,
  useStaffCourseNotices,
  useWriteCourseNotice,
  type NoticePost,
} from '@/shared/api'

vi.mock('@/shared/api', async (orig) => ({
  ...(await orig<typeof import('@/shared/api')>()),
  useStaffCourseNotices: vi.fn(),
  // 수강생 미러(2026-08-05 source='student' 추가) — 스태프 경로 테스트에선 꺼진 채 선언만 된다.
  useCourseNotices: () => ({
    data: undefined,
    isPending: false,
    isError: false,
    refetch: () => {},
  }),
  useWriteCourseNotice: vi.fn(),
  useDeleteCourseNotice: vi.fn(),
}))

// 공지에 담을 수 있는 게 제목·본문뿐이라 자료 링크나 안내문 파일을 붙일 자리가 없었다.
const write = vi.fn()
const removeAttachment = vi.fn()

const notice = (over: Partial<NoticePost> = {}): NoticePost => ({
  id: 'n1',
  title: '2주차 특강 안내',
  content: '금요일 19시, 3강의실.',
  authorName: '김강사',
  authorRole: 'INSTRUCTOR',
  roleLabel: '강사',
  pinned: false,
  createdAt: '2026.07.29',
  timeAgo: '2시간 전',
  canDelete: true,
  ...over,
})

function renderPane(notices: NoticePost[] = []) {
  vi.mocked(useStaffCourseNotices).mockReturnValue({
    data: { notices, canWrite: true },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useStaffCourseNotices>)
  vi.mocked(useWriteCourseNotice).mockReturnValue({
    mutate: write,
    isPending: false,
  } as unknown as ReturnType<typeof useWriteCourseNotice>)
  vi.mocked(useDeleteCourseNotice).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteCourseNotice>)
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/hub?tab=notices']}>
        <Routes>
          <Route
            path="/hub"
            element={
              <NoticesPane
                cohortId="cohort-32"
                detailPathOf={(id) => `/notices/${id}`}
                newPath="/notices/new"
              />
            }
          />
          <Route path="/notices/new" element={<div>공지 작성 화면</div>} />
          <Route
            path="/notices/:noticeId"
            element={<div>공지 상세 화면</div>}
          />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

beforeEach(() => {
  write.mockClear()
  removeAttachment.mockClear()
})

describe('강사·매니저 공지 관리', () => {
  // 자료실과 같은 표 — 훑어보고 눌러 들어가는 흐름이라 카드를 표로 바꿨다.
  it('제목·작성자·등록일 열을 보여준다', () => {
    renderPane([notice()])

    const table = within(screen.getByRole('table'))
    expect(
      screen.getAllByRole('columnheader').map((el) => el.textContent),
    ).toEqual(['제목', '작성자', '등록일', ''])
    expect(table.getByText('2주차 특강 안내')).toBeInTheDocument()
    expect(table.getByText('김강사')).toBeInTheDocument()
    expect(table.getByText('2026.07.29')).toBeInTheDocument()
  })

  // 행을 눌러 전문을 본다 — 목록은 본문을 한 줄 요약으로만 보여준다.
  it('행을 누르면 상세로 이동한다', async () => {
    const user = userEvent.setup()
    renderPane([notice()])

    await user.click(screen.getByText('2주차 특강 안내'))

    expect(screen.getByText('공지 상세 화면')).toBeInTheDocument()
  })

  // 행 전체가 상세로 가는 버튼이라, 안쪽 액션이 거기까지 번지면 안 된다.
  it('삭제 버튼을 눌러도 상세로 넘어가지 않는다', async () => {
    const user = userEvent.setup()
    renderPane([notice({ canDelete: true })])

    await user.click(
      screen.getByRole('button', { name: '2주차 특강 안내 삭제' }),
    )

    expect(screen.queryByText('공지 상세 화면')).not.toBeInTheDocument()
    expect(screen.getByText('공지를 삭제할까요?')).toBeInTheDocument()
  })

  // 공지가 쌓이면 훑어서 찾기 어렵다 — 자료실과 같은 검색 칸을 둔다.
  it('제목·본문·작성자로 걸러낸다', async () => {
    const user = userEvent.setup()
    renderPane([
      notice({ id: 'n1', title: '2주차 특강 안내' }),
      notice({ id: 'n2', title: '휴강 안내', content: '8월 18일 휴강' }),
      notice({ id: 'n3', title: '과제 공지', authorName: '박매니저' }),
    ])
    const table = () => within(screen.getByRole('table'))

    await user.type(screen.getByLabelText('공지 검색'), '휴강')
    expect(table().getByText('휴강 안내')).toBeInTheDocument()
    expect(table().queryByText('2주차 특강 안내')).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText('공지 검색'))
    await user.type(screen.getByLabelText('공지 검색'), '박매니저')
    expect(table().getByText('과제 공지')).toBeInTheDocument()
    expect(table().queryByText('휴강 안내')).not.toBeInTheDocument()
  })

  it('걸러낸 결과가 없으면 없다고 알린다', async () => {
    const user = userEvent.setup()
    renderPane([notice()])

    await user.type(screen.getByLabelText('공지 검색'), '없는말')

    expect(screen.getByText('조건에 맞는 공지가 없어요')).toBeInTheDocument()
  })

  // 남의 글은 지울 수 없다.
  it('지울 수 없는 공지에는 삭제 버튼이 없다', () => {
    renderPane([notice({ canDelete: false })])

    expect(
      screen.queryByRole('button', { name: '2주차 특강 안내 삭제' }),
    ).not.toBeInTheDocument()
  })

  // 작성은 모달이 아니라 별도 페이지다 — 본문이 길어지면 좁은 상자에서 쓰기 어렵다.
  it('공지 작성은 작성 페이지로 보낸다', async () => {
    const user = userEvent.setup()
    renderPane()

    await user.click(screen.getByRole('link', { name: '공지 작성' }))

    expect(screen.getByText('공지 작성 화면')).toBeInTheDocument()
  })
})
