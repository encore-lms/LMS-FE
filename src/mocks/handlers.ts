import { http, HttpResponse } from 'msw'
import type {
  Role,
  QuizListItem,
  QuizQuestion,
  QuizResult,
  QuizAttempt,
  AdminDashboardSummary,
} from '@/shared/types'

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

// 운영(admin) — 대시보드 요약. 나머지 운영 화면은 후속 PR에서 소비.
const adminHandlers = [
  http.get('/api/admin/dashboard', () =>
    ok<AdminDashboardSummary>({
      certificationRequests: 12,
      reviewPending: 5,
      changesRequested: 3,
      mart: { state: 'stale', updatedAt: '2026-06-04T01:00:00Z' },
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
]
