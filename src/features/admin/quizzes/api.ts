import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import type {
  AdminGradingDetail,
  QuizAnswerChangeRequest,
  QuizAnswerImpact,
  QuizAnswersData,
} from '@/shared/types'

// 운영 퀴즈 정답 관리 — /admin/quizzes/:quizId/answers (Figma 1515:10493).
// admin 전용 엔드포인트(P0_15_24 API명세) — 강사 훅(instructor/api) 의존 금지.
// baseURL이 /api라 경로 앞에 안 붙임.

/** 정답 관리 데이터 — GET /admin/quizzes/:quizId/answers (KPI + 문항 행) */
export function useQuizAnswers(quizId: string) {
  return useQuery({
    queryKey: adminKeys.quizAnswers(quizId),
    enabled: !!quizId,
    queryFn: () =>
      apiClient
        .get<QuizAnswersData>(`/admin/quizzes/${quizId}/answers`)
        .then((r) => r.data),
  })
}

/**
 * 저장 전 영향 계산 — GET /admin/quizzes/:quizId/answers/impact (P0-ADM-QUIZ-006).
 * 수동 트리거: 버튼 클릭으로 changeKey(직렬화된 변경안)가 생겨야 enabled.
 * TODO: GET의 변경안 전달 방식은 API 문서 미확정(openQuestion) —
 *       query param changes(JSON 직렬화)로 가정, BE 확정 시 조정.
 */
export function useAnswerImpact(quizId: string, changeKey: string | null) {
  return useQuery({
    queryKey: adminKeys.quizAnswerImpact(quizId, changeKey ?? undefined),
    enabled: !!quizId && changeKey !== null,
    queryFn: () =>
      apiClient
        .get<QuizAnswerImpact>(`/admin/quizzes/${quizId}/answers/impact`, {
          changes: changeKey,
        })
        .then((r) => r.data),
  })
}

/** 변경 저장 응답 — 재채점 요약. BE 응답 DTO 확정 대기(QUIZ_ATTEMPT_IN_PROGRESS_EXCLUDED는 200 + summary 제외 수). */
export interface QuizAnswerChangeResult {
  savedCount: number
  reGradedSubmissionCount: number // 자동 재채점된 제출 수 — 토스트에 표시
  inProgressAttemptCount: number // 진행 중 응시 제외 수 — 토스트에 표시
}

/**
 * 변경 저장 mutation — POST /admin/quizzes/:quizId/answers/changes.
 * 독립 [재채점] 버튼/endpoint 없음 — 재채점은 이 저장의 결과로만 실행(P0_18 금지 계약).
 * 사유 미입력은 FE 선차단(disabled) + 서버 422 거부(P0-ADM-QUIZ-006).
 * 성공 시 정답 관리 데이터·영향 계산 캐시 무효화(impact는 quizAnswers 하위 키).
 */
export function useSaveAnswerChanges(quizId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: QuizAnswerChangeRequest) =>
      apiClient
        .post<QuizAnswerChangeResult>(
          `/admin/quizzes/${quizId}/answers/changes`,
          payload,
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.quizAnswers(quizId),
      })
    },
  })
}

// ── 운영 수동 채점 (/admin/quizzes/:quizId/submissions/:submissionId/grade — Figma 1515:10710) ──
// GET/PATCH 모두 admin 전용 엔드포인트(P0_15_24 API명세) — 강사 useGradingDetail 의존 금지.
// PATCH는 earnedPoints·피드백·공개 여부만 변경(answerPayload는 조회 전용 — 2026-06-05 확정).

/** 수동 채점 상세 — GET .../submissions/:submissionId/grade */
export function useAdminGradingDetail(quizId: string, submissionId: string) {
  return useQuery({
    queryKey: adminKeys.quizGrading(quizId, submissionId),
    enabled: !!quizId && !!submissionId,
    queryFn: () =>
      apiClient
        .get<AdminGradingDetail>(
          `/admin/quizzes/${quizId}/submissions/${submissionId}/grade`,
        )
        .then((r) => r.data),
  })
}

/** 문항 단위 채점 패치 — 점수·피드백·공개 여부만(조회 전용 answerPayload 불포함) */
export interface AdminGradeItemPatch {
  questionId: string
  earnedPoints: number | null // null = 점수 비움(미채점으로 되돌림)
  feedback: string
  feedbackVisible: boolean
}

/** PATCH 요청 — items(자동 저장) 또는 finalize(채점 완료 확정, gradingStatus=finalized) */
export interface AdminGradeSaveRequest {
  items?: AdminGradeItemPatch[]
  finalize?: boolean
  // TODO: reasonCode — BE enum 확정 대기(Figma에 사유 코드 선택 UI 없음, FE는 미전송).
  reasonCode?: string
}

/**
 * 채점 저장 mutation — PATCH .../grade.
 * 점수·피드백 blur 자동 저장과 [채점 완료] 확정이 같은 엔드포인트를 쓴다(임시 저장 = items만).
 * 성공 시 해당 제출 채점 캐시 무효화 — KPI(변경 이력·현재 점수)가 서버 상태로 갱신된다.
 */
export function useSaveGrading(quizId: string, submissionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AdminGradeSaveRequest) =>
      apiClient
        .patch<AdminGradingDetail>(
          `/admin/quizzes/${quizId}/submissions/${submissionId}/grade`,
          payload,
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.quizGrading(quizId, submissionId),
      })
    },
  })
}
