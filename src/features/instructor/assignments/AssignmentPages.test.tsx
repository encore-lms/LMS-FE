import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import AssignmentsPage from './AssignmentsPage'
import AssignmentFormPage from './AssignmentFormPage'
import SubmissionsPage from './SubmissionsPage'
import {
  useInstructorAssignments,
  useAssignmentDetail,
  useAssignmentSubmissions,
  useAssignmentCohortOptions,
  useSaveAssignment,
  useDeleteAssignment,
  useUploadAssignmentFile,
  useDeleteAssignmentFile,
  useChangeSubmissionStatus,
} from '../api/assignments'
import { useCohortRoster } from '../api/console'
import type {
  InstructorAssignmentListData,
  AssignmentFormDetail,
  AssignmentSubmissionsData,
} from '@/shared/types'

vi.mock('../api/assignments')
vi.mock('../api/console')

const changeStatusMutate = vi.fn()

// 실 BE shape — createdByUserId·badgeStatus/badgeCount·studentUserId(이름은 FE join)
const assignmentList: InstructorAssignmentListData = {
  total: 2,
  kpi: {
    submitted: 21,
    notSubmitted: 7,
    supplementRequested: 3,
    reviewDone: 18,
  },
  items: [
    {
      id: 'assign-jpa-mapping',
      title: 'JPA 연관관계 매핑 실습',
      subject: '백엔드 5회차',
      cohortLabel: 'DA 3기',
      dueLabel: 'D-2',
      closed: false,
      createdByUserId: 'mgr-1',
      counts: {
        submitted: 21,
        notSubmitted: 7,
        supplementRequested: 3,
        reviewDone: 18,
      },
      badgeStatus: 'submitted',
      badgeCount: 21,
    },
    {
      id: 'assign-unit-test',
      title: '단위 테스트 작성 과제',
      subject: '테스트 2회차',
      cohortLabel: 'DA 3기',
      dueLabel: '마감됨',
      closed: true,
      createdByUserId: 'mgr-1',
      counts: {
        submitted: 28,
        notSubmitted: 0,
        supplementRequested: 0,
        reviewDone: 28,
      },
      badgeStatus: 'review_done',
      badgeCount: null,
    },
  ],
}

const assignmentDetail: AssignmentFormDetail = {
  id: 'assign-jpa-mapping',
  cohortId: 'c1',
  cohortLabel: 'DA 3기',
  subject: '백엔드 5회차',
  title: 'JPA 연관관계 매핑 실습',
  dueAt: '2026-05-24 23:59',
  description: '양방향/단방향 연관관계 설계 비교.',
  urls: ['https://docs.spring.io/spring-data-jpa/reference/'],
  files: [
    {
      id: 'file-1',
      name: 'jpa-mapping-guide.pdf',
      downloadUrl:
        '/instructor/assignments/assign-jpa-mapping/attachments/file-1/file',
    },
  ],
  submittedCount: 21,
}

const submissions: AssignmentSubmissionsData = {
  assignmentId: 'assign-jpa-mapping',
  assignmentTitle: 'JPA 연관관계 매핑 실습',
  subject: '백엔드 5회차',
  description: '양방향/단방향 연관관계 설계 비교.',
  createdByUserId: 'mgr-1',
  createdAtLabel: '2026-05-20 09:00',
  dueAtLabel: '2026-05-24 23:59',
  dueLabel: 'D-2',
  closed: false,
  counts: {
    submitted: 21,
    notSubmitted: 7,
    supplementRequested: 3,
    reviewDone: 18,
  },
  rows: [
    {
      id: 'asub-1',
      studentUserId: 'stu-1',
      status: 'submitted',
      submittedAtLabel: '2026-05-22 09:11',
      bodyText: 'Member-Post는 양방향, Post-Comment는 단방향으로 구성했습니다.',
      url: 'https://github.com/lee/jpa-mapping-practice/pull/12',
      files: ['jpa-mapping-report.pdf'],
      feedbacks: [
        {
          authorUserId: 'mgr-1',
          timeLabel: '2026-05-22 10:12',
          text: 'cascade 범위만 한 번 더 확인해 주세요.',
          byStudent: false,
        },
      ],
      history: [],
    },
    {
      id: 'asub-2',
      studentUserId: 'stu-2',
      status: 'submitted',
      submittedAtLabel: '2026-05-22 10:00',
      bodyText: '제출했습니다.',
      url: null,
      files: [],
      feedbacks: [],
      history: [],
    },
  ],
}

const roster = [
  { userId: 'stu-1', name: '이서연' },
  { userId: 'stu-2', name: '최현우' },
]

function ok(data: unknown) {
  return { data, isPending: false, isError: false }
}

function mockAll() {
  vi.mocked(useInstructorAssignments).mockReturnValue(
    ok(assignmentList) as unknown as ReturnType<
      typeof useInstructorAssignments
    >,
  )
  vi.mocked(useAssignmentDetail).mockReturnValue(
    ok(assignmentDetail) as unknown as ReturnType<typeof useAssignmentDetail>,
  )
  vi.mocked(useAssignmentSubmissions).mockReturnValue(
    ok(submissions) as unknown as ReturnType<typeof useAssignmentSubmissions>,
  )
  vi.mocked(useAssignmentCohortOptions).mockReturnValue(
    ok([{ cohortId: 'c1', label: 'DA 3기' }]) as unknown as ReturnType<
      typeof useAssignmentCohortOptions
    >,
  )
  vi.mocked(useCohortRoster).mockReturnValue(
    ok(roster) as unknown as ReturnType<typeof useCohortRoster>,
  )
  const mut = (fn = vi.fn()) =>
    ({
      mutate: fn,
      mutateAsync: vi.fn().mockResolvedValue({ id: 'assign-jpa-mapping' }),
      isPending: false,
    }) as unknown as never
  vi.mocked(useSaveAssignment).mockReturnValue(mut())
  vi.mocked(useDeleteAssignment).mockReturnValue(mut())
  vi.mocked(useUploadAssignmentFile).mockReturnValue(mut())
  vi.mocked(useDeleteAssignmentFile).mockReturnValue(mut())
  vi.mocked(useChangeSubmissionStatus).mockReturnValue(mut(changeStatusMutate))
}

function renderAt(path: string, overrideMocks?: () => void) {
  changeStatusMutate.mockClear()
  mockAll()
  overrideMocks?.()
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/instructor/assignments" element={<AssignmentsPage />} />
          <Route
            path="/instructor/assignments/new"
            element={<AssignmentFormPage />}
          />
          <Route
            path="/instructor/assignments/:assignmentId/submissions"
            element={<SubmissionsPage />}
          />
          <Route
            path="/instructor/assignments/:assignmentId"
            element={<AssignmentFormPage />}
          />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('AssignmentsPage (P0 30, 실 BE)', () => {
  it('KPI 4종과 과제 행·대표 배지·마감 표기를 렌더한다', () => {
    renderAt('/instructor/assignments')
    expect(screen.getByText('마감 전 제출 완료')).toBeInTheDocument()
    expect(screen.getByText('재제출 대기')).toBeInTheDocument()
    expect(screen.getByText('JPA 연관관계 매핑 실습')).toBeInTheDocument()
    expect(screen.getByText('제출완료 21')).toBeInTheDocument()
  })

  it('삭제 클릭은 제출 기록 동반 삭제 확인 모달을 연다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/assignments')
    await user.click(screen.getAllByRole('button', { name: '삭제' })[0])
    expect(screen.getByText('과제·실습을 삭제할까요?')).toBeInTheDocument()
  })
})

describe('AssignmentFormPage (실 BE)', () => {
  it('수정 모드는 상세 값과 첨부 자료를 폼에 채운다', () => {
    renderAt('/instructor/assignments/assign-jpa-mapping')
    expect(
      screen.getByDisplayValue('JPA 연관관계 매핑 실습'),
    ).toBeInTheDocument()
    expect(screen.getByText('2026-05-24 오후 11:59')).toBeInTheDocument()
    expect(screen.getByText('jpa-mapping-guide.pdf')).toBeInTheDocument()
  })

  it('생성 모드 빈 제출은 검증 에러를 보여준다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/assignments/new', () => {
      vi.mocked(useAssignmentDetail).mockReturnValue(
        ok(undefined) as unknown as ReturnType<typeof useAssignmentDetail>,
      )
    })
    await user.click(screen.getByRole('button', { name: '저장' }))
    expect(
      await screen.findByText('과제 제목을 입력해주세요'),
    ).toBeInTheDocument()
    expect(screen.getByText('마감일시를 입력해주세요')).toBeInTheDocument()
  })
})

describe('SubmissionsPage (과제, 실 BE)', () => {
  it('헤더 배지·학생 큐(이름 join)·제출물 검토 패널을 렌더한다', () => {
    renderAt('/instructor/assignments/assign-jpa-mapping/submissions')
    expect(screen.getByText('제출 21')).toBeInTheDocument()
    expect(screen.getByText('학생별 제출')).toBeInTheDocument()
    expect(screen.getByText('제출물 검토')).toBeInTheDocument()
    // studentUserId stu-1 → 이서연(로스터 join). 학번(code)은 로스터에 없어 userId 폴백.
    expect(screen.getByText(/이서연 · stu-1/)).toBeInTheDocument()
    expect(
      screen.getByText('https://github.com/lee/jpa-mapping-practice/pull/12'),
    ).toBeInTheDocument()
  })

  it('보완요청 사유 입력 후 확정하면 상태 변경 mutation을 호출한다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/assignments/assign-jpa-mapping/submissions')
    await user.click(screen.getAllByRole('button', { name: '보완요청' })[1])
    expect(screen.getByText('보완요청을 보낼까요?')).toBeInTheDocument()
    const confirmButtons = screen.getAllByRole('button', { name: '보완요청' })
    await user.type(
      screen.getByLabelText('이서연 보완 요청 사유'),
      'cascade 범위를 보완해 주세요.',
    )
    await user.click(confirmButtons[confirmButtons.length - 1])
    expect(changeStatusMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionId: 'asub-1',
        status: 'supplement_requested',
      }),
      expect.anything(),
    )
  })
})
