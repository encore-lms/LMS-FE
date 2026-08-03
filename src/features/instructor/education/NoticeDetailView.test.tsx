import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { NoticeDetailView } from './NoticeDetailView'
import {
  useDeleteCourseNotice,
  useDeleteNoticeAttachment,
  useStaffCourseNotices,
  type NoticePost,
} from '@/shared/api'

vi.mock('@/shared/api', async (orig) => ({
  ...(await orig<typeof import('@/shared/api')>()),
  useStaffCourseNotices: vi.fn(),
  useDeleteCourseNotice: vi.fn(),
  useDeleteNoticeAttachment: vi.fn(),
  downloadNoticeAttachment: vi.fn().mockResolvedValue(undefined),
}))

// 공지 상세 — 목록 카드를 눌러 들어와 전문·첨부를 본다.
// 단건 API 없이 기수 목록에서 찾는다(목록 응답이 이미 본문·첨부를 담고 있다).

const remove = vi.fn()

const notice = (over: Partial<NoticePost> = {}): NoticePost => ({
  id: 'n1',
  title: '2주차 특강 안내',
  content: '금요일 19시,\n3강의실에서 진행합니다.',
  authorName: '김강사',
  authorRole: 'INSTRUCTOR',
  roleLabel: '강사',
  pinned: false,
  createdAt: '2026.08.03',
  timeAgo: '2시간 전',
  canDelete: true,
  links: [],
  files: [],
  ...over,
})

function renderDetail(notices: NoticePost[], noticeId = 'n1') {
  vi.mocked(useStaffCourseNotices).mockReturnValue({
    data: { notices, canWrite: true },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useStaffCourseNotices>)
  vi.mocked(useDeleteCourseNotice).mockReturnValue({
    mutate: remove,
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteCourseNotice>)
  vi.mocked(useDeleteNoticeAttachment).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteNoticeAttachment>)
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/detail']}>
        <Routes>
          <Route
            path="/detail"
            element={
              <NoticeDetailView
                cohortId="cohort-32"
                noticeId={noticeId}
                backTo="/hub?tab=notices"
              />
            }
          />
          <Route path="/hub" element={<div>공지 목록 화면</div>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

beforeEach(() => remove.mockClear())

describe('공지 상세', () => {
  it('제목과 본문 전문을 보여준다', () => {
    renderDetail([notice()])

    expect(screen.getByText('2주차 특강 안내')).toBeInTheDocument()
    expect(screen.getByText(/3강의실에서 진행합니다/)).toBeInTheDocument()
    expect(screen.getByText(/김강사/)).toBeInTheDocument()
  })

  // 첨부는 따로 모으지 않는다 — 파일·북마크는 본문 안에 있어 글의 흐름대로 읽힌다.
  it('본문에 넣은 파일·북마크를 그 자리에서 보여준다', () => {
    renderDetail([
      notice({
        content:
          '준비물\n\n[안내문.pdf](upload:u1 "file::2048")\n\n[네이버](https://naver.com "bookmark::검색 포털::::")',
      }),
    ])

    expect(screen.getByText('안내문.pdf')).toBeInTheDocument()
    expect(screen.getByText('2KB')).toBeInTheDocument()
    expect(screen.getByText('검색 포털')).toBeInTheDocument()
  })

  it('별도 첨부 섹션은 없다', () => {
    renderDetail([
      notice({ files: [{ id: 'f1', fileName: '옛첨부.pdf', fileSize: 10 }] }),
    ])

    expect(screen.queryByText('첨부')).not.toBeInTheDocument()
  })

  it('목록으로 돌아가는 링크가 있다', () => {
    renderDetail([notice()])
    expect(screen.getByRole('link', { name: /목록으로/ })).toHaveAttribute(
      'href',
      '/hub?tab=notices',
    )
  })

  // 본문은 마크다운으로 저장된다 — 기호가 글자로 남지 않고 실제 블록으로 그려져야 한다.
  it('마크다운 본문을 블록으로 그린다', () => {
    renderDetail([
      notice({
        content:
          '## 준비물\n\n- 노트북\n- 충전기\n\n| 일시 | 장소 |\n| --- | --- |\n| 금요일 | 3강의실 |',
      }),
    ])

    expect(
      screen.getByRole('heading', { name: '준비물', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('table')).toBeInTheDocument()
    // 기호가 그대로 남아 있으면 렌더가 아니라 평문이다.
    expect(screen.queryByText(/^## /)).not.toBeInTheDocument()
  })

  // 다른 사람이 지웠거나 주소를 직접 고쳐 들어온 경우.
  it('없는 공지면 찾을 수 없다고 알린다', () => {
    renderDetail([notice()], '없는-id')
    expect(screen.getByText('공지를 찾을 수 없어요')).toBeInTheDocument()
  })

  it('지울 수 없는 공지에는 삭제 버튼이 없다', () => {
    renderDetail([notice({ canDelete: false })])
    expect(
      screen.queryByRole('button', { name: /삭제/ }),
    ).not.toBeInTheDocument()
  })

  // 지운 글의 상세에 남아 있으면 '찾을 수 없어요'만 보인다.
  it('삭제하면 목록으로 돌려보낸다', async () => {
    const user = userEvent.setup()
    remove.mockImplementation((_id, opts) => opts?.onSuccess?.())
    renderDetail([notice()])

    await user.click(
      screen.getByRole('button', { name: '2주차 특강 안내 삭제' }),
    )
    await user.click(screen.getByRole('button', { name: '삭제' }))

    expect(remove).toHaveBeenCalledWith('n1', expect.anything())
    expect(screen.getByText('공지 목록 화면')).toBeInTheDocument()
  })
})
