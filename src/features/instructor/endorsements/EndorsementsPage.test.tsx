import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import EndorsementsPage from './EndorsementsPage'
import EndorsementHistoryPage from './EndorsementHistoryPage'
import { useEndorsementQueue, useEndorsementHistory } from '../api/endorsements'
import type { EndorsementHistory, EndorsementQueue } from '@/shared/types'

vi.mock('../api/endorsements')
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    danger: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    show: vi.fn(),
  }),
}))

type QueueHook = ReturnType<typeof useEndorsementQueue>
type HistoryHook = ReturnType<typeof useEndorsementHistory>

const queue: EndorsementQueue = {
  cohort: 'DA 4기',
  instructor: '김강사',
  pending: [
    {
      student: {
        id: 'st_yerin',
        name: '최예린',
        cohort: 'DA 4기',
        track: '데이터 분석',
      },
      observationMonths: 4,
      dueDays: 3,
    },
    {
      student: {
        id: 'st_dohyun',
        name: '윤도현',
        cohort: 'FE 7기',
        track: '프론트엔드',
      },
      observationMonths: 5,
      dueDays: 7,
    },
  ],
  recentTotal: 18,
  recent: [
    {
      id: 'en_jeongminseo',
      student: { id: 'st_jeongminseo', name: '정민서', cohort: 'DA 4기' },
      summary: '모델링 근거 정리',
      comment: '정민서는 모델링 근거를 잘 정리했습니다.',
      createdAt: '2026-05-12',
      snapshotStatus: 'snapshot_applied',
    },
  ],
}

const history: EndorsementHistory = {
  stats: { total: 14, thisMonth: 3, snapshotApplied: 8, pendingRefresh: 2 },
  items: [
    {
      id: 'en_a',
      student: { id: 'st_a', name: '박지훈', cohort: 'DA 4기' },
      summary: '모델링 근거 정리',
      comment: '박지훈은 모델링 근거를 잘 정리했습니다. 구체적 사례 포함.',
      createdAt: '2026-05-17',
      snapshotStatus: 'pending_refresh',
    },
    {
      id: 'en_b',
      student: { id: 'st_b', name: '김서연', cohort: 'DA 4기' },
      summary: '피드백 수용 관찰',
      comment: '김서연은 피드백을 잘 수용했습니다. 구체적 사례 포함.',
      createdAt: '2026-05-17',
      snapshotStatus: 'snapshot_applied',
    },
  ],
}

function mockQueue(v: Partial<QueueHook>) {
  vi.mocked(useEndorsementQueue).mockReturnValue(v as unknown as QueueHook)
}
function mockHistory(v: Partial<HistoryHook>) {
  vi.mocked(useEndorsementHistory).mockReturnValue(v as unknown as HistoryHook)
}

describe('EndorsementsPage', () => {
  it('작성 대기 카드와 최근 작성 추천서를 렌더한다', () => {
    mockQueue({ data: queue, isPending: false, isError: false })
    render(
      <MemoryRouter>
        <EndorsementsPage />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: '강사 추천서', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('윤도현').length).toBeGreaterThan(0)
    expect(screen.getByText('관찰 5개월')).toBeInTheDocument()
    expect(screen.getByText('정민서')).toBeInTheDocument()
    expect(screen.getByText('· 누적 18건')).toBeInTheDocument()
  })

  it('코멘트 없이 제출하면 검증 에러를 표시한다', async () => {
    mockQueue({ data: queue, isPending: false, isError: false })
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <EndorsementsPage />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: '제출' }))
    expect(
      await screen.findByText('추천 코멘트를 입력해주세요'),
    ).toBeInTheDocument()
  })

  it('로딩·에러 상태를 표시한다', () => {
    mockQueue({ isPending: true })
    const { unmount } = render(
      <MemoryRouter>
        <EndorsementsPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument()
    unmount()
    mockQueue({ isPending: false, isError: true, refetch: vi.fn() })
    render(
      <MemoryRouter>
        <EndorsementsPage />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })
})

describe('EndorsementHistoryPage', () => {
  it('KPI와 행을 렌더한다', () => {
    mockHistory({ data: history, isPending: false, isError: false })
    render(
      <MemoryRouter>
        <EndorsementHistoryPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('누적 추천서')).toBeInTheDocument()
    expect(screen.getByText('박지훈')).toBeInTheDocument()
    expect(screen.getByText('김서연')).toBeInTheDocument()
  })

  it('스냅샷 반영 필터로 거른다', async () => {
    mockHistory({ data: history, isPending: false, isError: false })
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <EndorsementHistoryPage />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: /스냅샷 반영/ }))
    expect(screen.getByText('김서연')).toBeInTheDocument()
    expect(screen.queryByText('박지훈')).not.toBeInTheDocument()
  })
})
