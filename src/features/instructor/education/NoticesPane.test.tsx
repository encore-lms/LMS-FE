import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
      <NoticesPane cohortId="cohort-32" />
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

  it('올라간 공지의 첨부를 지운다', async () => {
    const user = userEvent.setup()
    renderPane([
      notice({ files: [{ id: 'f1', fileName: '안내문.pdf', fileSize: 100 }] }),
    ])

    await user.click(
      screen.getByRole('button', { name: '안내문.pdf 첨부 삭제' }),
    )

    expect(removeAttachment).toHaveBeenCalledWith(
      { noticeId: 'n1', attachmentId: 'f1' },
      expect.anything(),
    )
  })

  // 남의 글은 첨부도 손대지 못한다.
  it('지울 수 없는 공지에는 첨부 삭제 버튼이 없다', () => {
    renderPane([
      notice({
        canDelete: false,
        files: [{ id: 'f1', fileName: '안내문.pdf', fileSize: 100 }],
      }),
    ])

    expect(
      screen.queryByRole('button', { name: '안내문.pdf 첨부 삭제' }),
    ).not.toBeInTheDocument()
  })
})
