import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import type {
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
