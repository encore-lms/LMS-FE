import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { StudyForm } from './StudyForm'
import {
  useCreateStudyRecord,
  useUpdateStudyRecord,
  useUploadRecordAttachments,
} from '../../api/records'

vi.mock('../../api/records')

// QA: "스터디 임시저장 후 수정하면 활동 내역이 초기화된다."
// 수정 요청이 title·date 만 보내서, BE 가 받는 시간·활동 내역이 빈 값으로 덮였다.
const initial = {
  title: '알고리즘 스터디',
  date: '2026-07-01',
  startTime: '19:00',
  endTime: '21:00',
  body: '그래프 탐색 문제 풀이와 리뷰',
  files: [],
}

function renderEdit(update: ReturnType<typeof vi.fn>) {
  vi.mocked(useUpdateStudyRecord).mockReturnValue({
    mutate: update,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateStudyRecord>)
  vi.mocked(useCreateStudyRecord).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateStudyRecord>)
  vi.mocked(useUploadRecordAttachments).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  } as unknown as ReturnType<typeof useUploadRecordAttachments>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <StudyForm mode="edit" recordId="rec-1" initial={initial} />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('StudyForm 수정 저장', () => {
  it('활동 내역과 시간까지 함께 보낸다', async () => {
    const user = userEvent.setup()
    const update = vi.fn()
    renderEdit(update)

    await user.click(screen.getByRole('button', { name: /임시저장/ }))

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '알고리즘 스터디',
        body: '그래프 탐색 문제 풀이와 리뷰',
        startTime: '19:00',
        endTime: '21:00',
      }),
      expect.anything(),
    )
  })
})
