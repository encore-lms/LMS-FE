import { http, HttpResponse } from 'msw'
import type {
  QuizAnswerChangeItem,
  QuizAnswerChangeLog,
  QuizAnswerChangeRequest,
  QuizAnswerImpact,
  QuizAnswerRow,
  QuizAnswersData,
} from '@/shared/types'

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
]
