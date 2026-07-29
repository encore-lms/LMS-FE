import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ReviewQueuePage from './ReviewQueuePage'
import { useReviewQueue } from './api'
import { usePageHeaderStore } from '@/shared/store'
import type { CertReviewQueue } from '@/shared/types'

vi.mock('./api')

type Hook = ReturnType<typeof useReviewQueue>

const queue: CertReviewQueue = {
  total: 167,
  byStatus: {
    requested: 24,
    reviewing: 8,
    changes_requested: 3,
    certified: 132,
  },
  unassigned: 6,
  riskFlagged: 5,
  myAssigned: 8,
  avgHours: 4.2,
  items: [
    {
      id: 'rv1',
      student: {
        name: '김민준',
        studentNo: '2024-AIB3-0027',
        cohort: 'AI 캠프 22기',
      },
      status: 'changes_requested',
      requestedAt: '05-17 14:32',
      assignee: '황설현',
      missingCount: 0,
      riskFlags: ['개인정보 위험'],
      latestReason: '이력서 마스킹 누락',
    },
    {
      id: 'rv2',
      student: {
        name: '이서연',
        studentNo: '2024-AIB3-0028',
        cohort: 'AI 캠프 22기',
      },
      status: 'reviewing',
      requestedAt: '05-16 09:11',
      assignee: '황설현',
      missingCount: 2,
      riskFlags: ['결측'],
      latestReason: '평판 미수집',
    },
    {
      id: 'rv4',
      student: {
        name: '최유진',
        studentNo: '2024-AIB3-0030',
        cohort: 'AI 캠프 22기',
      },
      status: 'requested',
      requestedAt: '05-19 08:42',
      assignee: null,
      missingCount: 0,
      riskFlags: [],
      latestReason: '없음',
    },
  ],
}

function mockHook(v: Partial<Hook>) {
  vi.mocked(useReviewQueue).mockReturnValue(v as unknown as Hook)
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ReviewQueuePage />
    </MemoryRouter>,
  )
}

describe('ReviewQueuePage', () => {
  it('히어로와 테이블 행을 렌더한다', () => {
    mockHook({ data: queue, isPending: false, isError: false })
    renderPage()
    // 제목은 본문이 아닌 공유 헤더(usePageHeader)에 등록된다.
    expect(usePageHeaderStore.getState().title).toBe('인증 검토 큐')
    expect(
      screen.getByText('정식 인증 요청을 분류·배정·검토합니다'),
    ).toBeInTheDocument()
    expect(screen.getByText('김민준')).toBeInTheDocument()
    expect(screen.getByText('이서연')).toBeInTheDocument()
    expect(screen.getByText('최유진')).toBeInTheDocument()
  })

  it('상태 탭으로 필터한다', async () => {
    mockHook({ data: queue, isPending: false, isError: false })
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /검토 중/ }))
    expect(screen.getByText('이서연')).toBeInTheDocument()
    expect(screen.queryByText('김민준')).not.toBeInTheDocument()
    expect(screen.queryByText('최유진')).not.toBeInTheDocument()
  })

  it('검색으로 필터한다', async () => {
    mockHook({ data: queue, isPending: false, isError: false })
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('검토 큐 검색'), '최유진')
    expect(screen.getByText('최유진')).toBeInTheDocument()
    expect(screen.queryByText('김민준')).not.toBeInTheDocument()
  })

  it('로딩·에러 상태를 표시한다', () => {
    mockHook({ isPending: true })
    const { unmount } = renderPage()
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    unmount()
    mockHook({ isPending: false, isError: true, refetch: vi.fn() })
    renderPage()
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })
})
