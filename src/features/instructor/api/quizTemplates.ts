import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  GradingMode,
  InstructorQuestion,
  QuizTemplateListData,
  QuizTemplateDetail,
  ResultRevealPolicy,
  TemplateQuestionsData,
} from '@/shared/types'

// 강사 퀴즈 템플릿 §10 (/instructor/quiz-templates*) 데이터. baseURL이 /api라 경로 앞에 안 붙임.
export function useQuizTemplates() {
  return useQuery({
    queryKey: instructorKeys.quizTemplates(),
    queryFn: () =>
      apiClient
        .get<QuizTemplateListData>('/instructor/quiz-templates')
        .then((r) => r.data),
  })
}

export function useQuizTemplateDetail(templateId: string | null) {
  return useQuery({
    queryKey: instructorKeys.quizTemplateDetail(templateId ?? ''),
    enabled: !!templateId,
    queryFn: () =>
      apiClient
        .get<QuizTemplateDetail>(`/instructor/quiz-templates/${templateId}`)
        .then((r) => r.data),
  })
}

export function useTemplateQuestions(templateId: string) {
  return useQuery({
    queryKey: instructorKeys.quizTemplateQuestions(templateId),
    queryFn: () =>
      apiClient
        .get<TemplateQuestionsData>(
          `/instructor/quiz-templates/${templateId}/questions`,
        )
        .then((r) => r.data),
  })
}

// ── 템플릿 생성/수정/삭제 (mutations) — 실 BE(InstructorQuizTemplateController). ──
export interface SaveQuizTemplateInput {
  name: string
  category: string
  description?: string
  gradingMode: GradingMode
  resultReveal: ResultRevealPolicy
  shuffleQuestions: boolean
  shuffleChoices: boolean
  totalPoints: number
  defaultTimeLimitMin: number
}
// 생성(POST) 또는 수정(PUT, templateId 지정) — 갱신된 상세를 반환.
export function useSaveQuizTemplate(templateId?: string) {
  const qc = useQueryClient()
  return useMutation<QuizTemplateDetail, Error, SaveQuizTemplateInput>({
    mutationFn: (input) =>
      (templateId
        ? apiClient.put<QuizTemplateDetail>(
            `/instructor/quiz-templates/${templateId}`,
            input,
          )
        : apiClient.post<QuizTemplateDetail>(
            '/instructor/quiz-templates',
            input,
          )
      ).then((r) => r.data),
    onSuccess: (detail) => {
      qc.invalidateQueries({ queryKey: instructorKeys.quizTemplates() })
      qc.invalidateQueries({
        queryKey: instructorKeys.quizTemplateDetail(detail.id),
      })
    },
  })
}

// 템플릿 삭제 — 목록에서 제거. (사용 중 템플릿 비활성 규칙은 호출부에서 유지)
export function useDeleteQuizTemplate() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (templateId) =>
      apiClient
        .delete<void>(`/instructor/quiz-templates/${templateId}`)
        .then(() => undefined),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: instructorKeys.quizTemplates() }),
  })
}

// ── 템플릿 문항 추가/수정/삭제 (mutations) — 실 BE. ──
export interface SaveTemplateQuestionInput {
  type: InstructorQuestion['type']
  points: number
  body: string
  modelAnswer: string
  explanation: string
  category: string
  difficulty: InstructorQuestion['difficulty']
  // 유형별 정답 — 퀴즈 문항(SaveQuizQuestionInput)과 동일 계약.
  choices?: string[]
  answerIndex?: number
  answerText?: string
  answers?: string[]
  blankScores?: number[]
}
// 문항 추가(POST) 또는 수정(PUT, questionId 지정) — 갱신된 문항 풀을 반환.
export function useSaveTemplateQuestion(templateId: string) {
  const qc = useQueryClient()
  return useMutation<
    TemplateQuestionsData,
    Error,
    { questionId?: string; input: SaveTemplateQuestionInput }
  >({
    mutationFn: ({ questionId, input }) =>
      (questionId
        ? apiClient.put<TemplateQuestionsData>(
            `/instructor/quiz-templates/${templateId}/questions/${questionId}`,
            input,
          )
        : apiClient.post<TemplateQuestionsData>(
            `/instructor/quiz-templates/${templateId}/questions`,
            input,
          )
      ).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: instructorKeys.quizTemplateQuestions(templateId),
      })
    },
  })
}

// 템플릿 문항 삭제 — 문항 풀에서 제거.
export function useDeleteTemplateQuestion(templateId: string) {
  const qc = useQueryClient()
  return useMutation<TemplateQuestionsData, Error, string>({
    mutationFn: (questionId) =>
      apiClient
        .delete<TemplateQuestionsData>(
          `/instructor/quiz-templates/${templateId}/questions/${questionId}`,
        )
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: instructorKeys.quizTemplateQuestions(templateId),
      })
    },
  })
}
