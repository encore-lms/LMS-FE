import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import PlayTypingPage from './PlayTypingPage'
import {
  usePlayTyping,
  useSubmitTypingResult,
  type TypingResultReceipt,
} from '../api/play'
import type { TypingSession } from './types'

vi.mock('../api/play')

// 타자 종료 시 결과가 서버로 제출되고, best 판정은 서버 응답을 따른다.

const session: TypingSession = {
  stats: [],
  level: '쉬움 · 5자',
  text: '가나다',
  sessionId: 'typing-live',
  promptName: '테스트 제시문',
  basis: 'Python 제시문',
  reward: '0P',
  durationSec: 180,
  personalBest: 999_999, // 클라 판정으로는 best가 될 수 없는 값
  otherPrompts: [],
}

const submitSpy = vi.fn(
  (
    _body: unknown,
    opts?: { onSuccess?: (r: TypingResultReceipt) => void },
  ) => opts?.onSuccess?.({ best: true, personalBest: 1, rank: 1 }),
)

function renderPage() {
  vi.mocked(usePlayTyping).mockReturnValue({
    data: session,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof usePlayTyping>)
  vi.mocked(useSubmitTypingResult).mockReturnValue({
    mutate: submitSpy,
  } as unknown as ReturnType<typeof useSubmitTypingResult>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <PlayTypingPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('PlayTypingPage 결과 제출', () => {
  it('제시문 완주 시 측정값을 서버에 제출하고 서버 best 판정을 쓴다', async () => {
    renderPage()
    const user = userEvent.setup()
    const box = screen.getByRole('textbox')
    await user.click(box)
    await user.type(box, '가나다') // 제시문 완주 → finished

    await waitFor(() => expect(submitSpy).toHaveBeenCalledTimes(1))
    expect(submitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        promptName: '테스트 제시문',
        durationSec: 180,
        accuracy: expect.any(Number),
        score: expect.any(Number),
      }),
      expect.anything(),
    )
    // 제출 응답 수신 후 결과 모달이 열린다(best 뱃지는 결과 페이지에서 서버 판정으로 표시).
    expect(await screen.findByText('서버 계산 결과')).toBeInTheDocument()
  })
})
