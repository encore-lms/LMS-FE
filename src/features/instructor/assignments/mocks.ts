import { http, HttpResponse } from 'msw'
import type {
  InstructorAssignmentListData,
  AssignmentFormDetail,
  AssignmentSubmissionsData,
} from '@/shared/types'
import type { AssignmentCohortOption } from '../api/assignments'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
// 강사 과제·실습 Main Flow (/instructor/assignments*) — 점수 없음, 상태 전이 + 피드백만 (P0 30).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 과제 목록 (Figma 2236:10561) ──
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

// ── 생성 폼 기수 옵션 ──
const cohortOptions: AssignmentCohortOption[] = [
  { cohortId: 'c1', label: 'DA 3기' },
  { cohortId: 'c2', label: 'DA 4기' },
  { cohortId: 'c3', label: 'FE 7기' },
]

// ── 생성/수정 폼 상세 (Figma 2236:10651) ──
const assignmentDetails: Record<string, AssignmentFormDetail> = {
  'assign-jpa-mapping': {
    id: 'assign-jpa-mapping',
    cohortId: 'c1',
    cohortLabel: 'DA 3기',
    subject: '백엔드 5회차',
    title: 'JPA 연관관계 매핑 실습',
    dueAt: '2026-05-24 23:59',
    description: '양방향/단방향 연관관계 설계 비교.',
    urls: ['https://docs.spring.io/spring-data-jpa/reference/'],
    files: ['jpa-mapping-guide.pdf'],
    submittedCount: 21,
  },
  'assign-unit-test': {
    id: 'assign-unit-test',
    cohortId: 'c1',
    cohortLabel: 'DA 3기',
    subject: '테스트 2회차',
    title: '단위 테스트 작성 과제',
    dueAt: '2026-05-18 23:59',
    description: 'JUnit5·Mockito 기반 단위 테스트 작성.',
    urls: [],
    files: ['unit-test-rubric.pdf'],
    submittedCount: 28,
  },
}

// ── 제출 현황 (Figma 2750:1547) ──
const assignmentSubmissions: AssignmentSubmissionsData = {
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
      status: 'supplement_requested',
      submittedAtLabel: '2026-05-22 10:00',
      bodyText: '제출했습니다. 보완 후 다시 올리겠습니다.',
      url: null,
      files: [],
      feedbacks: [
        {
          authorUserId: 'mgr-1',
          timeLabel: '2026-05-22 11:05',
          text: 'N+1 문제를 fetch join으로 해결해 주세요.',
          byStudent: false,
        },
      ],
      history: ['2026-05-22 제출', '2026-05-22 보완요청'],
    },
    {
      id: 'asub-3',
      studentUserId: 'stu-3',
      status: 'review_done',
      submittedAtLabel: '2026-05-21 22:40',
      bodyText: '연관관계 매핑과 cascade 전략을 모두 적용했습니다.',
      url: 'https://github.com/kim/jpa-practice/pull/3',
      files: ['jpa-report-final.pdf'],
      feedbacks: [
        {
          authorUserId: 'mgr-1',
          timeLabel: '2026-05-22 09:30',
          text: '잘 작성되었습니다. 검토 완료합니다.',
          byStudent: false,
        },
      ],
      history: ['2026-05-21 제출', '2026-05-22 검토완료'],
    },
    {
      id: 'asub-4',
      studentUserId: 'stu-4',
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

const fallbackDetail = assignmentDetails['assign-jpa-mapping']

export const handlers = [
  http.get('/api/instructor/assignments', () =>
    ok<InstructorAssignmentListData>(assignmentList),
  ),
  // 단일 세그먼트 'cohort-options'가 :assignmentId보다 먼저 매칭되도록 순서 유지.
  http.get('/api/instructor/assignments/cohort-options', () =>
    ok<AssignmentCohortOption[]>(cohortOptions),
  ),
  http.get('/api/instructor/assignments/:assignmentId/submissions', () =>
    ok<AssignmentSubmissionsData>(assignmentSubmissions),
  ),
  http.get('/api/instructor/assignments/:assignmentId', ({ params }) => {
    const detail =
      assignmentDetails[String(params.assignmentId)] ?? fallbackDetail
    return ok<AssignmentFormDetail>(detail)
  }),
  // 생성/수정 — 생성된 듯한 상세를 반환.
  http.post('/api/instructor/assignments', () =>
    ok<AssignmentFormDetail>({
      ...fallbackDetail,
      id: 'assign-new',
      submittedCount: 0,
    }),
  ),
  http.put('/api/instructor/assignments/:assignmentId', ({ params }) => {
    const detail =
      assignmentDetails[String(params.assignmentId)] ?? fallbackDetail
    return ok<AssignmentFormDetail>({
      ...detail,
      id: String(params.assignmentId),
    })
  }),
  http.delete('/api/instructor/assignments/:assignmentId', () =>
    HttpResponse.json({ data: null }),
  ),
  http.patch(
    '/api/instructor/assignments/:assignmentId/submissions/:submissionId',
    () => HttpResponse.json({ data: null }),
  ),
]
