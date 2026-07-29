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

export interface QuizCategoryOptions {
  quizCategories: string[]
  questionCategories: string[]
}
/**
 * 카테고리 추천 목록(기수 범위) — 자유 입력 폼의 datalist 소스.
 * 고정 카탈로그가 없어 표기가 갈라지면 결과 화면의 카테고리별 정답률이 쪼개진다. 이미 쓴 값을 제안해 줄인다.
 */
export function useQuizCategoryOptions(cohortId?: string) {
  return useQuery({
    queryKey: instructorKeys.quizCategoryOptions(cohortId ?? ''),
    queryFn: () =>
      apiClient
        .get<QuizCategoryOptions>(
          `/instructor/quizzes/category-options?cohortId=${cohortId}`,
        )
        .then((r) => r.data),
    enabled: !!cohortId,
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
  /** 기술 카테고리(예: Spark). 선택 — 결과 화면의 카테고리별 정답률 집계 단위. */
  category?: string
  points: number
  /** 삽입 위치(0-based). 생성 시에만 사용, 미지정이면 맨 뒤. */
  order?: number
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

// 문항 순서 재정렬(드래그) — orderedIds 순서대로 sort_order 재부여. 낙관적 업데이트.
export function useReorderQuizQuestions(quizId: string) {
  const qc = useQueryClient()
  return useMutation<
    QuizQuestionsData,
    Error,
    string[],
    { prev?: QuizQuestionsData }
  >({
    mutationFn: (orderedIds) =>
      apiClient
        .patch<QuizQuestionsData>(
          `/instructor/quizzes/${quizId}/questions/reorder`,
          { orderedIds },
        )
        .then((r) => r.data),
    onMutate: async (orderedIds) => {
      const key = instructorKeys.quizQuestions(quizId)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<QuizQuestionsData>(key)
      if (prev) {
        const byId = new Map(prev.questions.map((q) => [q.id, q]))
        const reordered = orderedIds
          .map((id) => byId.get(id))
          .filter((q): q is (typeof prev.questions)[number] => Boolean(q))
        qc.setQueryData<QuizQuestionsData>(key, {
          ...prev,
          questions: reordered,
        })
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev)
        qc.setQueryData(instructorKeys.quizQuestions(quizId), ctx.prev)
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: instructorKeys.quizQuestions(quizId) }),
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
