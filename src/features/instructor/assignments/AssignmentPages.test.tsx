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
} from '../api/assignments'
import type {
  InstructorAssignmentListData,
  AssignmentFormDetail,
  AssignmentSubmissionsData,
} from '@/shared/types'

vi.mock('../api/assignments')

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
      creator: '박준석 강사',
      counts: {
        submitted: 21,
        notSubmitted: 7,
        supplementRequested: 3,
        reviewDone: 18,
      },
      badge: { status: 'submitted', count: 21 },
    },
    {
      id: 'assign-unit-test',
      title: '단위 테스트 작성 과제',
      subject: '테스트 2회차',
      cohortLabel: 'DA 3기',
      dueLabel: '마감됨',
      closed: true,
      creator: '운영 매니저',
      counts: {
        submitted: 28,
        notSubmitted: 0,
        supplementRequested: 0,
        reviewDone: 28,
      },
      badge: { status: 'review_done', count: null },
    },
  ],
}

const assignmentDetail: AssignmentFormDetail = {
  id: 'assign-jpa-mapping',
  cohortLabel: 'DA 3기',
  subject: '백엔드 5회차',
  title: 'JPA 연관관계 매핑 실습',
  dueAt: '2026-05-24 23:59',
  description: '양방향/단방향 연관관계 설계 비교.',
  urls: ['https://docs.spring.io/spring-data-jpa/reference/'],
  files: ['jpa-mapping-guide.pdf'],
  submittedCount: 21,
}

const submissions: AssignmentSubmissionsData = {
  assignmentId: 'assign-jpa-mapping',
  assignmentTitle: 'JPA 연관관계 매핑 실습',
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
      studentName: '이서연',
      studentCode: 'def-5678',
      cohortLabel: 'DA 3기',
      status: 'submitted',
      submittedAtLabel: '2026-05-22 09:11',
      bodyText: 'Member-Post는 양방향, Post-Comment는 단방향으로 구성했습니다.',
      url: 'https://github.com/lee/jpa-mapping-practice/pull/12',
      files: ['jpa-mapping-report.pdf'],
      feedbacks: [
        {
          author: '박준석 강사',
          timeLabel: '방금 전',
          text: 'cascade 범위만 한 번 더 확인해 주세요.',
          byStudent: false,
        },
      ],
      history: ['제출완료 · 박준석 강사 · 2026-05-22 10:12 · 확인 완료'],
    },
    {
      id: 'asub-2',
      studentName: '최현우',
      studentCode: 'jkl-3456',
      cohortLabel: 'DA 3기',
      status: 'not_submitted',
      submittedAtLabel: null,
      bodyText: null,
      url: null,
      files: [],
      feedbacks: [],
      history: [],
    },
  ],
}

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
}

function renderAt(path: string, overrideMocks?: () => void) {
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

describe('AssignmentsPage (P0 30)', () => {
  it('KPI 4종과 과제 행·대표 배지·마감 표기를 렌더한다', () => {
    renderAt('/instructor/assignments')
    expect(screen.getByText('마감 전 제출 완료')).toBeInTheDocument()
    expect(screen.getByText('재제출 대기')).toBeInTheDocument()
    expect(screen.getByText('JPA 연관관계 매핑 실습')).toBeInTheDocument()
    expect(screen.getByText('제출완료 21')).toBeInTheDocument()
    // '마감됨'은 상태 필터 option + 마감된 행 셀 2곳
    expect(screen.getAllByText('마감됨').length).toBe(2)
  })

  it('삭제 클릭은 제출 기록 동반 삭제 확인 모달을 연다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/assignments')
    await user.click(screen.getAllByRole('button', { name: '삭제' })[0])
    expect(screen.getByText('과제·실습을 삭제할까요?')).toBeInTheDocument()
    // 제출 21 + 완료 18 = 39건 동반 삭제 고지
    expect(screen.getByText('제출 기록 39건 함께 삭제')).toBeInTheDocument()
  })
})

describe('AssignmentFormPage', () => {
  it('수정 모드는 상세 값과 첨부 자료를 폼에 채운다', () => {
    renderAt('/instructor/assignments/assign-jpa-mapping')
    expect(
      screen.getByDisplayValue('JPA 연관관계 매핑 실습'),
    ).toBeInTheDocument()
    // 마감일시는 공용 DateTimePicker — 트리거에 표시값(오전/오후 12시간제)이 렌더된다
    expect(screen.getByText('2026-05-24 오후 11:59')).toBeInTheDocument()
    expect(screen.getByText('jpa-mapping-guide.pdf')).toBeInTheDocument()
    expect(screen.getByText('생성 정책')).toBeInTheDocument()
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

describe('SubmissionsPage (과제)', () => {
  it('과제 헤더 배지·학생 큐·제출물 검토 패널을 렌더한다', () => {
    renderAt('/instructor/assignments/assign-jpa-mapping/submissions')
    expect(screen.getByText('제출 21')).toBeInTheDocument()
    expect(screen.getByText('학생별 제출')).toBeInTheDocument()
    expect(screen.getByText('제출물 검토')).toBeInTheDocument()
    expect(screen.getByText(/이서연 · def-5678 · DA 3기/)).toBeInTheDocument()
    expect(
      screen.getByText('https://github.com/lee/jpa-mapping-practice/pull/12'),
    ).toBeInTheDocument()
  })

  it('보완요청은 사유 필수 — 입력 후 확정하면 상태와 이력이 갱신된다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/assignments/assign-jpa-mapping/submissions')
    // '보완요청' 버튼은 [필터 칩, 검토 패널 액션] 순 — 패널 액션 클릭
    await user.click(screen.getAllByRole('button', { name: '보완요청' })[1])
    expect(screen.getByText('보완요청을 보낼까요?')).toBeInTheDocument()
    // 사유 비어 있으면 확정 비활성 (모달 확정 버튼이 마지막)
    const confirmButtons = screen.getAllByRole('button', { name: '보완요청' })
    expect(confirmButtons[confirmButtons.length - 1]).toBeDisabled()
    await user.type(
      screen.getByLabelText('이서연 보완 요청 사유'),
      'cascade 범위를 보완해 주세요.',
    )
    await user.click(confirmButtons[confirmButtons.length - 1])
    expect(
      screen.getByText('상태 변경: 보완요청', { exact: false }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/보완요청 · 나 \(강사\) · 방금 전/),
    ).toBeInTheDocument()
  })

  it('미제출 학생 선택 시 빈 검토 패널 안내를 보여준다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/assignments/assign-jpa-mapping/submissions')
    await user.click(screen.getByText('최현우'))
    expect(screen.getByText('아직 제출하지 않았어요')).toBeInTheDocument()
  })
})
