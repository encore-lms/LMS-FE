import { http, HttpResponse } from 'msw'
import type {
  Role,
  QuizListItem,
  QuizQuestion,
  QuizResult,
  QuizAttempt,
  AdminDashboardSummary,
} from '@/shared/types'
import { attendanceHandlers } from '@/features/student/attendance/mocks'

// {data} 래핑 헬퍼 — mock 응답은 ApiResponse<T>(= {data:T}) 형태를 지킨다.
const ok = <T>(data: T) => HttpResponse.json({ data })

// 개발용 mock 로그인. 이메일 prefix로 역할을 흉내내 각 shell을 바로 테스트할 수 있다.
//   admin@…→운영(MANAGER) / instructor@…→강사 / mentor@…→멘토 / 그 외→수강생
function roleFromEmail(email: string): Role {
  if (email.startsWith('admin')) return 'MANAGER'
  if (email.startsWith('instructor')) return 'INSTRUCTOR'
  if (email.startsWith('mentor')) return 'MENTOR'
  return 'STUDENT'
}

const mockQuizzes: QuizListItem[] = [
  {
    quiz: {
      id: 'q1',
      cohortId: 'c1',
      title: '1주차 React 퀴즈',
      gradingMode: 'AUTO',
      startsAt: '2026-06-01T00:00:00Z',
      endsAt: '2026-06-30T23:59:59Z',
      timeLimitMinutes: 30,
      maxAttempts: 2,
      shuffleQuestions: false,
    },
    myAttemptCount: 0,
    state: 'available',
  },
  {
    quiz: {
      id: 'q2',
      cohortId: 'c1',
      title: '2주차 TS 퀴즈',
      gradingMode: 'MIXED',
      startsAt: '2026-05-20T00:00:00Z',
      endsAt: '2026-06-10T23:59:59Z',
      timeLimitMinutes: 45,
      maxAttempts: 1,
      shuffleQuestions: true,
    },
    myAttemptCount: 1,
    state: 'pending_manual',
    latestSubmission: {
      id: 's2',
      gradingStatus: 'pending_manual',
      totalScore: 12,
      submittedAt: '2026-06-02T10:00:00Z',
    },
  },
  {
    quiz: {
      id: 'q3',
      cohortId: 'c1',
      title: '오리엔테이션 퀴즈',
      gradingMode: 'AUTO',
      startsAt: '2026-05-01T00:00:00Z',
      endsAt: '2026-05-10T23:59:59Z',
      timeLimitMinutes: 15,
      maxAttempts: 1,
      shuffleQuestions: false,
    },
    myAttemptCount: 1,
    state: 'completed',
    latestSubmission: {
      id: 's3',
      gradingStatus: 'finalized',
      totalScore: 18,
      submittedAt: '2026-05-05T09:00:00Z',
    },
  },
]

// 수강생 퀴즈 — 목록은 이번 PR(목록 화면)에서, 나머지는 다음 PR(응시/결과)에서 소비.
const quizHandlers = [
  http.get('/api/student/quizzes', () => ok<QuizListItem[]>(mockQuizzes)),

  http.get('/api/student/quizzes/:quizId/questions', ({ params }) =>
    ok<QuizQuestion[]>([
      {
        id: 'qq1',
        quizId: String(params.quizId),
        categoryId: 'react',
        type: 'multiple_choice',
        gradingType: 'AUTO',
        prompt: 'useEffect 의존성 배열이 빈 배열일 때 effect 실행 시점은?',
        maxPoints: 10,
        orderNo: 1,
        choices: [
          { id: 'a', label: '매 렌더마다 실행' },
          { id: 'b', label: '마운트 시 1회' },
        ],
      },
    ]),
  ),

  http.post('/api/student/quizzes/:quizId/attempts', ({ params }) =>
    ok<QuizAttempt>({
      id: 'att1',
      quizId: String(params.quizId),
      attemptNo: 1,
      status: 'in_progress',
      startedAt: '2026-06-03T00:00:00Z',
      expiresAt: '2026-06-03T00:30:00Z',
    }),
  ),

  http.get('/api/student/quizzes/:quizId/result', ({ params }) =>
    ok<QuizResult>({
      submission: {
        id: 's3',
        quizId: String(params.quizId),
        attemptNo: 1,
        submittedAt: '2026-05-05T09:00:00Z',
        gradingStatus: 'finalized',
        totalScore: 18,
      },
      answers: [
        {
          questionId: 'qq1',
          prompt: 'useEffect 의존성 배열이 빈 배열일 때 effect 실행 시점은?',
          categoryId: 'react',
          maxPoints: 10,
          answer: { kind: 'multiple_choice', selectedChoiceId: 'b' },
          correctAnswerKey: 'b',
          earnedPoints: 10,
          isCorrect: true,
        },
      ],
    }),
  ),
]

// 운영(admin) — 대시보드 요약(v2). 나머지 운영 화면은 후속 PR에서 소비.
const adminHandlers = [
  http.get('/api/admin/dashboard', () =>
    ok<AdminDashboardSummary>({
      status: { level: 'caution', message: '마트 오류 1건' },
      martUpdatedAt: '2026-05-18T06:00:00Z',
      kpis: {
        certificationRequests: { value: 24, newCount: 12, total: 24 },
        reviewing: { value: 8, avgDays: 1.8 },
        changesRequested: { value: 5, awaitingStudent: 3 },
        certified: { value: 142, monthDelta: 18 },
        martErrors: { value: 1 },
      },
      urgentReviews: [
        {
          id: 'u1',
          cohort: '데이터분석 6기',
          name: '김지원',
          detail: '인증 요청 · 5일 경과',
          isNew: true,
        },
        {
          id: 'u2',
          cohort: '백엔드 11기',
          name: '이서연',
          detail: '보완 응답 · 4일 경과',
          isNew: true,
        },
        {
          id: 'u3',
          cohort: '프론트엔드 8기',
          name: '박도윤',
          detail: '인증 요청 · 3일 경과',
          isNew: true,
        },
        {
          id: 'u4',
          cohort: 'AI엔지니어 4기',
          name: '최하늘',
          detail: '검토 중 · 3일 경과',
          isNew: true,
        },
        {
          id: 'u5',
          cohort: 'DevOps 2기',
          name: '정민호',
          detail: '인증 요청 · 2일 경과',
          isNew: true,
        },
      ],
      riskFlags: [
        {
          id: 'r1',
          cohort: '데이터분석 5기',
          name: '강유진',
          detail: '위험 플래그 4건 · 출결 미달',
        },
        {
          id: 'r2',
          cohort: '백엔드 11기',
          name: '송재현',
          detail: '위험 플래그 3건 · 과제 미제출',
        },
        {
          id: 'r3',
          cohort: '프론트엔드 7기',
          name: '윤소율',
          detail: '위험 플래그 3건 · 평판 -2',
        },
        {
          id: 'r4',
          cohort: 'AI엔지니어 3기',
          name: '한지훈',
          detail: '위험 플래그 2건 · 보완 지연',
        },
        {
          id: 'r5',
          cohort: 'DevOps 1기',
          name: '임채원',
          detail: '위험 플래그 2건 · 출결 경고',
        },
      ],
      quickEntry: [
        {
          key: 'review',
          title: '인증 검토 큐',
          meta: '대기 8건 · 평균 1.8일',
          to: '/admin/certification-review',
          cta: '인증 검토로 이동',
        },
        {
          key: 'accounts',
          title: '운영 계정·권한',
          meta: '활성 계정 14 · 변경 2',
          to: '/admin/accounts',
          cta: '계정 관리로 이동',
        },
        {
          key: 'csv',
          title: 'CSV 매핑',
          meta: '대기 매핑 3건',
          to: '/admin/csv',
          cta: 'CSV 매핑으로 이동',
        },
      ],
    }),
  ),
]

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    const email = body.email ?? ''
    return HttpResponse.json({
      data: {
        token: 'mock-token',
        user: {
          id: 'mock-1',
          email,
          name: '테스트 사용자',
          role: roleFromEmail(email),
        },
      },
    })
  }),
  ...quizHandlers,
  ...adminHandlers,
  ...attendanceHandlers,
]
