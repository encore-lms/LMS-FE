import { useQuery } from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  InstructorQuizListData,
  QuizFormDetail,
  QuizQuestionsData,
  QuizSubmissionsData,
  GradingDetail,
} from '@/shared/types'

// 강사 퀴즈 Main Flow (/instructor/quizzes*) 데이터. baseURL이 /api라 경로 앞에 안 붙임.
export function useInstructorQuizzes() {
  return useQuery({
    queryKey: instructorKeys.quizzes(),
    queryFn: () =>
      apiClient
        .get<InstructorQuizListData>('/instructor/quizzes')
        .then((r) => r.data),
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
