import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import DirectPayPage from './DirectPayPage'
import { useDirectPayRoster, useDirectPaySubmit } from './api'
import type { DirectPayData } from './types'

vi.mock('./api')
vi.mock('../CohortScope', () => ({
  CohortScopeSelect: () => null,
}))

// 마일리지 직접 지급 — 폼/합계 렌더 + 지급 실행 → 확인 모달 → 결과 모달 흐름.

const overview: DirectPayData = {
  course: 'AI 캠프',
  cohortLabel: '22기',
  totalStudents: 121,
  nearLimitCount: 1,
  students: [
    {
      id: 'stu-1',
      name: '김민준',
      uuid: 'abc-1234',
      held: 82500,
      used: 42000,
      accrued: 124500,
    },
    {
      id: 'stu-2',
      name: '이서연',
      uuid: 'def-5678',
      held: 24200,
      used: 75800,
      accrued: 100000,
    },
    {
      id: 'stu-3',
      name: '박지훈',
      uuid: 'ghi-9012',
      held: 61000,
      used: 14000,
      accrued: 75000,
    },
    {
      id: 'stu-4',
      name: '최유진',
      uuid: 'jkl-3456',
      held: 97500,
      used: 7500,
      accrued: 105000,
      nearLimit: true,
    },
  ],
}

function renderPage() {
  vi.mocked(useDirectPayRoster).mockReturnValue({
    data: overview,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useDirectPayRoster>)
  vi.mocked(useDirectPaySubmit).mockReturnValue({
    mutate: (_vars: unknown, opts?: { onSuccess?: () => void }) =>
      opts?.onSuccess?.(),
  } as unknown as ReturnType<typeof useDirectPaySubmit>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <DirectPayPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('DirectPayPage (마일리지 직접 지급)', () => {
  it('빈 선택으로 시작하고, 전체 선택+사유 입력 시 합계(+200,000M · 4명)를 낸다', async () => {
    renderPage()
    const user = userEvent.setup()
    expect(screen.getByText('수강생 목록 · 다중 선택')).toBeInTheDocument()
    expect(screen.getByText('김민준')).toBeInTheDocument()
    expect(screen.getByText('상한 근접')).toBeInTheDocument()
    // 사전 선택 없음 — 실행 버튼은 0명 상태로 비활성
    const payButton = screen.getByRole('button', { name: /지급 실행/ })
    expect(payButton).toBeDisabled()
    // 전체 선택(헤더 체크박스) + 사유 입력 → 합계 갱신·활성
    await user.click(screen.getAllByRole('checkbox')[0])
    await user.type(screen.getByLabelText('사유'), '중간 발표 우수상')
    expect(
      screen.getByRole('button', { name: /지급 실행 — \+200,000M \/ 4명/ }),
    ).toBeEnabled()
  })

  it('전체 선택 → 실행 → 확인 모달 → 실행 → 결과 모달 흐름', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getAllByRole('checkbox')[0])
    await user.type(screen.getByLabelText('사유'), '중간 발표 우수상')
    await user.click(
      screen.getByRole('button', { name: /지급 실행 — \+200,000M \/ 4명/ }),
    )
    // 확인 모달(운영 액션 모달 공통)
    expect(screen.getByText('마일리지 지급 실행 확인')).toBeInTheDocument()
    expect(screen.getByText('1인 50,000M · 총 200,000M')).toBeInTheDocument()
    // 실행 → 결과 모달
    await user.click(screen.getByRole('button', { name: '실행' }))
    expect(screen.getByText('마일리지 지급 결과')).toBeInTheDocument()
    // 결과 행 — '200,000M · 4명'(부제·다음액션의 중복 문구 대신 고유 셀로 조회)
    expect(screen.getByText('200,000M · 4명')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '내역 보기' }),
    ).toBeInTheDocument()
  })
})
