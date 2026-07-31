import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/components/ui/Toast'
import { AttendanceAttachmentLinks } from './AttendanceAttachmentLinks'
import { downloadAttendanceAttachment } from '@/shared/api/attendance'

vi.mock('@/shared/api/attendance', () => ({
  downloadAttendanceAttachment: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => vi.mocked(downloadAttendanceAttachment).mockClear())

const files = [{ id: 'att-1', fileName: '진단서.pdf', fileSize: 2048 }]

function renderLinks(v: typeof files, emptyText?: string) {
  render(
    <ToastProvider>
      <AttendanceAttachmentLinks files={v} emptyText={emptyText} />
    </ToastProvider>,
  )
}

describe('AttendanceAttachmentLinks', () => {
  it('증빙이 없으면 없다고 둔다', () => {
    renderLinks([])
    expect(screen.getByText('없음')).toBeInTheDocument()
  })

  it('파일 이름을 눌러 내려받는다', async () => {
    const user = userEvent.setup()
    renderLinks(files)

    await user.click(screen.getByRole('button', { name: '진단서.pdf 내려받기' }))

    // 운영 경로로 받아야 한다 — 수강생 경로는 BE 가 STUDENT 로 잠가 둬 매니저는 403.
    expect(downloadAttendanceAttachment).toHaveBeenCalledWith(
      'att-1',
      '진단서.pdf',
      'admin',
    )
  })
})
