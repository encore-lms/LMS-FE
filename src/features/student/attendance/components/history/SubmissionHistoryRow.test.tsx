import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SubmissionHistoryRow } from './SubmissionHistoryRow'
import type { AttendanceFormSubmission } from '../../types'

// 지난 날짜를 뒤늦게 내는 일이 흔하다 — 출결 일자와 제출 일시가 다르다.
// 예전에는 제출 일시만 보여줘서, 같은 날 두 건을 낸 것처럼 보였다(날짜당 1건 규칙 오해).
const submission: AttendanceFormSubmission = {
  id: 'sub-1',
  studentId: 'stu-1',
  cohortId: 'co-1',
  targetDate: '2026-07-22',
  submittedAt: '2026-07-28T05:04:18Z',
  attendanceType: 'LATE',
  officialLeaveUsed: false,
  attachments: [],
} as unknown as AttendanceFormSubmission

function renderRow(v: AttendanceFormSubmission) {
  return render(
    <table>
      <tbody>
        <SubmissionHistoryRow submission={v} onEditAttachments={vi.fn()} />
      </tbody>
    </table>,
  )
}

describe('SubmissionHistoryRow', () => {
  it('출결 일자와 제출 일시를 함께 보여준다', () => {
    renderRow(submission)

    // 어느 날 출결인지가 먼저 보여야 한다.
    expect(screen.getByText('2026-07-22')).toBeInTheDocument()
    // 제출 시각도 남는다(뒤늦게 낸 것을 알 수 있게).
    expect(screen.getByText(/2026-07-28/)).toBeInTheDocument()
  })

  it('같은 날 제출한 서로 다른 날짜 건이 구분된다', () => {
    const { unmount } = renderRow(submission)
    expect(screen.getByText('2026-07-22')).toBeInTheDocument()
    unmount()

    renderRow({ ...submission, id: 'sub-2', targetDate: '2026-07-28' })
    expect(screen.getByText('2026-07-28')).toBeInTheDocument()
  })
})
