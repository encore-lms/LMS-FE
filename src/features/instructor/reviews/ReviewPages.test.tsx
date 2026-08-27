import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import RecordReviewPage from './RecordReviewPage'
import ProjectReviewPage from './ProjectReviewPage'
import {
  useRecordReviews,
  useProjectReviews,
  useProjectReviewDetail,
  useTsReviewDetail,
  useCertifyProject,
  useRequestProjectChanges,
  useRevokeProjectCertification,
} from '../api/reviews'
import type {
  InstructorRecordReviewData,
  ProjectReviewData,
  ProjectReviewDetail,
} from '@/shared/types'

vi.mock('../api/reviews')
// 상세 패널·그리드의 이름 join 훅 — QueryClient 없이 동작하도록 기수 로스터를 고정 반환.
// 강사는 계정 목록(/users/students)이 막혀(403) 담당 기수 로스터로 실명을 붙인다.
// 기록실 그리드 뼈대이기도 하다 — s1(기록 있음)·stu-1(검토 상세 팀원) 둘을 명단에 둔다.
vi.mock('@/shared/api/students', () => ({
  useStudentAccounts: () => ({ data: undefined, isLoading: false }),
  useCohortRoster: () => ({
    data: [
      { userId: 's1', name: '김은진' },
      { userId: 'stu-1', name: '박지훈' },
    ],
    isLoading: false,
  }),
}))

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
  // 상세 패널 훅 — 기본은 미조회 상태(패널 닫힘). 패널 테스트에서 개별 override.
  vi.mocked(useProjectReviewDetail).mockReturnValue({
    data: undefined,
    isPending: true,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useProjectReviewDetail>)
  vi.mocked(useTsReviewDetail).mockReturnValue({
    data: undefined,
    isPending: true,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useTsReviewDetail>)
  vi.mocked(useCertifyProject).mockReturnValue(mutationStub())
  vi.mocked(useRequestProjectChanges).mockReturnValue(
    mutationStub() as unknown as ReturnType<typeof useRequestProjectChanges>,
  )
  vi.mocked(useRevokeProjectCertification).mockReturnValue(
    mutationStub() as unknown as ReturnType<
      typeof useRevokeProjectCertification
    >,
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
    expect(useRecordReviews).toHaveBeenNthCalledWith(
      1,
      'none',
      'none',
      'instructor',
    )
  })

  it('담당 과정·기수를 단일 고정으로 표시하고 조회 전용 안내를 렌더한다', () => {
    renderWith(<RecordReviewPage />)
    // 과정 드롭다운·기수 탭이 아닌 고정 텍스트로 표시(강사는 한 교육만 담당).
    expect(screen.getByText(/SK네트웍스 Family AI 캠프/)).toBeInTheDocument()
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
  it('목록에는 액션 버튼을 두지 않는다', () => {
    renderWith(<ProjectReviewPage />)
    expect(screen.getByText('팀 Nexus · 데이터 파이프라인')).toBeInTheDocument()
    // '결과'·'확인'·'상세'가 모두 같은 상세를 열어 구분이 되지 않았다 —
    // 액션은 상세 안 한 곳으로 모으고 목록에서는 없앴다.
    expect(screen.queryByRole('button', { name: '결과' })).toBeNull()
    expect(screen.queryByRole('button', { name: '상세' })).toBeNull()
    expect(screen.queryByRole('button', { name: '인증' })).toBeNull()
  })

  it('행을 클릭하면 검토 상세 패널이 열리고 인증 액션이 그 안에 있다', async () => {
    const detail: ProjectReviewDetail = {
      id: 'pr-1',
      name: '팀 Nexus · 데이터 파이프라인',
      cohortId: 'cohort-1',
      cohortLabel: 'DA 4기',
      status: 'requested',
      createdAt: '2026.06.01',
      updatedAt: '2026.07.18',
      requestedAt: '2026.07.15',
      certifiedAt: null,
      reviewComment: null,
      members: [{ userId: 'stu-1', role: 'LEADER' }],
      stack: ['Airflow', 'BigQuery'],
      artifacts: [
        {
          type: 'GitHub',
          title: '데이터 파이프라인 GitHub',
          url: 'https://github.com/example/repo',
          fileName: null,
        },
      ],
    }
    const user = userEvent.setup()
    renderWith(<ProjectReviewPage />)
    vi.mocked(useProjectReviewDetail).mockReturnValue({
      data: detail,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useProjectReviewDetail>)
    await user.click(screen.getByText('팀 Nexus · 데이터 파이프라인'))
    const dialog = screen.getByRole('dialog', { name: '검토 상세' })
    expect(dialog).toBeInTheDocument()
    // 인증 대기(requested) 행이므로 처리 액션이 상세 안에 노출된다.
    expect(
      within(dialog).getByRole('button', { name: '인증' }),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByRole('button', { name: '보완 요청' }),
    ).toBeInTheDocument()
    // 팀원 이름은 계정 join(stu-1 → 박지훈), 산출물·기술 스택 렌더 확인.
    expect(screen.getByText('박지훈')).toBeInTheDocument()
    expect(screen.getByText('BigQuery')).toBeInTheDocument()
    expect(screen.getByText('데이터 파이프라인 GitHub')).toBeInTheDocument()
  })
})
