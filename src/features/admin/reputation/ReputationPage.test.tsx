import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import ReputationPage from './ReputationPage'
import { useReputation, useReputationPush } from './api'
import type { ReputationOverview } from './types'

vi.mock('./api')

// 평판 관리 — 히어로·KPI·수집 그리드·푸시 흐름·정책 렌더 + 상태 필터 + 푸시 토스트.

const overview: ReputationOverview = {
  summary: {
    students: 121,
    cohortLabel: 'AI 캠프 22기',
    endorsements: 94,
    endorsementsHint: '수집됨 · 77.7%',
    mentorEval: '12 / 20',
    mentorEvalHint: 'N시간 완료 팀 한정',
    peerAxes: 612,
    peerAxesHint: '평균 5.05 · 6명',
    missingStudents: 38,
  },
  students: [
    {
      id: 'stu-1',
      name: '김민준',
      uuid: 'abc-1234',
      endorsementStatus: 'collected',
      endorsementBy: '김지훈 강사',
      mentorEvalStatus: 'recommended',
      mentorBy: '김효원',
      peerCount: 6,
      peerTotal: 6,
      pushTargets: [],
    },
    {
      id: 'stu-3',
      name: '박지훈',
      uuid: 'ghi-9012',
      endorsementStatus: 'not_collected',
      endorsementBy: '-',
      mentorEvalStatus: 'pending',
      mentorBy: '김효원',
      peerCount: 3,
      peerTotal: 6,
      pushTargets: ['instructor', 'mentor', 'peer'],
    },
  ],
  pushFlows: [
    {
      id: 'instructor',
      label: '강사 추천서',
      route: '/instructor/endorsements',
    },
    { id: 'peer', label: '프로젝트 상호평가' },
  ],
}

function renderPage() {
  vi.mocked(useReputation).mockReturnValue({
    data: overview,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useReputation>)
  vi.mocked(useReputationPush).mockReturnValue({
    mutate: (_vars: unknown, opts?: { onSuccess?: () => void }) =>
      opts?.onSuccess?.(),
  } as unknown as ReturnType<typeof useReputationPush>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <ReputationPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('ReputationPage (평판 관리)', () => {
  it('히어로 + KPI + 수집 그리드 + 정책을 렌더한다', () => {
    renderPage()
    expect(
      screen.getByText('수강생별 평판 수집 현황과 요청 푸시 추적'),
    ).toBeInTheDocument()
    // KPI
    expect(screen.getByText('12 / 20')).toBeInTheDocument()
    expect(screen.getByText('612')).toBeInTheDocument()
    // 그리드 행
    expect(screen.getByText('김민준')).toBeInTheDocument()
    expect(screen.getByText('abc-1234')).toBeInTheDocument()
    // 완료(푸시 없음) vs 푸시 버튼 — '완료'는 상태 필터 option 에도 있어 행 액션 span 스코프로 조회
    expect(screen.getByText('완료', { selector: 'span' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /강사 푸시/ }),
    ).toBeInTheDocument()
    // 정책
    expect(
      screen.getByText(/멘토 평가는 N시간 완료 또는 운영자 조기 종료 팀/),
    ).toBeInTheDocument()
  })

  it('상태 필터 — 완료만 보면 누락 수강생이 사라진다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByLabelText('상태 필터'))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('button', {
        name: '완료',
      }),
    )
    expect(screen.getByText('김민준')).toBeInTheDocument()
    expect(screen.queryByText('박지훈')).toBeNull()
  })

  it('일괄 요청 푸시 — 확인 모달을 거쳐 결과 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /일괄 요청 푸시/ }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('누락 일괄 요청 푸시')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: '일괄 푸시' }))
    expect(
      await screen.findByText('누락 38명에게 요청 푸시를 보냈습니다.'),
    ).toBeInTheDocument()
  })

  it('단건 강사 푸시 — 확인 모달을 거쳐 결과 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /강사 푸시/ }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('강사 푸시 요청')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: '푸시' }))
    expect(
      await screen.findByText('박지훈 강사 푸시 요청을 보냈습니다.'),
    ).toBeInTheDocument()
  })

  it('평판 상세 — 행 데이터 기반 상세 모달을 연다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: '상세' })[0])
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('김민준 평판 상세')).toBeInTheDocument()
    expect(within(dialog).getByText('abc-1234')).toBeInTheDocument()
  })
})
