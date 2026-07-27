import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import EndorsementsPage from './EndorsementsPage'
import EndorsementHistoryPage from './EndorsementHistoryPage'
import { useEndorsementQueue, useEndorsementHistory } from '../api/endorsements'
import { useCohortRoster } from '../api/console'
import { usePageHeaderStore } from '@/shared/store'
import type { EndorsementHistory, EndorsementQueue } from '@/shared/types'

vi.mock('../api/endorsements')
// 담당 기수 해소용 — 화면이 이 기수로 수강생 명단을 가져온다.
vi.mock('../api/console', () => ({
  useInstructorCohorts: () => ({
    data: { rows: [{ id: 'co1', name: 'DA 4기' }] },
  }),
  // 로스터는 콘솔 공용 훅으로 이동 — 테스트별로 vi.mocked(useCohortRoster)로 값 지정.
  useCohortRoster: vi.fn(),
}))
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
  // 이름 join·작성 대기 계산의 원천 — BE 는 userId 만 주므로 화면이 이 명단으로 채운다.
  vi.mocked(useCohortRoster).mockReturnValue({
    data: [
      { userId: 'st_yerin', name: '최예린' },
      { userId: 'st_dohyun', name: '윤도현' },
      { userId: 'st_jeongminseo', name: '정민서' },
    ],
  } as unknown as ReturnType<typeof useCohortRoster>)
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
    // 제목은 본문이 아닌 공유 헤더(usePageHeader)에 등록된다.
    expect(usePageHeaderStore.getState().title).toBe('강사 추천서')
    expect(screen.getAllByText('윤도현').length).toBeGreaterThan(0)
    // 명단은 전원을 세로로 보여준다 — 이미 추천서를 쓴 정민서는 명단 행(작성됨)과
    // '최근 작성' 두 곳에 나온다.
    expect(screen.getAllByText('정민서').length).toBeGreaterThan(0)
    expect(screen.getByText('작성됨')).toBeInTheDocument() // 정민서 행 배지
    expect(screen.getByText('작성 대기')).toBeInTheDocument()
    expect(screen.getByText('2건')).toBeInTheDocument() // 최예린·윤도현(정민서 제외)
    expect(screen.getByText('· 누적 1건')).toBeInTheDocument()
  })

  // 회귀 — 명단이 오기 전에 그려서 이름이 '(이름 미확인)', 작성 대기가 0건으로 깜빡였다.
  it('명단 로딩 중에는 이름 미확인·빈 작성 대기를 보여주지 않는다', () => {
    mockQueue({ data: queue, isPending: false, isError: false })
    vi.mocked(useCohortRoster).mockReturnValue({
      data: undefined,
      isPending: true,
    } as unknown as ReturnType<typeof useCohortRoster>)
    render(
      <MemoryRouter>
        <EndorsementsPage />
      </MemoryRouter>,
    )
    expect(screen.queryByText('(이름 미확인)')).toBeNull()
    expect(screen.queryByText('이 기수에 수강생이 없어요.')).toBeNull()
  })

  // 회귀 — 강사가 여러 기수를 담당하는데 큐(JWT 기수)와 명단(rows[0])이 서로 달라
  // 다른 기수 학생이면 이름이 '(이름 미확인)'이 됐다. 둘이 같은 기수를 봐야 한다.
  it('큐와 명단을 같은 기수로 조회한다', () => {
    mockQueue({ data: queue, isPending: false, isError: false })
    render(
      <MemoryRouter>
        <EndorsementsPage />
      </MemoryRouter>,
    )
    expect(vi.mocked(useEndorsementQueue)).toHaveBeenLastCalledWith('co1')
    expect(vi.mocked(useCohortRoster)).toHaveBeenLastCalledWith('co1')
  })

  // 작성 폼은 행의 '추천서 작성'을 눌러야 그 행 아래에서 열린다(자동 선택 없음).
  it('행에서 추천서 작성을 눌러야 폼이 열린다', async () => {
    mockQueue({ data: queue, isPending: false, isError: false })
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <EndorsementsPage />
      </MemoryRouter>,
    )
    expect(screen.queryByLabelText('추천 코멘트')).toBeNull()
    await user.click(screen.getAllByRole('button', { name: '추천서 작성' })[0])
    expect(screen.getByLabelText('추천 코멘트')).toBeInTheDocument()
    // 같은 버튼이 '접기'로 바뀌고, 다시 누르면 닫힌다.
    await user.click(screen.getByRole('button', { name: '접기' }))
    expect(screen.queryByLabelText('추천 코멘트')).toBeNull()
  })

  it('코멘트 없이 제출하면 검증 에러를 표시한다', async () => {
    mockQueue({ data: queue, isPending: false, isError: false })
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <EndorsementsPage />
      </MemoryRouter>,
    )
    await user.click(screen.getAllByRole('button', { name: '추천서 작성' })[0])
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
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
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
