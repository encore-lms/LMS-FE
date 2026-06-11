import { http, HttpResponse } from 'msw'
import type {
  AdminGradingDetail,
  QuizAnswerChangeItem,
  QuizAnswerChangeLog,
  QuizAnswerChangeRequest,
  QuizAnswerImpact,
  QuizAnswerRow,
  QuizAnswersData,
} from '@/shared/types'
import type { AdminGradeSaveRequest } from '../api/quizzes'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
// 상태형 mock: 변경 저장 POST가 모듈 레벨 상태를 실제로 바꿔 정답 관리 GET에 반영된다.
// 강사 quizzes mock 선례처럼 :quizId는 무시하고 단일 대표 데이터(SQL 조인 퀴즈)를 쓴다.
const ok = <T>(data: T) => HttpResponse.json({ data })

// Figma "운영 — 정답 관리"(1515:10493) 대표 데이터 — 문항 10(객관식 8 · 단답형 2).
// Figma 테이블의 5행(1·3·5·8·10)은 원문 그대로, 나머지(2·4·6·7·9)는 정상 행으로 채움.
const initialRows: QuizAnswerRow[] = [
  {
    questionId: 'qq_1',
    questionNo: 1,
    type: 'multiple_choice',
    summary: 'SELECT 기본 문법',
    currentAnswerKey: 'B',
    maxPoints: 10,
    proposedAnswerKey: null,
    affectedCount: 0,
    status: 'normal',
  },
  {
    questionId: 'qq_2',
    questionNo: 2,
    type: 'multiple_choice',
    summary: 'WHERE 조건 연산자',
    currentAnswerKey: 'C',
    maxPoints: 10,
    proposedAnswerKey: null,
    affectedCount: 0,
    status: 'normal',
  },
  {
    questionId: 'qq_3',
    questionNo: 3,
    type: 'multiple_choice',
    summary: 'JOIN 결과 행 수 계산',
    currentAnswerKey: 'A',
    maxPoints: 10,
    proposedAnswerKey: 'C',
    affectedCount: 12,
    status: 'needs_check',
  },
  {
    questionId: 'qq_4',
    questionNo: 4,
    type: 'multiple_choice',
    summary: 'ORDER BY 정렬 방향',
    currentAnswerKey: 'A',
    maxPoints: 10,
    proposedAnswerKey: null,
    affectedCount: 0,
    status: 'normal',
  },
  {
    questionId: 'qq_5',
    questionNo: 5,
    type: 'short_answer',
    summary: '내부 조인 키워드',
    currentAnswerKey: 'JOIN',
    maxPoints: 10,
    proposedAnswerKey: 'INNER JOIN',
    affectedCount: 7,
    status: 'review',
  },
  {
    questionId: 'qq_6',
    questionNo: 6,
    type: 'multiple_choice',
    summary: '집계 함수 구분',
    currentAnswerKey: 'D',
    maxPoints: 10,
    proposedAnswerKey: null,
    affectedCount: 0,
    status: 'normal',
  },
  {
    questionId: 'qq_7',
    questionNo: 7,
    type: 'multiple_choice',
    summary: 'HAVING vs WHERE',
    currentAnswerKey: 'B',
    maxPoints: 10,
    proposedAnswerKey: null,
    affectedCount: 0,
    status: 'normal',
  },
  {
    questionId: 'qq_8',
    questionNo: 8,
    type: 'multiple_choice',
    summary: '서브쿼리 실행 순서',
    currentAnswerKey: 'D',
    maxPoints: 10,
    // 변경안 '삭제'(문항 비활성)는 proposedAnswerKey 없이 status로 표현(shared 계약 주석).
    proposedAnswerKey: null,
    affectedCount: 31,
    status: 'deactivate_candidate',
  },
  {
    questionId: 'qq_9',
    questionNo: 9,
    type: 'multiple_choice',
    summary: '인덱스 동작 이해',
    currentAnswerKey: 'C',
    maxPoints: 10,
    proposedAnswerKey: null,
    affectedCount: 0,
    status: 'normal',
  },
  {
    questionId: 'qq_10',
    questionNo: 10,
    type: 'short_answer',
    summary: '그룹화 키워드',
    currentAnswerKey: 'GROUP BY',
    maxPoints: 10,
    proposedAnswerKey: null,
    affectedCount: 0,
    status: 'normal',
  },
]

// 진행 중 응시 — 재채점 제외 대상(2026-05-21 2차 결정: 잠금·경고 없이 제외만).
const IN_PROGRESS_ATTEMPTS = 2

// 모듈 레벨 가변 상태 — POST가 행·KPI·감사 로그를 함께 갱신한다.
const state: { rows: QuizAnswerRow[]; changeLogs: QuizAnswerChangeLog[] } = {
  rows: initialRows.map((r) => ({ ...r })),
  changeLogs: [],
}

// 영향 범위 4종 — Figma 재채점 영향 패널 원문.
const AFFECTED_AREAS = [
  '학생 결과 화면 점수/피드백',
  '퀴즈 제출 현황 평균 점수',
  '마일리지 지급 후보',
  '증명서 학습 평가 요약',
]

const isCandidate = (r: QuizAnswerRow) =>
  r.proposedAnswerKey !== null || r.status === 'deactivate_candidate'

// KPI — 행 상태에서 파생. 영향 제출은 중복 제출 제외 집계 가정(Figma 수치 31 = 최대 영향 문항 기준 mock).
function buildAnswers(): QuizAnswersData {
  const rows = state.rows
  return {
    quizTitle: 'SQL 조인 퀴즈',
    kpi: {
      totalQuestions: rows.length,
      multipleChoiceCount: rows.filter((r) => r.type === 'multiple_choice')
        .length,
      shortAnswerCount: rows.filter((r) => r.type === 'short_answer').length,
      changeCandidates: rows.filter(isCandidate).length,
      affectedSubmissions: Math.max(0, ...rows.map((r) => r.affectedCount)),
      payoutCandidates: 12,
    },
    rows,
  }
}

/** 영향 계산 한 줄 요약 — Figma 원문 패턴 '문항 3 정답 A → C 변경 시 12명 점수가 변동됩니다.' */
function impactLine(row: QuizAnswerRow, change: QuizAnswerChangeItem): string {
  const head =
    change.afterAnswerKey !== row.currentAnswerKey
      ? `문항 ${row.questionNo} 정답 ${row.currentAnswerKey} → ${change.afterAnswerKey} 변경 시`
      : `문항 ${row.questionNo} 배점 ${row.maxPoints} → ${change.maxPoints}점 변경 시`
  return `${head} ${row.affectedCount}명 점수가 변동됩니다.`
}

const reasonRequired = () =>
  HttpResponse.json(
    {
      code: 'ANSWER_CHANGE_REASON_REQUIRED',
      message:
        '변경 사유 없이는 저장할 수 없습니다 — 감사 로그 기록이 필요합니다.',
    },
    { status: 422 },
  )

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
  // 구체 경로(impact)를 같은 prefix의 answers보다 먼저 배치.
  http.get('/api/admin/quizzes/:quizId/answers/impact', ({ request }) => {
    const raw = new URL(request.url).searchParams.get('changes')
    // 변경안 미전달 시 서버 보유 변경 후보 기준(GET 전달 방식 BE 확정 대기 — api/quizzes.ts TODO).
    let changes: QuizAnswerChangeItem[]
    try {
      changes = raw ? (JSON.parse(raw) as QuizAnswerChangeItem[]) : []
    } catch {
      changes = []
    }
    if (changes.length === 0) {
      changes = state.rows
        .filter((r) => r.proposedAnswerKey !== null)
        .map((r) => ({
          questionId: r.questionId,
          afterAnswerKey: r.proposedAnswerKey as string,
          maxPoints: r.maxPoints,
          reason: '',
        }))
    }
    const matched = changes.flatMap((c) => {
      const row = state.rows.find((r) => r.questionId === c.questionId)
      return row ? [{ row, change: c }] : []
    })
    return ok<QuizAnswerImpact>({
      affectedSubmissionCount: matched.reduce(
        (sum, m) => sum + m.row.affectedCount,
        0,
      ),
      scoreChangeSummary:
        matched.map((m) => impactLine(m.row, m.change)).join(' ') ||
        '변경안이 없어 점수 변동이 없습니다.',
      inProgressAttemptExcluded: IN_PROGRESS_ATTEMPTS,
      payoutCandidateCount: 12,
      affectedAreas: AFFECTED_AREAS,
    })
  }),

  http.get('/api/admin/quizzes/:quizId/answers', () =>
    ok<QuizAnswersData>(buildAnswers()),
  ),

  // 변경 저장 — 정답/배점 반영 + 자동 재채점(영향 카운트 소거) + 감사 로그 생성(KPI '감사 로그 필수').
  http.post<{ quizId: string }, QuizAnswerChangeRequest>(
    '/api/admin/quizzes/:quizId/answers/changes',
    async ({ request }) => {
      const body = (await request.json()) as QuizAnswerChangeRequest
      const changes = body?.changes ?? []
      if (changes.length === 0) {
        return HttpResponse.json(
          { code: 'ANSWER_CHANGE_EMPTY', message: '변경안이 없습니다.' },
          { status: 400 },
        )
      }
      if (changes.some((c) => !c.reason?.trim())) return reasonRequired()

      let reGraded = 0
      for (const c of changes) {
        const row = state.rows.find((r) => r.questionId === c.questionId)
        if (!row) continue
        state.changeLogs.push({
          id: `qcl_${Date.now()}_${c.questionId}`,
          questionId: c.questionId,
          beforeAnswerKey: row.currentAnswerKey,
          afterAnswerKey: c.afterAnswerKey,
          changedBy: '김운영',
          changedByRole: 'MANAGER',
          reGradedSubmissionCount: row.affectedCount,
          inProgressAttemptCount: IN_PROGRESS_ATTEMPTS,
          reason: c.reason,
          changedAt: new Date().toISOString(),
        })
        reGraded += row.affectedCount
        row.currentAnswerKey = c.afterAnswerKey
        row.maxPoints = c.maxPoints
        row.proposedAnswerKey = null
        row.affectedCount = 0
        row.status = 'normal'
      }
      // QUIZ_ATTEMPT_IN_PROGRESS_EXCLUDED — 에러 아님(200), summary에 제외 수만 포함.
      return ok({
        savedCount: changes.length,
        reGradedSubmissionCount: reGraded,
        inProgressAttemptCount: IN_PROGRESS_ATTEMPTS,
      })
    },
  ),

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
