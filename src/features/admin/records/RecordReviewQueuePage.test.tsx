import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import RecordReviewQueuePage from './RecordReviewQueuePage'
import { useRecordReviewAction, useRecordReviewQueue } from '../api/records'
import { usePageHeaderStore } from '@/shared/store'
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
type ActionHook = ReturnType<typeof useRecordReviewAction>

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

const mutate = vi.fn()

beforeEach(() => {
  mutate.mockClear()
  vi.mocked(useRecordReviewAction).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ActionHook)
})

function mockHook(v: Partial<Hook>) {
  vi.mocked(useRecordReviewQueue).mockReturnValue(v as unknown as Hook)
}

// '상세' 버튼 navigate 검증용 probe — 세그먼트 매핑까지 확인한다.
function DetailProbe() {
  const { segment, submissionId } = useParams()
  return (
    <div>
      상세 라우트 진입: {segment}/{submissionId}
    </div>
  )
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/records/review']}>
      <Routes>
        <Route
          path="/admin/records/review"
          element={<RecordReviewQueuePage />}
        />
        <Route
          path="/admin/records/:segment/:submissionId"
          element={<DetailProbe />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RecordReviewQueuePage', () => {
  it('히어로·KPI·테이블 행을 렌더한다', () => {
    mockHook({ data: queue, isPending: false, isError: false })
    renderPage()
    // 제목은 본문이 아닌 공유 헤더(usePageHeader)에 등록된다.
    expect(usePageHeaderStore.getState().title).toBe('학습 기록 검토 큐')
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
    renderPage()
    await user.click(screen.getByRole('button', { name: /블로그/ }))
    expect(screen.getByText('김민준')).toBeInTheDocument()
    expect(screen.queryByText('이서연')).not.toBeInTheDocument()
    expect(screen.queryByText('박지훈')).not.toBeInTheDocument()
  })

  it('검색으로 필터한다', async () => {
    mockHook({ data: queue, isPending: false, isError: false })
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('학습 기록 검토 검색'), '박지훈')
    expect(screen.getByText('박지훈')).toBeInTheDocument()
    expect(screen.queryByText('김민준')).not.toBeInTheDocument()
  })

  it('첫 행을 자동 선택해 미리보기를 표시한다', () => {
    mockHook({ data: queue, isPending: false, isError: false })
    renderPage()
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
    renderPage()
    expect(screen.getByRole('button', { name: '반려' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '보완 요청' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '승인' })).toBeEnabled()

    await user.type(screen.getByLabelText('결정 사유'), 'URL 점검 불일치')
    expect(screen.getByRole('button', { name: '반려' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '보완 요청' })).toBeEnabled()
  })

  it('결정 버튼이 검토 처리 mutation을 호출한다', async () => {
    mockHook({ data: queue, isPending: false, isError: false })
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('결정 사유'), '증빙 불충분')
    await user.click(screen.getByRole('button', { name: '반려' }))
    expect(mutate).toHaveBeenCalledWith(
      {
        recordId: 'b1',
        category: 'blog',
        decision: 'reject',
        payload: { studentVisibleComment: '증빙 불충분' },
      },
      expect.anything(),
    )
  })

  it('상세 버튼이 카테고리 세그먼트 상세 라우트로 이동한다(certificate→certificates)', async () => {
    mockHook({ data: queue, isPending: false, isError: false })
    const user = userEvent.setup()
    renderPage()
    const detailButtons = screen.getAllByRole('button', { name: '상세' })
    // 3번째 행 = certificate(c1) — /admin/records/certificates/c1
    await user.click(detailButtons[2])
    expect(
      screen.getByText('상세 라우트 진입: certificates/c1'),
    ).toBeInTheDocument()
  })

  it('로딩·에러 상태를 표시한다', () => {
    mockHook({ isPending: true })
    const { unmount } = renderPage()
    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument()
    unmount()
    mockHook({ isPending: false, isError: true, refetch: vi.fn() })
    renderPage()
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })
})
