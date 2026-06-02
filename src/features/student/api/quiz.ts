import { useQuery } from '@tanstack/react-query'
import { apiClient, quizKeys } from '@/shared/api'
import type { QuizListItem, QuizQuestion, QuizResult } from '@/shared/types'

// 수강생 전용 퀴즈 훅 — 엔드포인트가 /student/* 라 학생 feature 소유.
// queryFn에서 .then(r => r.data)로 언래핑(apiClient는 ApiResponse<T>={data:T} 반환).
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다.

/** 퀴즈 목록 — 이번 PR 목록 화면에서 소비 */
export function useStudentQuizzes(filter?: { cohortId?: string }) {
  return useQuery({
    queryKey: quizKeys.list(filter),
    queryFn: () =>
      apiClient
        .get<QuizListItem[]>('/student/quizzes', filter)
        .then((r) => r.data),
  })
}

/** 응시용 문제 — 다음 PR(응시 화면)에서 소비. 타입·키·mock이 준비돼 미리 둔다. */
export function useQuizQuestions(quizId: string) {
  return useQuery({
    queryKey: quizKeys.questions(quizId),
    queryFn: () =>
      apiClient
        .get<QuizQuestion[]>(`/student/quizzes/${quizId}/questions`)
        .then((r) => r.data),
    enabled: !!quizId,
  })
}

/** 결과 — 다음 PR(결과 화면)에서 소비 */
export function useQuizResult(quizId: string) {
  return useQuery({
    queryKey: quizKeys.result(quizId),
    queryFn: () =>
      apiClient
        .get<QuizResult>(`/student/quizzes/${quizId}/result`)
        .then((r) => r.data),
    enabled: !!quizId,
  })
}
