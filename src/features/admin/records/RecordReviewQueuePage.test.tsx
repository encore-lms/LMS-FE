import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecordReviewQueuePage from './RecordReviewQueuePage'
import { useRecordReviewQueue } from '../api/records'
import type { RecordReviewQueue } from '@/shared/types'

vi.mock('../api/records')
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    danger: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    show: vi.fn(),
  }),
}))

type Hook = ReturnType<typeof useRecordReviewQueue>

const queue: RecordReviewQueue = {
  cohort: 'AI 캠프 22기',
  instructor: '김지훈',
  pendingTotal: 28,
  weekProcessed: 94,
  avgHours: 6.4,
  unassigned: 6,
  over24h: 3,
  changesRequested: 12,
  approvedToday: 18,
  payoutCandidates: 8,
  rejectedThisWeek: 5,
  byCategory: { blog: 14, study: 8, certificate: 6 },
  items: [
    {
      id: 'b1',
      student: { name: '김민준', cohort: '22기' },
      category: 'blog',
      title: 'Airflow 회고',
      summary: 'DAG 재시도 전략',
      externalUrl: 'velog.io/@minjune/x',
      body: ['문제 — DAG 17회 실패.', '해결 — X-Trace-Id 주입.'],
      submittedAt: '2026-05-19 09:42',
      status: 'pending',
      noteCount: 2,
      instructorNote: {
        instructor: '김지훈 강사',
        at: '05-19 10:14',
        body: '승인 권장.',
      },
      attachments: [{ name: 'a.png', meta: 'PNG · 480 KB' }],
    },
    {
      id: 's1',
      student: { name: '이서연', cohort: '22기' },
      category: 'study',
      title: 'NestJS 스터디',
      summary: 'GraphQL Code-first',
      body: ['활동 — 4명 코드 리뷰.'],
      submittedAt: '2026-05-19 08:18',
      status: 'pending',
      noteCount: 1,
      attachments: [],
    },
    {
      id: 'c1',
      student: { name: '박지훈', cohort: '22기' },
      category: 'certificate',
      title: '정보처리기사',
      summary: '실기 합격 / 지급 후보',
      body: ['자격명 — 정보처리기사(실기).'],
      submittedAt: '2026-05-18 17:30',
      status: 'pending',
      noteCount: 3,
      attachments: [],
      mileageCandidate: '지급 후보 +15,000',
    },
  ],
}

function mockHook(v: Partial<Hook>) {
  vi.mocked(useRecordReviewQueue).mockReturnValue(v as unknown as Hook)
}

describe('RecordReviewQueuePage', () => {
  it('히어로·KPI·테이블 행을 렌더한다', () => {
    mockHook({ data: queue, isPending: false, isError: false })
    render(<RecordReviewQueuePage />)
    expect(
      screen.getByRole('heading', { name: '학습 기록 검토 큐', level: 1 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('블로그·스터디·자격증 1차 검토 — 승인·반려·보완 요청'),
    ).toBeInTheDocument()
    expect(screen.getByText('김민준')).toBeInTheDocument()
    expect(screen.getByText('이서연')).toBeInTheDocument()
    expect(screen.getByText('박지훈')).toBeInTheDocument()
  })

  it('카테고리 탭으로 필터한다', async () => {
    mockHook({ data: queue, isPending: false, isError: false })
    const user = userEvent.setup()
    render(<RecordReviewQueuePage />)
    await user.click(screen.getByRole('button', { name: /블로그/ }))
    expect(screen.getByText('김민준')).toBeInTheDocument()
    expect(screen.queryByText('이서연')).not.toBeInTheDocument()
    expect(screen.queryByText('박지훈')).not.toBeInTheDocument()
  })

  it('검색으로 필터한다', async () => {
    mockHook({ data: queue, isPending: false, isError: false })
    const user = userEvent.setup()
    render(<RecordReviewQueuePage />)
    await user.type(screen.getByLabelText('학습 기록 검토 검색'), '박지훈')
    expect(screen.getByText('박지훈')).toBeInTheDocument()
    expect(screen.queryByText('김민준')).not.toBeInTheDocument()
  })

  it('첫 행을 자동 선택해 미리보기를 표시한다', () => {
    mockHook({ data: queue, isPending: false, isError: false })
    render(<RecordReviewQueuePage />)
    expect(screen.getByText('선택 행 미리보기')).toBeInTheDocument()
    // 자동 선택된 김민준(blog)의 강사 코멘트·외부 URL이 미리보기에 노출
    expect(
      screen.getByText('Record · BlogRecord · 강사 코멘트 표시'),
    ).toBeInTheDocument()
    expect(screen.getByText('velog.io/@minjune/x')).toBeInTheDocument()
    expect(screen.getByText(/승인 권장/)).toBeInTheDocument()
  })

  it('반려·보완 요청은 사유가 있어야 활성화되고 승인은 항상 가능하다', async () => {
    mockHook({ data: queue, isPending: false, isError: false })
    const user = userEvent.setup()
    render(<RecordReviewQueuePage />)
    expect(screen.getByRole('button', { name: '반려' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '보완 요청' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '승인' })).toBeEnabled()

    await user.type(screen.getByLabelText('결정 사유'), 'URL 점검 불일치')
    expect(screen.getByRole('button', { name: '반려' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '보완 요청' })).toBeEnabled()
  })

  it('로딩·에러 상태를 표시한다', () => {
    mockHook({ isPending: true })
    const { unmount } = render(<RecordReviewQueuePage />)
    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument()
    unmount()
    mockHook({ isPending: false, isError: true, refetch: vi.fn() })
    render(<RecordReviewQueuePage />)
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })
})
