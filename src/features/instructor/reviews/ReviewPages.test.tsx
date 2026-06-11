import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import RecordReviewPage from './RecordReviewPage'
import ProjectReviewPage from './ProjectReviewPage'
import TsReviewPage from './TsReviewPage'
import {
  useRecordReviews,
  useProjectReviews,
  useTsReviews,
} from '../api/reviews'
import type {
  InstructorRecordReviewData,
  ProjectReviewData,
  TsReviewData,
} from '@/shared/types'

vi.mock('../api/reviews')

const records: InstructorRecordReviewData = {
  stats: [
    { label: '제출 현황', value: '14', unit: '건' },
    { label: '보완 요청 중', value: '3', unit: '건' },
    { label: '최근 승인', value: '8', unit: '건' },
    { label: '최근 반려', value: '2', unit: '건' },
  ],
  counts: { all: 32, blog: 12, study: 14, cert: 6 },
  rows: [
    {
      id: 'rr-1',
      studentName: '박지훈',
      cohortLabel: 'DA 4기',
      category: 'blog',
      title: '리액트 useMemo 실전 최적화',
      submittedAt: '05-17 21:14',
      status: 'pending',
      attachments: 1,
    },
    {
      id: 'rr-3',
      studentName: '이준영',
      cohortLabel: 'DA 4기',
      category: 'cert',
      title: '정보처리기사 필기 합격증',
      submittedAt: '05-16 14:30',
      status: 'changes_requested',
      attachments: 1,
    },
  ],
}

const projects: ProjectReviewData = {
  stats: [
    { label: '인증 요청 대기', value: '7', unit: '건' },
    { label: '보완 중', value: '4', unit: '건' },
    { label: '이번 달 인증', value: '12', unit: '건' },
    { label: '평균 검토 일수', value: '3.2', unit: '일' },
  ],
  counts: { all: 23, requested: 7, supplementing: 4, certified: 12 },
  rows: [
    {
      id: 'pr-1',
      name: '팀 Nexus · 데이터 파이프라인',
      cohortLabel: 'DA 4기',
      team: '5명 (PM 박지훈)',
      stack: 'Airflow · BigQuery · dbt',
      artifacts: 'GitHub · 발표',
      status: 'requested',
    },
    {
      id: 'pr-5',
      name: '팀 Quantum · 학습 기록 분석',
      cohortLabel: 'DA 4기',
      team: '5명 (PM 정민호)',
      stack: 'Streamlit · DuckDB',
      artifacts: 'GitHub · 발표',
      status: 'certified',
    },
  ],
}

const ts: TsReviewData = {
  stats: [
    { label: '검토 대기', value: '5', unit: '건' },
    { label: '독립해결 비율', value: '68', unit: '%' },
    { label: '평균 소요일수', value: '4.5', unit: '일' },
    { label: '이번 달 인증', value: '9', unit: '건' },
  ],
  counts: { all: 18, pending: 5, supplementing: 4, certified: 9 },
  rows: [
    {
      id: 'ts-1',
      studentName: '박지훈',
      cohortLabel: 'DA 4기',
      title: 'Airflow DAG 메모리 누수 추적',
      category: '성능최적화',
      solvedBy: '독립',
      durationDays: '3일',
      project: '팀 Nexus',
      status: 'pending',
    },
    {
      id: 'ts-3',
      studentName: '이준영',
      cohortLabel: 'DA 4기',
      title: 'RAG 임베딩 정확도 저하',
      category: '모델',
      solvedBy: '협업',
      durationDays: '7일',
      project: '팀 Aurora',
      status: 'supplementing',
    },
  ],
}

function ok(data: unknown) {
  return { data, isPending: false, isError: false }
}

function renderWith(ui: React.ReactElement) {
  vi.mocked(useRecordReviews).mockReturnValue(
    ok(records) as unknown as ReturnType<typeof useRecordReviews>,
  )
  vi.mocked(useProjectReviews).mockReturnValue(
    ok(projects) as unknown as ReturnType<typeof useProjectReviews>,
  )
  vi.mocked(useTsReviews).mockReturnValue(
    ok(ts) as unknown as ReturnType<typeof useTsReviews>,
  )
  return render(
    <ToastProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ToastProvider>,
  )
}

describe('RecordReviewPage (§13)', () => {
  it('KPI·카테고리 탭·조회 전용 안내를 렌더한다', () => {
    renderWith(<RecordReviewPage />)
    expect(screen.getByText('제출 현황')).toBeInTheDocument()
    expect(screen.getByText('리액트 useMemo 실전 최적화')).toBeInTheDocument()
    expect(
      screen.getByText(/승인·반려·보완 요청 처리는 운영 매니저/),
    ).toBeInTheDocument()
  })

  it('상태별 액션 분기 — 대기 [상세], 보완 요청 [확인][상세]', () => {
    renderWith(<RecordReviewPage />)
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument()
    // 대기 행은 단일 [상세], 보완 행은 [확인]+[상세] → 상세 총 2개
    expect(screen.getAllByRole('button', { name: '상세' }).length).toBe(2)
  })

  it('카테고리 탭은 해당 카테고리만 남긴다', async () => {
    const user = userEvent.setup()
    renderWith(<RecordReviewPage />)
    await user.click(screen.getByRole('button', { name: /자격증 \(6\)/ }))
    expect(screen.getByText('정보처리기사 필기 합격증')).toBeInTheDocument()
    expect(
      screen.queryByText('리액트 useMemo 실전 최적화'),
    ).not.toBeInTheDocument()
  })
})

describe('ProjectReviewPage (§14)', () => {
  it('인증 요청 행은 primary [인증], 완료 행은 [결과]를 보여준다', () => {
    renderWith(<ProjectReviewPage />)
    expect(screen.getByText('팀 Nexus · 데이터 파이프라인')).toBeInTheDocument()
    const certifyBtn = screen.getByRole('button', { name: '인증' })
    expect(certifyBtn.className).toContain('bg-brand-deep')
    expect(screen.getByRole('button', { name: '결과' })).toBeInTheDocument()
    expect(
      screen.getByText(/인증 후 학생 직접 수정은 차단됩니다/),
    ).toBeInTheDocument()
  })
})

describe('TsReviewPage (§15)', () => {
  it('독립해결·소요와 상태 탭 필터를 렌더한다', () => {
    renderWith(<TsReviewPage />)
    expect(screen.getByText('독립해결 비율')).toBeInTheDocument()
    expect(screen.getByText('Airflow DAG 메모리 누수 추적')).toBeInTheDocument()
    expect(screen.getByText('독립')).toBeInTheDocument()
  })

  it('보완 중 탭은 해당 사례만 남긴다', async () => {
    const user = userEvent.setup()
    renderWith(<TsReviewPage />)
    await user.click(screen.getByRole('button', { name: /보완 중 \(4\)/ }))
    expect(screen.getByText('RAG 임베딩 정확도 저하')).toBeInTheDocument()
    expect(
      screen.queryByText('Airflow DAG 메모리 누수 추적'),
    ).not.toBeInTheDocument()
  })
})
