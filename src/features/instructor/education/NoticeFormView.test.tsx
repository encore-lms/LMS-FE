import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { NoticeFormView } from './NoticeFormView'
import {
  useEditCourseNotice,
  useStaffCourseNotices,
  useWriteCourseNotice,
} from '@/shared/api'

vi.mock('@/shared/api', async (orig) => ({
  ...(await orig<typeof import('@/shared/api')>()),
  useWriteCourseNotice: vi.fn(),
  useEditCourseNotice: vi.fn(),
  useStaffCourseNotices: vi.fn(),
  uploadEditorFile: vi.fn(),
  fetchLinkPreview: vi.fn(),
}))

// 작성은 모달이 아니라 페이지다 — 본문에 제목·목록·표·임베드를 넣다 보면 글이 길어지는데
// 좁은 상자 안에서는 쓴 글이 한눈에 들어오지 않는다.

const write = vi.fn()
const edit = vi.fn()

/** 수정 모드 검증용 기존 공지 — 서버 목록에서 찾아 폼을 채운다. */
const EXISTING = {
  id: 'n1',
  title: '원래 제목',
  content: '원래 내용',
  authorName: '김강사',
  authorRole: 'INSTRUCTOR',
  roleLabel: '강사',
  pinned: true,
  createdAt: '2026.08.01',
  timeAgo: '4일 전',
  canDelete: true,
  canEdit: true,
}

function renderForm(noticeId?: string) {
  vi.mocked(useWriteCourseNotice).mockReturnValue({
    mutate: write,
    isPending: false,
  } as unknown as ReturnType<typeof useWriteCourseNotice>)
  vi.mocked(useEditCourseNotice).mockReturnValue({
    mutate: edit,
    isPending: false,
  } as unknown as ReturnType<typeof useEditCourseNotice>)
  vi.mocked(useStaffCourseNotices).mockReturnValue({
    data: { notices: [EXISTING], canWrite: true },
  } as unknown as ReturnType<typeof useStaffCourseNotices>)
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/new']}>
        <Routes>
          <Route
            path="/new"
            element={
              <NoticeFormView
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

beforeEach(() => {
  write.mockReset()
  edit.mockReset()
})

describe('공지 작성 페이지', () => {
  it('제목·본문·고정을 담아 올린다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('공지 제목'), '2주차 특강')
    await user.click(screen.getByLabelText('공지 내용'))
    await user.keyboard('금요일 19시')
    await user.click(screen.getByLabelText('목록 맨 위에 고정'))
    await user.click(screen.getByRole('button', { name: '올리기' }))

    await waitFor(() =>
      expect(write).toHaveBeenCalledWith(
        expect.objectContaining({ title: '2주차 특강', pinned: true }),
        expect.anything(),
      ),
    )
    expect(write.mock.calls[0][0].content).toContain('금요일 19시')
  })

  it('올리면 목록으로 돌아간다', async () => {
    const user = userEvent.setup()
    write.mockImplementation((_v, opts) => opts?.onSuccess?.())
    renderForm()

    await user.type(screen.getByLabelText('공지 제목'), '제목')
    await user.click(screen.getByLabelText('공지 내용'))
    await user.keyboard('내용')
    await user.click(screen.getByRole('button', { name: '올리기' }))

    await waitFor(() =>
      expect(screen.getByText('공지 목록 화면')).toBeInTheDocument(),
    )
  })

  it('제목이 없으면 올리지 않는다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByLabelText('공지 내용'))
    await user.keyboard('내용만 있음')
    await user.click(screen.getByRole('button', { name: '올리기' }))

    expect(write).not.toHaveBeenCalled()
    expect(screen.getByText('제목을 입력해 주세요')).toBeInTheDocument()
  })

  it('내용이 없으면 올리지 않는다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('공지 제목'), '제목만 있음')
    await user.click(screen.getByRole('button', { name: '올리기' }))

    expect(write).not.toHaveBeenCalled()
    expect(screen.getByText('내용을 입력해 주세요')).toBeInTheDocument()
  })

  it('목록으로 돌아가는 길이 두 곳에 있다', () => {
    renderForm()

    expect(screen.getByRole('link', { name: /공지 목록/ })).toHaveAttribute(
      'href',
      '/hub?tab=notices',
    )
    expect(screen.getByRole('link', { name: '취소' })).toHaveAttribute(
      'href',
      '/hub?tab=notices',
    )
  })

  // 본문에 블록을 넣는 통로는 페이지에서도 그대로여야 한다.
  it('본문에서 슬래시 메뉴를 쓸 수 있다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByLabelText('공지 내용'))
    await user.keyboard('/')

    await waitFor(() =>
      expect(
        screen.getByRole('listbox', { name: '블록 고르기' }),
      ).toBeVisible(),
    )
  })

  // 오타 하나 때문에 지우고 다시 쓰지 않도록(2026-08-05 QA).
  it('수정 모드는 기존 값을 채워 열고 저장한다', async () => {
    const user = userEvent.setup()
    renderForm('n1')

    expect(screen.getByLabelText('공지 제목')).toHaveValue('원래 제목')
    expect(screen.getByLabelText('목록 맨 위에 고정')).toBeChecked()

    await user.clear(screen.getByLabelText('공지 제목'))
    await user.type(screen.getByLabelText('공지 제목'), '고친 제목')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(edit).toHaveBeenCalledWith(
        expect.objectContaining({ noticeId: 'n1', title: '고친 제목' }),
        expect.anything(),
      ),
    )
    expect(write).not.toHaveBeenCalled()
  })

  // 한 번 고정하면 영영 맨 위에 남던 문제 — 수정에서 풀 수 있어야 한다.
  it('수정에서 고정을 해제한다', async () => {
    const user = userEvent.setup()
    renderForm('n1')

    await user.click(screen.getByLabelText('목록 맨 위에 고정'))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(edit).toHaveBeenCalledWith(
        expect.objectContaining({ pinned: false }),
        expect.anything(),
      ),
    )
  })
})
