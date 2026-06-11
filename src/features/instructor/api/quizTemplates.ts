import { useQuery } from '@tanstack/react-query'
import { apiClient, instructorKeys } from '@/shared/api'
import type {
  QuizTemplateListData,
  QuizTemplateDetail,
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
