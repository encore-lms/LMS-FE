import { http, HttpResponse } from 'msw'
import type {
  InstructorAssignmentListData,
  AssignmentFormDetail,
  AssignmentSubmissionsData,
} from '@/shared/types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 과제·실습 관리 목록 (Figma 2236:10561) ──
const assignmentList: InstructorAssignmentListData = {
  total: 4,
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
    {
      id: 'assign-docker-deploy',
      title: 'Docker 컨테이너 배포 실습',
      subject: 'DevOps 3회차',
      cohortLabel: 'DA 3기',
      dueLabel: 'D-5',
      closed: false,
      creator: '김지현 강사',
      counts: {
        submitted: 14,
        notSubmitted: 14,
        supplementRequested: 0,
        reviewDone: 0,
      },
      badge: { status: 'not_submitted', count: 14 },
    },
    {
      id: 'assign-rest-error',
      title: 'REST API 예외 처리',
      subject: 'Spring 4회차',
      cohortLabel: 'DA 3기',
      dueLabel: 'D-1',
      closed: false,
      creator: '박준석 강사',
      counts: {
        submitted: 25,
        notSubmitted: 3,
        supplementRequested: 2,
        reviewDone: 20,
      },
      badge: { status: 'supplement_requested', count: 2 },
    },
  ],
}

// ── 과제·실습 생성/수정 (Figma 2750:1547) ──
const assignmentDetails: Record<string, AssignmentFormDetail> = {
  'assign-jpa-mapping': {
    id: 'assign-jpa-mapping',
    cohortLabel: 'DA 3기',
    subject: '백엔드 5회차',
    title: 'JPA 연관관계 매핑 실습',
    dueAt: '2026-05-24 23:59',
    description:
      'Member-Post-Comment 도메인으로 양방향/단방향 연관관계를 설계하고, fetch join과 batch size 차이를 비교합니다.',
    urls: ['https://docs.spring.io/spring-data-jpa/reference/'],
    files: ['jpa-mapping-guide.pdf'],
    submittedCount: 21,
  },
}

// ── 과제 제출 현황·피드백 (Figma 2236:10651) ──
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
      bodyText:
        'Member-Post는 양방향, Post-Comment는 단방향으로 구성했습니다. 목록 조회는 fetch join과 batch size를 비교했습니다.',
      url: 'https://github.com/lee/jpa-mapping-practice/pull/12',
      files: ['jpa-mapping-report.pdf'],
      feedbacks: [
        {
          author: '박준석 강사',
          timeLabel: '방금 전',
          text: '연관관계 방향 선택 근거가 명확합니다. cascade 범위만 한 번 더 확인해 주세요.',
          byStudent: false,
        },
        {
          author: '수강생 댓글',
          timeLabel: '',
          text: 'cascade 범위 보완해서 다시 제출하겠습니다.',
          byStudent: true,
        },
      ],
      history: ['제출완료 · 박준석 강사 · 2026-05-22 10:12 · 확인 완료'],
    },
    {
      id: 'asub-2',
      studentName: '김민준',
      studentCode: 'abc-1234',
      cohortLabel: 'DA 3기',
      status: 'supplement_requested',
      submittedAtLabel: '재제출 대기',
      bodyText:
        '단방향 매핑으로 우선 구현했습니다. 보완 요청 주신 양방향 비교는 재제출 시 포함하겠습니다.',
      url: null,
      files: ['mapping-v1.zip'],
      feedbacks: [
        {
          author: '박준석 강사',
          timeLabel: '어제',
          text: '양방향 매핑 비교와 N+1 재현 로그를 보완해 주세요.',
          byStudent: false,
        },
      ],
      history: ['보완요청 · 박준석 강사 · 2026-05-21 14:02 · 사유 전달'],
    },
    {
      id: 'asub-3',
      studentName: '박지우',
      studentCode: 'ghi-9012',
      cohortLabel: 'DA 3기',
      status: 'review_done',
      submittedAtLabel: '2026-05-21 18:40',
      bodyText:
        '연관관계 주인을 외래키 보유 엔티티로 고정하고, 편의 메서드로 양쪽 동기화를 유지했습니다.',
      url: 'https://github.com/park/jpa-mapping-practice/pull/8',
      files: [],
      feedbacks: [
        {
          author: '박준석 강사',
          timeLabel: '2일 전',
          text: '편의 메서드 동기화 처리까지 깔끔합니다. 검토 완료합니다.',
          byStudent: false,
        },
      ],
      history: ['검토완료 · 박준석 강사 · 2026-05-21 19:05 · 피드백 반영 완료'],
    },
    {
      id: 'asub-4',
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
    {
      id: 'asub-5',
      studentName: '정하늘',
      studentCode: 'mno-7890',
      cohortLabel: 'DA 3기',
      status: 'submitted',
      submittedAtLabel: '2026-05-20 23:12',
      bodyText:
        '지연 로딩 기본 + 필요 지점만 fetch join으로 해결했습니다. 비교 표는 첨부 파일에 있습니다.',
      url: null,
      files: ['lazy-vs-fetchjoin.xlsx'],
      feedbacks: [],
      history: [],
    },
  ],
}

export const handlers = [
  http.get('/api/instructor/assignments', () =>
    ok<InstructorAssignmentListData>(assignmentList),
  ),
  // 정적 세그먼트(submissions)가 상세(:assignmentId)보다 먼저 매칭되도록 구체 경로 먼저.
  http.get('/api/instructor/assignments/:assignmentId/submissions', () =>
    ok<AssignmentSubmissionsData>(submissions),
  ),
  http.get('/api/instructor/assignments/:assignmentId', ({ params }) => {
    const detail =
      assignmentDetails[String(params.assignmentId)] ??
      assignmentDetails['assign-jpa-mapping']
    return ok<AssignmentFormDetail>(detail)
  }),
]
