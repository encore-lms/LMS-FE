import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/components/ui/Toast'
import { AttendanceIssueCell } from './AttendanceIssueCell'
import type { AttendanceIssue } from '@/shared/types'

// QA: "수강생이 증빙을 냈는데 운영에서 확인할 수 없다."
// 출결 목록에 이슈 칸이 아예 없어 폼도 증빙도 볼 자리가 없었다.
const issue: AttendanceIssue = {
  submissionId: 'sub-1',
  type: 'late',
  typeLabel: '지각',
  officialLeaveUsed: false,
  reason: '지하철 지연 — 예상 도착 10:30',
  submittedAt: '2026-07-28T05:04:00Z',
  attachments: [{ id: 'att-1', fileName: '지연증명서.pdf', fileSize: 12345 }],
}

function renderCell(v: AttendanceIssue | null) {
  return render(
    <ToastProvider>
      <AttendanceIssueCell issue={v} />
    </ToastProvider>,
  )
}

describe('AttendanceIssueCell', () => {
  it('출결 폼이 없으면 빈 칸으로 둔다', () => {
    renderCell(null)
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('유형은 칸에 바로 보인다', () => {
    renderCell(issue)
    expect(screen.getByText('지각')).toBeInTheDocument()
    // 사유는 아직 접혀 있다 — 목록이 길어지지 않게.
    expect(screen.queryByText(/지하철 지연/)).not.toBeInTheDocument()
  })

  it('아이콘에 마우스를 올리면 사유와 증빙이 열린다', async () => {
    const user = userEvent.setup()
    renderCell(issue)

    await user.hover(screen.getByRole('button', { name: '출결 폼 상세' }))

    expect(screen.getByText(/지하철 지연/)).toBeInTheDocument()
    expect(screen.getByText('증빙 1개')).toBeInTheDocument()
    expect(screen.getByText('지연증명서.pdf')).toBeInTheDocument()
  })

  it('증빙이 없으면 첨부 없음으로 알린다', async () => {
    const user = userEvent.setup()
    renderCell({ ...issue, attachments: [] })

    await user.hover(screen.getByRole('button', { name: '출결 폼 상세' }))

    expect(screen.getByText('첨부 없음')).toBeInTheDocument()
  })

  it('공가를 쓴 건은 따로 표시한다', () => {
    renderCell({ ...issue, officialLeaveUsed: true })
    expect(screen.getByText('공가')).toBeInTheDocument()
  })
})
