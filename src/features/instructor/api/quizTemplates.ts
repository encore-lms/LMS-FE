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

// ── 템플릿 생성/수정/삭제 (mutations) — mock 백엔드. 실 BE 계약 확정 시 페어가 shared PR로 교체. ──
// ⚠️ 퀴즈(quizzes)·과제(assignments)는 실 BE라 여기서 건드리지 않는다(템플릿 전용).
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

// ── 템플릿 문항 추가/수정/삭제 (mutations) — mock 백엔드. ──
export interface SaveTemplateQuestionInput {
  type: InstructorQuestion['type']
  points: number
  body: string
  modelAnswer: string
  explanation: string
  category: string
  difficulty: InstructorQuestion['difficulty']
}
// 문항 추가(POST) 또는 수정(PUT, questionId 지정) — 갱신된 문항 풀을 반환.
export function useSaveTemplateQuestion(
  templateId: string,
  questionId?: string,
) {
  const qc = useQueryClient()
  return useMutation<TemplateQuestionsData, Error, SaveTemplateQuestionInput>({
    mutationFn: (input) =>
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
