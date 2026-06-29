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

export interface SaveQuizQuestionInput {
  type: 'multiple_choice' | 'short_answer' | 'fill_blank' | 'essay'
  prompt: string
  choices?: string[]
  answerIndex?: number
  answerText?: string
  answers?: string[]
  blankScores?: number[]
  explanation?: string
  points: number
}
// 문항 추가(POST) 또는 수정(PATCH, questionId 지정)
export function useSaveQuizQuestion(quizId: string, questionId?: string) {
  const qc = useQueryClient()
  return useMutation<unknown, Error, SaveQuizQuestionInput>({
    mutationFn: (input) =>
      (questionId
        ? apiClient.patch(
            `/instructor/quizzes/${quizId}/questions/${questionId}`,
            input,
          )
        : apiClient.post(`/instructor/quizzes/${quizId}/questions`, input)
      ).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: instructorKeys.quizQuestions(quizId) }),
  })
}

export function useDeleteQuizQuestion(quizId: string) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (questionId) =>
      apiClient
        .delete<void>(`/instructor/quizzes/${quizId}/questions/${questionId}`)
        .then(() => undefined),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: instructorKeys.quizQuestions(quizId) }),
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

export interface SaveGradingInput {
  items: {
    questionId: string
    score: number | null
    feedback: string
    feedbackVisible: boolean
  }[]
}
/** 수동 채점 저장(PATCH) — 점수/피드백 반영 후 갱신된 채점 상세 반환. */
export function useSaveGrading(quizId: string, submissionId: string) {
  const qc = useQueryClient()
  return useMutation<GradingDetail, Error, SaveGradingInput>({
    mutationFn: (input) =>
      apiClient
        .patch<GradingDetail>(
          `/instructor/quizzes/${quizId}/submissions/${submissionId}/grade`,
          input,
        )
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: instructorKeys.quizGrading(quizId, submissionId),
      })
      qc.invalidateQueries({ queryKey: instructorKeys.quizSubmissions(quizId) })
    },
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
