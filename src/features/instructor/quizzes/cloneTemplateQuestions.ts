import { apiClient } from '@/shared/api'
import type { TemplateQuestionsData } from '@/shared/types'
import type { SaveQuizQuestionInput } from '../api/quizzes'
import { buildAnswerPayload, parseAnswerDraft } from './answerDraft'

export interface CloneResult {
  copied: number
  /** 정답 미보관(구버전 데이터) 또는 저장 실패로 건너뛴 문항 수 */
  skipped: number
  total: number
}

// [새 퀴즈로 복제] — 템플릿 문항 풀을 새 퀴즈 문항으로 복사한다.
// 유형별 정답(choices/answerKey)을 퀴즈 문항 계약(SaveQuizQuestionInput)으로 변환.
// 순서 보존을 위해 정렬 순서대로 직렬 POST(맨 뒤 append).
export async function cloneTemplateQuestions(
  templateId: string,
  quizId: string,
): Promise<CloneResult> {
  const { data } = await apiClient.get<TemplateQuestionsData>(
    `/instructor/quiz-templates/${templateId}/questions`,
  )
  let copied = 0
  let skipped = 0
  for (const q of data.questions) {
    const answer = parseAnswerDraft(q.type, q.choices, q.answerKey)
    // 템플릿 서술형 채점 기준은 modelAnswer 컬럼에 보관.
    if (q.type === 'essay') answer.answerText = q.modelAnswer
    const built = buildAnswerPayload(q.type, q.body, q.points, answer)
    if (!built.ok) {
      skipped++
      continue
    }
    const input: SaveQuizQuestionInput = {
      type: q.type,
      prompt: q.body,
      points: q.points,
      explanation: q.explanation || undefined,
      category: q.category || undefined,
      ...built.fields,
    }
    try {
      await apiClient.post(`/instructor/quizzes/${quizId}/questions`, input)
      copied++
    } catch {
      skipped++
    }
  }
  // 사용 마킹(useCount·lastUsedAt) — 마킹 실패가 복제 자체를 깨면 안 되므로 무시.
  try {
    await apiClient.post(`/instructor/quiz-templates/${templateId}/use`)
  } catch {
    /* noop */
  }
  return { copied, skipped, total: data.questions.length }
}
