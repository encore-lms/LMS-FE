import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { NoticesPane } from './NoticesPane'
import {
  useDeleteCourseNotice,
  useDeleteNoticeAttachment,
  useStaffCourseNotices,
  useWriteCourseNotice,
  type NoticePost,
} from '@/shared/api'

vi.mock('@/shared/api', async (orig) => ({
  ...(await orig<typeof import('@/shared/api')>()),
  useStaffCourseNotices: vi.fn(),
  useWriteCourseNotice: vi.fn(),
  useDeleteCourseNotice: vi.fn(),
  useDeleteNoticeAttachment: vi.fn(),
  downloadNoticeAttachment: vi.fn().mockResolvedValue(undefined),
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
  links: [],
  files: [],
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
  vi.mocked(useDeleteNoticeAttachment).mockReturnValue({
    mutate: removeAttachment,
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteNoticeAttachment>)
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
              />
            }
          />
          <Route path="/notices/:noticeId" element={<div>공지 상세 화면</div>} />
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
  it('링크를 적어 공지를 올린다', async () => {
    const user = userEvent.setup()
    renderPane()

    await user.click(screen.getByRole('button', { name: '공지 작성' }))
    await user.type(screen.getByLabelText('공지 제목'), '2주차 특강')
    await user.type(screen.getByLabelText('공지 내용'), '금요일 19시')
    await user.type(screen.getByLabelText('링크 1'), 'https://playdata.io/guide')
    await user.click(screen.getByRole('button', { name: '올리기' }))

    expect(write).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '2주차 특강',
        content: '금요일 19시',
        urls: ['https://playdata.io/guide'],
      }),
      expect.anything(),
    )
  })

  // 빈 칸으로 남겨 둔 링크까지 보내면 목록에 빈 줄이 생긴다.
  it('빈 링크 칸은 보내지 않는다', async () => {
    const user = userEvent.setup()
    renderPane()

    await user.click(screen.getByRole('button', { name: '공지 작성' }))
    await user.type(screen.getByLabelText('공지 제목'), '제목')
    await user.type(screen.getByLabelText('공지 내용'), '내용')
    await user.click(screen.getByRole('button', { name: '올리기' }))

    expect(write).toHaveBeenCalledWith(
      expect.objectContaining({ urls: [] }),
      expect.anything(),
    )
  })

  it('링크 칸은 눌러서 늘리고 지운다', async () => {
    const user = userEvent.setup()
    renderPane()

    await user.click(screen.getByRole('button', { name: '공지 작성' }))
    await user.click(screen.getByRole('button', { name: '링크 추가' }))
    expect(screen.getByLabelText('링크 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '링크 2 삭제' }))
    expect(screen.queryByLabelText('링크 2')).not.toBeInTheDocument()
  })

  it('고른 파일을 요청에 함께 싣는다', async () => {
    const user = userEvent.setup()
    renderPane()

    await user.click(screen.getByRole('button', { name: '공지 작성' }))
    await user.type(screen.getByLabelText('공지 제목'), '제목')
    await user.type(screen.getByLabelText('공지 내용'), '내용')
    const file = new File(['본문'], '안내문.pdf', { type: 'application/pdf' })
    await user.upload(screen.getByLabelText('첨부 파일 선택'), file)
    expect(screen.getByText('안내문.pdf')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '올리기' }))

    expect(write).toHaveBeenCalledWith(
      expect.objectContaining({ files: [file] }),
      expect.anything(),
    )
  })

  it('올리기 전에 고른 파일을 뺄 수 있다', async () => {
    const user = userEvent.setup()
    renderPane()

    await user.click(screen.getByRole('button', { name: '공지 작성' }))
    const file = new File(['본문'], '안내문.pdf', { type: 'application/pdf' })
    await user.upload(screen.getByLabelText('첨부 파일 선택'), file)
    await user.click(screen.getByRole('button', { name: '안내문.pdf 빼기' }))

    expect(screen.queryByText('안내문.pdf')).not.toBeInTheDocument()
  })

  // 자료실과 같은 표 — 훑어보고 눌러 들어가는 흐름이라 카드를 표로 바꿨다.
  it('제목·첨부·작성자·등록일 열을 보여준다', () => {
    renderPane([notice()])

    const table = within(screen.getByRole('table'))
    expect(
      screen.getAllByRole('columnheader').map((el) => el.textContent),
    ).toEqual(['제목', '첨부', '작성자', '등록일', ''])
    expect(table.getByText('2주차 특강 안내')).toBeInTheDocument()
    expect(table.getByText('김강사')).toBeInTheDocument()
    expect(table.getByText('2026.07.29')).toBeInTheDocument()
  })

  it('첨부 개수를 링크·파일로 나눠 센다', () => {
    renderPane([
      notice({
        links: [{ id: 'l1', url: 'https://playdata.io' }],
        files: [
          { id: 'f1', fileName: '안내문.pdf', fileSize: 100 },
          { id: 'f2', fileName: '서식.docx', fileSize: 200 },
        ],
      }),
    ])

    expect(screen.getByText('링크 1 · 파일 2')).toBeInTheDocument()
  })

  it('첨부가 없으면 빈 칸으로 둔다', () => {
    renderPane([notice()])
    expect(within(screen.getByRole('table')).getByText('-')).toBeInTheDocument()
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

  // 남의 글은 지울 수 없다.
  it('지울 수 없는 공지에는 삭제 버튼이 없다', () => {
    renderPane([notice({ canDelete: false })])

    expect(
      screen.queryByRole('button', { name: '2주차 특강 안내 삭제' }),
    ).not.toBeInTheDocument()
  })
})
