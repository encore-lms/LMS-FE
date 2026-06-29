import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  InstructorQuizListData,
  QuizFormDetail,
  QuizQuestionsData,
  QuizSubmissionsData,
  GradingDetail,
} from '@/shared/types'

// 강사/운영 퀴즈 Main Flow (/instructor/quizzes*) — 실 BE. cohortId 지정 시 해당 기수만.
export function useInstructorQuizzes(cohortId?: string | null) {
  return useQuery({
    queryKey: [...instructorKeys.quizzes(), cohortId ?? 'all'],
    queryFn: () =>
      apiClient
        .get<InstructorQuizListData>('/instructor/quizzes', {
          cohortId: cohortId ?? undefined,
        })
        .then((r) => r.data),
  })
}

export interface SaveQuizInput {
  cohortId: string
  title: string
  description?: string
  category?: string
  gradingMode: string
  resultReveal: string
  timeLimitMin?: number
  allowRetake: boolean
  shuffleQuestions: boolean
  shuffleChoices: boolean
  totalPoints: number
  visibility: string
  startAt?: string
  endAt?: string
}
// 생성(POST) 또는 수정(PATCH, quizId 지정)
export function useSaveQuiz(quizId?: string) {
  const qc = useQueryClient()
  return useMutation<QuizFormDetail, Error, SaveQuizInput>({
    mutationFn: (input) =>
      (quizId
        ? apiClient.patch<QuizFormDetail>(
            `/instructor/quizzes/${quizId}`,
            input,
          )
        : apiClient.post<QuizFormDetail>('/instructor/quizzes', input)
      ).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: instructorKeys.quizzes() }),
  })
}

export function useDeleteQuiz() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (quizId) =>
      apiClient
        .delete<void>(`/instructor/quizzes/${quizId}`)
        .then(() => undefined),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: instructorKeys.quizzes() }),
  })
}

export function useInstructorQuizDetail(quizId: string | null) {
  return useQuery({
    queryKey: instructorKeys.quizDetail(quizId ?? ''),
    enabled: !!quizId,
    queryFn: () =>
      apiClient
        .get<QuizFormDetail>(`/instructor/quizzes/${quizId}`)
        .then((r) => r.data),
  })
}

export function useQuizQuestions(quizId: string) {
  return useQuery({
    queryKey: instructorKeys.quizQuestions(quizId),
    queryFn: () =>
      apiClient
        .get<QuizQuestionsData>(`/instructor/quizzes/${quizId}/questions`)
        .then((r) => r.data),
  })
}

export function useQuizSubmissions(quizId: string) {
  return useQuery({
    queryKey: instructorKeys.quizSubmissions(quizId),
    queryFn: () =>
      apiClient
        .get<QuizSubmissionsData>(`/instructor/quizzes/${quizId}/submissions`)
        .then((r) => r.data),
  })
}

export function useGradingDetail(quizId: string, submissionId: string) {
  return useQuery({
    queryKey: instructorKeys.quizGrading(quizId, submissionId),
    queryFn: () =>
      apiClient
        .get<GradingDetail>(
          `/instructor/quizzes/${quizId}/submissions/${submissionId}/grade`,
        )
        .then((r) => r.data),
  })
}
