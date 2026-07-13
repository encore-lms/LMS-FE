import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import ReviewDetailPage from './ReviewDetailPage'
import { useReviewDetail } from './api'
import type { CertReviewDetail } from '@/shared/types'

vi.mock('./api')

type Hook = ReturnType<typeof useReviewDetail>

const detail: CertReviewDetail = {
  id: 'rev_8b2a',
  student: { name: '이서연', certId: 'def-5678', cohort: 'DA 5기' },
  status: 'reviewing',
  assignee: '황설현',
  requestedAt: '2026-05-16 09:11',
  martStale: true,
  martLastRefreshed: '2026-05-15 23:00',
  metrics: {
    trainingHours: 480,
    attendance: 0.962,
    quizAvg: 84.7,
    submissionRate: 0.91,
    submissionRaw: '32/35건',
  },
  skills: [
    { key: '기술', score: 82, confirmed: true },
    { key: '책임감', score: 76, confirmed: true },
  ],
  skillAvg: 81.7,
  payloadPreview: '{"student":"이서연"}',
  approvalChecks: [
    { key: 'profile', label: '프로필', detail: 'ok', pass: true },
    { key: 'metric', label: '핵심 지표', detail: 'ok', pass: true },
    { key: 'skill', label: '6축 점수', detail: 'ok', pass: true },
    { key: 'evidence', label: '대표 근거', detail: 'ok', pass: true },
    {
      key: 'mart',
      label: '원천 데이터 최신성',
      detail: '재계산 필요',
      pass: false,
    },
    { key: 'privacy', label: '개인정보', detail: 'ok', pass: true },
  ],
  riskFlags: [{ label: '결측', detail: '평판 항목 2개 미수집', count: 2 }],
  scoreEvidence: [{ skill: '기술 82점', basis: '프로젝트 v0.3 산출물' }],
  artifactApprovals: [
    { title: '프로젝트 v0.3', by: '강사 김지훈', status: 'approved' },
  ],
  auditLog: [{ at: '05-19 10:24', actor: '황설현', action: '검토 시작' }],
}

function mockHook(v: Partial<Hook>) {
  vi.mocked(useReviewDetail).mockReturnValue(v as unknown as Hook)
}

function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <ReviewDetailPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('ReviewDetailPage', () => {
  it('상세를 렌더하고 승인 미충족 시 승인 버튼을 비활성화한다', () => {
    mockHook({ data: detail, isPending: false, isError: false })
    renderPage()
    expect(screen.getByText('이서연')).toBeInTheDocument()
    expect(screen.getByText('480h')).toBeInTheDocument()
    expect(screen.getByText('5 / 6')).toBeInTheDocument()
    expect(screen.getByText('검토 큐로')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '정식 인증 승인' }),
    ).toBeDisabled()
  })

  it('탭 전환 시 종합 요약 외 탭은 준비 중 안내를 표시한다', async () => {
    mockHook({ data: detail, isPending: false, isError: false })
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('tab', { name: '프로젝트' }))
    expect(screen.getByText(/준비 중/)).toBeInTheDocument()
  })

  it('보완 요청 버튼이 모달을 연다', async () => {
    mockHook({ data: detail, isPending: false, isError: false })
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: '보완 요청' }))
    expect(screen.getByText('사유 코드')).toBeInTheDocument()
    expect(screen.getByText('missing_evidence')).toBeInTheDocument()
  })

  it('마트 재계산 실행 후 정식 인증 승인이 활성화된다', async () => {
    mockHook({ data: detail, isPending: false, isError: false })
    const user = userEvent.setup()
    renderPage()
    expect(
      screen.getByRole('button', { name: '정식 인증 승인' }),
    ).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /재계산 요청/ }))
    await user.click(screen.getByRole('button', { name: '재계산 실행' }))
    expect(screen.getByRole('button', { name: '정식 인증 승인' })).toBeEnabled()
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
