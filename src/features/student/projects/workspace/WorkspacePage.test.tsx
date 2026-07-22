import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import {
  useProjectWorkspace,
  useAddTask,
  useUpdateTaskStatus,
  useAddMeeting,
  useAddArtifact,
  useSubmitPeerEval,
  useSaveSelfReview,
  useRequestCertification,
  useAddSchedule,
  useAddMetric,
  useLinkTroubleshooting,
  useUnlinkTroubleshooting,
  useInviteMember,
  useRemoveMember,
} from '../../api/projects'
import { tsKeys } from '../../troubleshooting/queryKeys'
import { useProjectTsLinks } from '../../troubleshooting/projectLinks'
import { usePeers } from '../../api/peers'
import type { TsListData } from '../../troubleshooting/types'
import { mockWorkspace, mockWorkspaceP3 } from '../mocks'
import type { WorkspaceData } from '../types'
import WorkspacePage from './WorkspacePage'
import { useProjectFlow, type ProjectPhase } from './useProjectFlow'

vi.mock('../../api/projects')
vi.mock('../../api/peers')

// 이슈 탭이 useTsList로 읽는 트러블슈팅 목록 시드 — 인증 완료(ts1) + 작성 중(ts3).
const tsListSeed: TsListData = {
  stats: [],
  filters: [],
  statusFilters: [],
  shownLabel: '',
  cases: [
    {
      id: 'ts1',
      category: 'DB',
      categoryKey: 'DB',
      categoryTone: 'info',
      status: 'certified',
      statusLabel: '인증 완료',
      independent: true,
      days: '3일',
      accentTone: 'info',
      title: 'Kafka 컨슈머 리밸런싱으로 메시지 중복 처리',
      createdAt: '작성 2026-04-22',
      updatedAt: '수정 2026-05-10',
      situation: '상황',
      resolution: '해결',
      result: '결과',
      tags: ['#Kafka'],
      actionLabel: '사례 열기',
    },
    {
      id: 'ts3',
      category: 'DB',
      categoryKey: 'DB',
      categoryTone: 'info',
      status: 'draft',
      statusLabel: '작성 중',
      independent: false,
      days: '진행 중',
      accentTone: 'accent',
      title: 'Redis 캐시 stampede로 DB 부하 급증',
      createdAt: '작성 2026-05-13',
      updatedAt: '수정 2026-05-13',
      situation: '상황',
      resolution: '해결',
      result: '결과',
      tags: ['#Redis'],
      actionLabel: '이어 작성',
    },
  ],
}

function renderPage(
  initialEntry = '/student/projects/p1',
  data: WorkspaceData = mockWorkspace,
  phase?: ProjectPhase,
) {
  // 생애주기 시뮬레이션 단계를 테스트별로 고정(없으면 진입 시 상태에서 파생).
  useProjectFlow.setState({ phases: phase ? { [data.id]: phase } : {} })
  vi.mocked(useProjectWorkspace).mockReturnValue({
    data,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useProjectWorkspace>)
  const writeMock = {
    mutate: (_v: unknown, opts?: { onSuccess?: () => void }) =>
      opts?.onSuccess?.(),
    mutateAsync: async () => undefined,
    isPending: false,
  }
  vi.mocked(useAddTask).mockReturnValue(writeMock as never)
  vi.mocked(useUpdateTaskStatus).mockReturnValue(writeMock as never)
  vi.mocked(useAddMeeting).mockReturnValue(writeMock as never)
  vi.mocked(useAddArtifact).mockReturnValue(writeMock as never)
  vi.mocked(useSubmitPeerEval).mockReturnValue(writeMock as never)
  vi.mocked(useSaveSelfReview).mockReturnValue(writeMock as never)
  vi.mocked(useRequestCertification).mockReturnValue(writeMock as never)
  vi.mocked(useAddSchedule).mockReturnValue(writeMock as never)
  vi.mocked(useAddMetric).mockReturnValue(writeMock as never)
  vi.mocked(useLinkTroubleshooting).mockReturnValue(writeMock as never)
  vi.mocked(useUnlinkTroubleshooting).mockReturnValue(writeMock as never)
  vi.mocked(useInviteMember).mockReturnValue(writeMock as never)
  vi.mocked(useRemoveMember).mockReturnValue(writeMock as never)
  vi.mocked(usePeers).mockReturnValue({
    data: { items: [{ userId: 'u-os', name: '오세훈' }] },
  } as unknown as ReturnType<typeof usePeers>)

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  // 이슈 탭의 useTsList가 네트워크 없이 바로 데이터를 받도록 캐시 시드.
  queryClient.setQueryData<TsListData>(tsKeys.list(), tsListSeed)

  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route
              path="/student/projects/:projectId"
              element={<WorkspacePage />}
            />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('WorkspacePage home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 프로젝트↔트러블슈팅 연결 스토어 초기화(테스트 간 누수 방지).
    useProjectTsLinks.setState({ links: { p1: ['ts1'] } })
  })

  it('홈 배너와 지표 카드 액션으로 관련 탭으로 이동한다', async () => {
    const user = userEvent.setup()
    // 완료 배너는 완료 확정 이후에만 — reviewing 단계로 고정
    renderPage('/student/projects/p1', mockWorkspace, 'reviewing')

    await user.click(screen.getByRole('button', { name: '상호평가 작성' }))
    expect(screen.getByText('프로젝트 상호평가')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '홈' }))
    await user.click(screen.getByRole('button', { name: /열린 이슈/ }))
    expect(
      screen.getByRole('button', { name: '트러블슈팅 관리' }),
    ).toBeInTheDocument()
  })

  it('내 할 일 체크 시 작업을 완료 처리한다', async () => {
    const user = userEvent.setup()
    renderPage()

    const checkbox = screen.getByRole('button', {
      name: /PR 리뷰 완료 처리$/,
    })
    await user.click(checkbox)

    expect(
      await screen.findByText('작업을 완료 처리했습니다'),
    ).toBeInTheDocument()
  })

  it('보드 작업 추가 모달로 새 작업을 목록에 추가한다', async () => {
    const user = userEvent.setup()
    renderPage('/student/projects/p1?tab=board')

    await user.click(screen.getByRole('button', { name: '작업 추가' }))
    await user.type(
      screen.getByPlaceholderText('작업 제목'),
      '결제 웹훅 재처리',
    )
    // 담당자는 팀원 칩에서 선택(복수 가능). 시작/종료일은 기본값(오늘·다음날).
    const assigneeChip = screen.getByRole('button', { name: /박지호/ })
    await user.click(assigneeChip)
    expect(assigneeChip).toHaveTextContent('✓') // 선택 표시 반영 확인
    await user.click(screen.getByRole('button', { name: '추가' }))

    expect(await screen.findByText('작업을 추가했습니다')).toBeInTheDocument()
  })

  it('캘린더 일정 추가 모달로 새 일정을 반영한다', async () => {
    const user = userEvent.setup()
    renderPage('/student/projects/p1?tab=calendar')

    // 헤더 '일정 추가' → 오늘 날짜로 모달이 열린다(현재 월 기준).
    await user.click(screen.getByRole('button', { name: '일정 추가' }))
    await user.type(screen.getByPlaceholderText('내용'), '최종 리허설')
    await user.click(screen.getByRole('button', { name: '추가' }))

    expect(await screen.findByText('일정을 추가했습니다')).toBeInTheDocument()
  })

  it('회의록 작성 모달로 새 회의록을 목록에 추가한다', async () => {
    const user = userEvent.setup()
    renderPage('/student/projects/p1?tab=meetings')

    await user.click(screen.getByRole('button', { name: '회의록 작성' }))
    await user.type(
      screen.getByPlaceholderText('회의 제목'),
      '릴리즈 점검 회의',
    )
    await user.type(
      screen.getByPlaceholderText('결정 사항 또는 액션 아이템'),
      '릴리즈 전 인증 요청 자료를 점검했습니다.',
    )
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('회의록을 추가했습니다')).toBeInTheDocument()
  })

  it('문서 카테고리 필터와 문서 추가 액션을 반영한다', async () => {
    const user = userEvent.setup()
    renderPage('/student/projects/p1?tab=docs')

    await user.click(screen.getByRole('button', { name: '설계 문서' }))
    expect(screen.getByText('ERD 설계 문서')).toBeInTheDocument()
    expect(screen.queryByText('API 명세서 v2')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '문서 추가' }))
    await user.click(screen.getByLabelText('카테고리'))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('button', {
        name: '설계 문서',
      }),
    )
    await user.type(
      screen.getByPlaceholderText('문서 제목'),
      '릴리즈 체크리스트',
    )
    await user.click(screen.getByRole('button', { name: '추가' }))

    expect(await screen.findByText('문서를 추가했습니다')).toBeInTheDocument()
  })

  it('이슈 탭에서 인증 완료 트러블슈팅만 연결 후보로 뜨고 연결할 수 있다', async () => {
    const user = userEvent.setup()
    // 연결 없이 시작 — 빈 상태부터 검증.
    useProjectTsLinks.setState({ links: { p1: [] } })
    renderPage('/student/projects/p1?tab=issues')

    expect(
      screen.getByText('연결된 인증 트러블슈팅이 없어요'),
    ).toBeInTheDocument()

    // 연결 피커 — 인증 완료(ts1)만 후보, 작성 중(ts3)은 제외.
    await user.click(screen.getByRole('button', { name: '트러블슈팅 관리' }))
    expect(
      screen.getByText('Kafka 컨슈머 리밸런싱으로 메시지 중복 처리'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Redis 캐시 stampede로 DB 부하 급증'),
    ).not.toBeInTheDocument()

    // 연결 후 완료 — 연결된 카드로 노출.
    await user.click(
      screen.getByText('Kafka 컨슈머 리밸런싱으로 메시지 중복 처리'),
    )
    expect(
      await screen.findByText('트러블슈팅을 연결했어요'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '완료' }))
  })

  it('팀원 초대 모달로 새 팀원을 추가한다', async () => {
    const user = userEvent.setup()
    // 팀 관리는 설정 탭으로 이관됨 — 설정 탭에서 팀원 초대 확인
    renderPage('/student/projects/p1?tab=settings')

    await user.click(screen.getByRole('button', { name: '팀원 초대' }))
    // 같은 기수 동료 후보(usePeers mock) 중 선택 — 동료 선택 셀렉트
    await user.click(screen.getByLabelText('팀원 선택'))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('button', {
        name: '오세훈',
      }),
    )
    await user.click(screen.getByRole('button', { name: '초대' }))

    expect(
      await screen.findByText('오세훈 님을 초대했습니다'),
    ).toBeInTheDocument()
  })

  it('성과 지표 추가 모달로 새 지표를 추가한다', async () => {
    const user = userEvent.setup()
    renderPage('/student/projects/p1?tab=outcomes')

    await user.click(screen.getByRole('button', { name: '지표 추가' }))
    await user.type(screen.getByPlaceholderText('지표명'), '에러율')
    await user.type(screen.getByPlaceholderText('Before'), '3.2%')
    await user.type(screen.getByPlaceholderText('After'), '0.8%')
    await user.type(screen.getByPlaceholderText('+12%'), '-75%')
    await user.click(screen.getByRole('button', { name: '추가' }))

    expect(await screen.findByText('지표를 추가했습니다')).toBeInTheDocument()
  })

  it('상호평가 점수와 코멘트를 입력하고 제출한다', async () => {
    const user = userEvent.setup()
    renderPage('/student/projects/p1?tab=peer-evaluation')

    const score = screen.getByRole('slider', { name: /박지호 협업 점수/ })
    fireEvent.change(score, { target: { value: '5' } })
    await user.type(
      screen.getAllByPlaceholderText(/선택 코멘트/)[0],
      '협업 근거를 확인했습니다.',
    )
    await user.click(screen.getByRole('button', { name: '제출' }))

    expect(
      await screen.findByText('상호평가를 제출했습니다'),
    ).toBeInTheDocument()
    expect(screen.getByText('제출 완료')).toBeInTheDocument()
  })

  it('인증 요청은 체크리스트 완료 후 제출 상태로 전환한다', async () => {
    const user = userEvent.setup()
    // 인증 요청은 완료 확정(기간 종료) 이후에만 — completed 단계로 고정
    renderPage(
      '/student/projects/p3?tab=certification',
      mockWorkspaceP3,
      'completed',
    )

    await user.click(screen.getByRole('button', { name: '인증 요청 제출' }))
    expect(
      await screen.findByText('요청 전 체크리스트를 모두 완료해 주세요'),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: '성과 지표 3개 이상 등록 완료 전환' }),
    )
    await user.click(
      screen.getByRole('button', { name: '산출물 공개 범위 확인 완료 전환' }),
    )
    await user.click(screen.getByRole('button', { name: '인증 요청 제출' }))

    expect(
      await screen.findByText('인증 요청을 제출했습니다'),
    ).toBeInTheDocument()
    expect(screen.getByText('검토 중')).toBeInTheDocument()
  })
})
