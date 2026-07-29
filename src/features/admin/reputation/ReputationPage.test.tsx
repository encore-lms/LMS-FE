import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import ReputationPage from './ReputationPage'
import {
  useMentorEvaluationDetail,
  useReputation,
  useReputationPush,
} from './api'
import type { MentorEvaluationDetail, ReputationOverview } from './types'

vi.mock('./api')
// 과정·기수 스코프 셀렉트가 쓰는 settings 훅 — QueryClient 없이 렌더되도록 정적 mock.
vi.mock('../api/settings', () => ({
  useCourseList: () => ({
    data: [{ courseId: 'course1', title: 'SK네트웍스 Family AI 캠프' }],
  }),
  useCourseConfig: () => ({
    data: {
      cohorts: [
        { id: 'c32', cohortNo: '32' },
        { id: 'c34', cohortNo: '34' },
      ],
    },
  }),
}))
// 담당 기수 우선 정렬·기본 선택용 — 담당 없음으로 두면 '전체 기수' 기본이 유지된다.
vi.mock('../api/dashboard', () => ({
  useMyCohorts: () => ({ data: [] }),
}))

// 평판 관리 — 히어로·KPI·수집 그리드 렌더 + 상태 필터 + 푸시 토스트.

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
      endorsementComment: '현업 기준으로도 손색없는 문제 해결력을 보여줬습니다.',
      mentorEvalStatus: 'recommended',
      mentorBy: '김효원',
      mentorScores: [5, 4, 5, 4, 5],
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
      mentorScores: [],
      peerCount: 3,
      peerTotal: 6,
      pushTargets: ['instructor', 'mentor', 'peer'],
    },
  ],
}

const mentorDetail: MentorEvaluationDetail = {
  hasTeam: true,
  teamName: '백엔드 1팀',
  mentorName: '김효원',
  evalStatus: 'recommended',
  evaluationSubmitted: true,
  axes: [
    { label: '기술', value: 5 },
    { label: '책임감', value: 4 },
    { label: '소통', value: 5 },
    { label: '성장', value: 4 },
    { label: '팀워크', value: 5 },
  ],
  comment: '실무 적응력이 뛰어납니다.',
  recommendation: 'recommended',
  recommendationSummary: '현업 즉시 투입 가능한 인재입니다.',
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
  vi.mocked(useMentorEvaluationDetail).mockReturnValue({
    data: mentorDetail,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useMentorEvaluationDetail>)
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

  // 회귀 — 기수를 골라도 조회 범위를 안 넘겨 전 기수(78명)가 집계되던 문제.
  it('조회 범위 — 선택한 기수를 서버 조회에 넘긴다', async () => {
    renderPage()
    const user = userEvent.setup()
    // 기본은 '전체 기수' — 선택 과정의 기수 전체가 범위.
    expect(vi.mocked(useReputation)).toHaveBeenLastCalledWith(['c32', 'c34'])

    await user.click(screen.getByLabelText('기수 필터'))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('button', { name: '34기' }),
    )
    expect(vi.mocked(useReputation)).toHaveBeenLastCalledWith(['c34'])
  })

  it('멘토 5축 점수를 테이블 행에 바로 보여준다', () => {
    renderPage()
    // 김민준(제출됨)은 5축 칩이 보이고, 박지훈(미제출)은 안 보인다.
    const kim = screen.getByText('김민준').closest('tr') as HTMLElement
    expect(within(kim).getByTitle('기술')).toHaveTextContent('5')
    expect(within(kim).getByTitle('팀워크')).toHaveTextContent('5')
    const park = screen.getByText('박지훈').closest('tr') as HTMLElement
    expect(within(park).queryByTitle('기술')).toBeNull()
  })

  it('멘토 필터 — 특정 멘토가 평가한 수강생만 남긴다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByLabelText('멘토 필터'))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('button', {
        name: '김효원',
      }),
    )
    // 둘 다 김효원 담당이라 유지된다(옵션이 실제 멘토명으로 뜨는지까지 검증).
    expect(screen.getByText('김민준')).toBeInTheDocument()
    expect(screen.getByText('박지훈')).toBeInTheDocument()
  })

  // 회귀 — 동료 대상 프로젝트가 없어 0/0 인 걸 '완료(초록 바)'처럼 보이던 문제.
  it('동료 5축 — 대상이 없으면(0/0) "대상 없음"으로 표시한다', () => {
    vi.mocked(useReputation).mockReturnValue({
      data: {
        ...overview,
        students: [{ ...overview.students[0], peerCount: 0, peerTotal: 0 }],
      },
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useReputation>)
    vi.mocked(useReputationPush).mockReturnValue({
      mutate: () => {},
    } as unknown as ReturnType<typeof useReputationPush>)
    render(
      <ToastProvider>
        <MemoryRouter>
          <ReputationPage />
        </MemoryRouter>
      </ToastProvider>,
    )
    expect(screen.getByText('대상 없음')).toBeInTheDocument()
    expect(screen.queryByText('0 / 0')).toBeNull()
  })

  // 회귀 — learning 미응답 시 전원 '미수집·0/0' 으로 보여 조회 실패를 못 알아챘다.
  it('조회 실패(degraded)면 동료·추천서 열에 "조회 실패"를 표시한다', () => {
    vi.mocked(useReputation).mockReturnValue({
      data: { ...overview, peerDegraded: true, endorsementDegraded: true },
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useReputation>)
    vi.mocked(useReputationPush).mockReturnValue({
      mutate: () => {},
    } as unknown as ReturnType<typeof useReputationPush>)
    render(
      <ToastProvider>
        <MemoryRouter>
          <ReputationPage />
        </MemoryRouter>
      </ToastProvider>,
    )
    // 두 학생 × 두 열 = 조회 실패 배지가 여러 개
    expect(screen.getAllByText('조회 실패').length).toBeGreaterThanOrEqual(2)
    // 대상 없음/0-0 과 혼동되지 않는다
    expect(screen.queryByText('대상 없음')).toBeNull()
  })

  it('평판 상세 — 행 데이터 기반 상세 모달을 연다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: '상세' })[0])
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('김민준 평판 상세')).toBeInTheDocument()
    expect(within(dialog).getByText('abc-1234')).toBeInTheDocument()
  })

  it('평판 상세 — 수집된 강사 추천서 문구를 보여준다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: '상세' })[0])
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('강사 추천서 내용')).toBeInTheDocument()
    expect(
      within(dialog).getByText(
        '현업 기준으로도 손색없는 문제 해결력을 보여줬습니다.',
      ),
    ).toBeInTheDocument()
  })

  it('평판 상세 — 행 아무 곳(이름 셀)을 클릭해도 상세 모달이 열린다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByText('김민준'))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('김민준 평판 상세')).toBeInTheDocument()
  })

  it('평판 행 클릭 — 액션 셀의 푸시 버튼 클릭은 상세를 함께 열지 않는다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: '강사 푸시 요청' })[0])
    // 푸시 확인 모달만 열리고 평판 상세 제목은 없어야 한다.
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).queryByText(/평판 상세/)).toBeNull()
  })

  it('평판 상세 — 멘토가 남긴 5축 점수·코멘트·추천 사유를 보여준다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: '상세' })[0])
    const dialog = screen.getByRole('dialog')
    // 멘토 평가 상세로 studentId를 넘겨 조회한다.
    expect(vi.mocked(useMentorEvaluationDetail)).toHaveBeenCalledWith('stu-1')
    // 5축 라벨·코멘트·추천 사유가 노출된다.
    expect(within(dialog).getByText('멘토 평가 내용')).toBeInTheDocument()
    expect(within(dialog).getByText('팀워크')).toBeInTheDocument()
    expect(
      within(dialog).getByText('실무 적응력이 뛰어납니다.'),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText('현업 즉시 투입 가능한 인재입니다.'),
    ).toBeInTheDocument()
  })
})
