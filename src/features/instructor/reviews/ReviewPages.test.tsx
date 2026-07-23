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
  useCertifyProject,
  useRequestProjectChanges,
  useCertifyTroubleshooting,
  useRequestTsChanges,
} from '../api/reviews'
import type {
  InstructorRecordReviewData,
  ProjectReviewData,
  TsReviewData,
} from '@/shared/types'

vi.mock('../api/reviews')

const student = { id: 's1', name: '김은진', birth: '1995-09-08' }
const records: InstructorRecordReviewData = {
  courses: [
    {
      id: 'skn',
      label: 'SK네트웍스 Family AI 캠프',
      cohorts: [
        { id: '29기', label: '29기' },
        { id: '28기', label: '28기' },
      ],
    },
  ],
  activeCourseId: 'skn',
  activeCohortId: '29기',
  weeks: [
    { no: 1, label: '3월 1주차' },
    { no: 2, label: '3월 2주차' },
  ],
  blog: [
    {
      student,
      cells: { 1: 'approved', 2: 'approved' },
      submissionIds: { 1: 'b1', 2: 'b2' },
      completed: 2,
      total: 26,
    },
  ],
  study: [
    {
      student,
      cells: { 1: 'approved' },
      submissionIds: { 1: 'st1' },
      streakWeeks: 7,
      mileagePaid: true,
    },
  ],
  cert: [
    {
      student,
      certs: { PCCE: 'approved', PCCP: 'none', PCSQL: 'none' },
      submissionIds: { PCCE: 'c1' },
      mileage: 25000,
      paid: true,
    },
  ],
  blogDetails: {
    b1: {
      studentName: '김은진',
      weekLabel: '3월 1주차',
      status: 'approved',
      url: 'https://blog.naver.com/skn29/1',
      submittedAt: '2026-03-02',
      managerComment: '승인 처리했습니다.',
    },
    b2: {
      studentName: '김은진',
      weekLabel: '3월 2주차',
      status: 'approved',
      url: 'https://blog.naver.com/skn29/2',
      submittedAt: '2026-03-09',
      managerComment: '승인 처리했습니다.',
    },
  },
  studyDetails: {
    st1: {
      studentName: '김은진',
      title: 'skn29기 예복습 스터디 1회차',
      status: 'approved',
      submittedAt: '2026-03-02',
      timeRange: '18:00 ~ 19:00',
      attachmentCount: 1,
      evidenceImageUrl: null,
      managerComment: '승인 처리했습니다.',
    },
  },
  certDetails: {
    c1: {
      studentName: '김은진',
      certType: 'PCCE',
      grade: 'Lv.1',
      status: 'approved',
      holderName: '김은진',
      acquiredAt: '2026-04-18',
      submittedAt: '2026-04-18',
      fileName: 'PCCE.png',
      url: 'https://cert.playdata.io/verify/pcce-skn29',
      evidenceImageUrl: null,
      mileage: 25000,
      mileageBreakdown: 'PCCE 25,000P',
      paid: true,
      managerComment: '승인 처리했습니다.',
    },
  },
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

// 자동 모킹(vi.mock)된 신규 mutation 훅에 기본 반환값 제공 — 미제공 시 undefined라
// 페이지의 certify.isPending / .mutate 접근에서 터진다(테스트는 query만 모킹).
const mutationStub = () =>
  ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  }) as unknown as ReturnType<typeof useCertifyProject>

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
  vi.mocked(useCertifyProject).mockReturnValue(mutationStub())
  vi.mocked(useRequestProjectChanges).mockReturnValue(
    mutationStub() as unknown as ReturnType<typeof useRequestProjectChanges>,
  )
  vi.mocked(useCertifyTroubleshooting).mockReturnValue(
    mutationStub() as unknown as ReturnType<typeof useCertifyTroubleshooting>,
  )
  vi.mocked(useRequestTsChanges).mockReturnValue(
    mutationStub() as unknown as ReturnType<typeof useRequestTsChanges>,
  )
  return render(
    <ToastProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ToastProvider>,
  )
}

describe('RecordReviewPage (§13)', () => {
  it('초기 조회는 서버 기본 필터로 요청한다', () => {
    renderWith(<RecordReviewPage />)
    expect(useRecordReviews).toHaveBeenNthCalledWith(1, 'none', 'none')
  })

  it('담당 과정·기수를 단일 고정으로 표시하고 조회 전용 안내를 렌더한다', () => {
    renderWith(<RecordReviewPage />)
    // 과정 드롭다운·기수 탭이 아닌 고정 텍스트로 표시(강사는 한 교육만 담당).
    expect(
      screen.getByText(/SK네트웍스 Family AI 캠프/),
    ).toBeInTheDocument()
    expect(screen.getByText('29기')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '29기' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('김은진')).toBeInTheDocument()
    expect(
      screen.getByText(/승인·반려·보완 요청은 운영 매니저/),
    ).toBeInTheDocument()
  })

  it('블로그 셀 클릭 시 조회 전용 상세 패널이 열린다', async () => {
    const user = userEvent.setup()
    renderWith(<RecordReviewPage />)
    await user.click(screen.getAllByTitle('승인')[0])
    expect(
      screen.getByRole('dialog', { name: '학습 기록 상세' }),
    ).toBeInTheDocument()
    expect(screen.getByText('운영 매니저 결정')).toBeInTheDocument()
    expect(screen.getByText(/강사는 조회만 가능/)).toBeInTheDocument()
  })

  it('자격증 탭은 자격증 매트릭스를 보여준다', async () => {
    const user = userEvent.setup()
    renderWith(<RecordReviewPage />)
    await user.click(screen.getByRole('button', { name: '자격증' }))
    expect(screen.getByText('PCCE')).toBeInTheDocument()
    expect(screen.getByText('지급 완료')).toBeInTheDocument()
  })
})

describe('ProjectReviewPage (§14)', () => {
  it('인증 요청 행은 primary [인증], 완료 행은 [결과]를 보여준다', () => {
    renderWith(<ProjectReviewPage />)
    expect(screen.getByText('팀 Nexus · 데이터 파이프라인')).toBeInTheDocument()
    const certifyBtn = screen.getByRole('button', { name: '인증' })
    expect(certifyBtn.className).toContain('bg-brand-deep')
    expect(screen.getByRole('button', { name: '결과' })).toBeInTheDocument()
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
