import { http, HttpResponse } from 'msw'
import type { AdminGradingDetail } from '@/shared/types'
import type { AdminGradeSaveRequest } from '../api/quizzes'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
// 상태형 mock: 변경 저장 POST가 모듈 레벨 상태를 실제로 바꿔 정답 관리 GET에 반영된다.
// 강사 quizzes mock 선례처럼 :quizId는 무시하고 단일 대표 데이터(SQL 조인 퀴즈)를 쓴다.
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 수동 채점 (Figma 1515:10710) — submissionId별 상태형 mock ──
// PATCH(자동 저장·채점 완료)가 모듈 상태를 실제로 바꿔 GET·KPI에 반영된다.
// detail에 없는 자동 채점분 점수는 autoScore로 따로 들고 currentScore를 파생한다.
interface GradingState {
  autoScore: number
  detail: AdminGradingDetail
}

// 제출 현황 순서 sub_1 → sub_2 → sub_3 체인(prev/next 시연), 끝단은 null.
const initialGrading: GradingState[] = [
  {
    autoScore: 42, // 자동 6문항 — 42 + 수동 10 + 16 = 현재 점수 68(Figma)
    detail: {
      submissionId: 'sub_1',
      quizId: 'qz_sql_join',
      student: { name: '박서연', cohort: 'DA 4기' },
      quizTitle: 'SQL 조인 퀴즈',
      submittedAt: '2026-05-19 09:34',
      gradingStatus: 'pending_manual',
      currentScore: 68,
      ungradedCount: 0, // 카드 기준 파생(점수 둘 다 입력됨) — Figma KPI 2와 모순은 카드 우선
      changeLogCount: 3,
      elapsedMinutes: 12,
      avgElapsedMinutes: 8,
      timeLimitMinutes: 40,
      timeUsedMinutes: 38,
      autoGradedCount: 6,
      totalQuestionCount: 8,
      prevSubmissionId: null,
      nextSubmissionId: 'sub_2',
      items: [
        {
          questionId: 'gq_5',
          questionNo: 5,
          type: 'short_answer',
          maxPoints: 12,
          prompt:
            '집계 결과에서 부서별 평균 급여를 구하는 SQL 절을 작성하세요.',
          studentAnswer:
            'SELECT dept, AVG(salary) FROM employees GROUP BY dept',
          rubric: 'GROUP BY 포함, 집계 함수 정확성, alias 선택은 감점 없음',
          score: 10,
          feedback: '',
          feedbackVisible: false,
          resultStatus: 'partial',
        },
        {
          questionId: 'gq_8',
          questionNo: 8,
          type: 'essay',
          maxPoints: 20,
          prompt: 'INNER JOIN과 LEFT JOIN의 결과 차이를 예시로 설명하세요.',
          studentAnswer:
            'LEFT JOIN은 왼쪽 테이블 기준으로 매칭되지 않은 행도 남기며 NULL이 채워집니다.',
          score: 16,
          feedback: '예시는 적절하나 INNER JOIN 누락으로 4점 감점',
          feedbackVisible: true,
          resultStatus: 'partial',
        },
      ],
    },
  },
  {
    autoScore: 40,
    detail: {
      submissionId: 'sub_2',
      quizId: 'qz_sql_join',
      student: { name: '김도윤', cohort: 'DA 4기' },
      quizTitle: 'SQL 조인 퀴즈',
      submittedAt: '2026-05-19 10:02',
      gradingStatus: 'pending_manual',
      currentScore: 52,
      ungradedCount: 1,
      changeLogCount: 1,
      elapsedMinutes: 5,
      avgElapsedMinutes: 8,
      timeLimitMinutes: 40,
      timeUsedMinutes: 31,
      autoGradedCount: 6,
      totalQuestionCount: 8,
      prevSubmissionId: 'sub_1',
      nextSubmissionId: 'sub_3',
      items: [
        {
          questionId: 'gq_5',
          questionNo: 5,
          type: 'short_answer',
          maxPoints: 12,
          prompt:
            '집계 결과에서 부서별 평균 급여를 구하는 SQL 절을 작성하세요.',
          studentAnswer: 'SELECT dept, AVG(salary) FROM employees',
          rubric: 'GROUP BY 포함, 집계 함수 정확성, alias 선택은 감점 없음',
          score: null,
          feedback: '',
          feedbackVisible: false,
        },
        {
          questionId: 'gq_8',
          questionNo: 8,
          type: 'essay',
          maxPoints: 20,
          prompt: 'INNER JOIN과 LEFT JOIN의 결과 차이를 예시로 설명하세요.',
          studentAnswer:
            'INNER JOIN은 양쪽에 모두 있는 행만, LEFT JOIN은 왼쪽 행을 모두 남깁니다. 예: 주문 없는 고객도 LEFT JOIN이면 결과에 남습니다.',
          score: 12,
          feedback: '',
          feedbackVisible: false,
          resultStatus: 'partial',
        },
      ],
    },
  },
  {
    autoScore: 38,
    detail: {
      submissionId: 'sub_3',
      quizId: 'qz_sql_join',
      student: { name: '이하늘', cohort: 'DA 4기' },
      quizTitle: 'SQL 조인 퀴즈',
      submittedAt: '2026-05-19 10:41',
      gradingStatus: 'pending_manual',
      currentScore: 38,
      ungradedCount: 2,
      changeLogCount: 0,
      elapsedMinutes: 2,
      avgElapsedMinutes: 8,
      timeLimitMinutes: 40,
      timeUsedMinutes: 40,
      autoGradedCount: 6,
      totalQuestionCount: 8,
      prevSubmissionId: 'sub_2',
      nextSubmissionId: null,
      items: [
        {
          questionId: 'gq_5',
          questionNo: 5,
          type: 'short_answer',
          maxPoints: 12,
          prompt:
            '집계 결과에서 부서별 평균 급여를 구하는 SQL 절을 작성하세요.',
          studentAnswer: 'SELECT * FROM employees GROUP BY dept',
          rubric: 'GROUP BY 포함, 집계 함수 정확성, alias 선택은 감점 없음',
          score: null,
          feedback: '',
          feedbackVisible: false,
        },
        {
          questionId: 'gq_8',
          questionNo: 8,
          type: 'essay',
          maxPoints: 20,
          prompt: 'INNER JOIN과 LEFT JOIN의 결과 차이를 예시로 설명하세요.',
          studentAnswer: '두 조인은 결과 행 수가 다릅니다.',
          score: null,
          feedback: '',
          feedbackVisible: false,
        },
      ],
    },
  },
]

const gradingState: GradingState[] = initialGrading.map((g) => ({
  autoScore: g.autoScore,
  detail: {
    ...g.detail,
    student: { ...g.detail.student },
    items: g.detail.items.map((it) => ({ ...it })),
  },
}))

const clamp = (n: number, max: number) => Math.min(Math.max(n, 0), max)

// 점수에서 상태 pill 파생 — 만점=정답 / 0=오답 / 그 외=부분 정답.
const deriveResultStatus = (score: number, maxPoints: number) =>
  score >= maxPoints ? 'correct' : score <= 0 ? 'incorrect' : 'partial'

// 파생 필드 재계산 — currentScore(자동분+수동 입력 합)·미채점 수.
function recalcGrading(state: GradingState) {
  const { detail } = state
  detail.currentScore =
    state.autoScore + detail.items.reduce((acc, it) => acc + (it.score ?? 0), 0)
  detail.ungradedCount = detail.items.filter((it) => it.score === null).length
}

// 미지정 submissionId는 대표 건(sub_1)으로 폴백 — 강사 제출 현황 mock의 행 id로 진입해도 시연 가능.
const findGrading = (submissionId: string) =>
  gradingState.find((g) => g.detail.submissionId === submissionId) ??
  gradingState[0]

export const handlers = [
  // 정답 관리(answers·impact·changes)는 실 BE(learning /admin/quizzes) 연결 — mock 제거(#4).

  // ── 수동 채점 — submissionId별 분기(이전/다음 학생 시연) ──
  http.get(
    '/api/admin/quizzes/:quizId/submissions/:submissionId/grade',
    ({ params }) =>
      ok<AdminGradingDetail>(findGrading(String(params.submissionId)).detail),
  ),

  // PATCH — items(자동 저장: 점수 클램프·피드백·공개) / finalize(전 문항 채점 시 finalized 전이).
  http.patch<{ quizId: string; submissionId: string }, AdminGradeSaveRequest>(
    '/api/admin/quizzes/:quizId/submissions/:submissionId/grade',
    async ({ params, request }) => {
      const state = findGrading(String(params.submissionId))
      const { detail } = state
      const body = (await request.json()) as AdminGradeSaveRequest

      for (const patch of body?.items ?? []) {
        const item = detail.items.find(
          (it) => it.questionId === patch.questionId,
        )
        if (!item) continue
        // 서버 측에도 0~배점 클램프(P0-ADM-QUIZ-010 점수 범위 검증).
        item.score =
          patch.earnedPoints === null
            ? null
            : clamp(patch.earnedPoints, item.maxPoints)
        item.feedback = patch.feedback
        item.feedbackVisible = patch.feedbackVisible
        item.resultStatus =
          item.score === null
            ? undefined
            : deriveResultStatus(item.score, item.maxPoints)
        detail.changeLogCount += 1 // KPI '변경 이력 — 자동 저장 포함'
      }
      recalcGrading(state)

      if (body?.finalize) {
        // 필수 수동 문항 미채점 — 완료 차단(FE 선차단 + 서버 재검증).
        if (detail.items.some((it) => it.score === null)) {
          return HttpResponse.json(
            {
              code: 'GRADING_INCOMPLETE',
              message: '모든 수동 문항 점수 입력 후 채점을 완료할 수 있습니다.',
            },
            { status: 422 },
          )
        }
        detail.gradingStatus = 'finalized' // pending_manual → finalized 전이
      }
      return ok<AdminGradingDetail>(detail)
    },
  ),
]
