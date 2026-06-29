import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import type { InstructorQuestion } from '@/shared/types'
import {
  useDeleteTemplateQuestion,
  useSaveTemplateQuestion,
  useTemplateQuestions,
} from '../api/quizTemplates'
import { QuestionWorkbench } from '../quizzes/QuestionWorkbench'

// 본문 첫 줄을 좌측 목록 요약(summary)으로 축약 — mocks.ts와 동일 규칙.
function summarize(body: string): string {
  const firstLine = body.trim().split('\n')[0] ?? ''
  return firstLine.length > 24 ? `${firstLine.slice(0, 24)}…` : firstLine
}

// 템플릿 문항 관리 (/instructor/quiz-templates/:templateId/questions) — §10. (Figma 3547:2247)
// 워크벤치 공용 골격 + 템플릿 문맥(사용 횟수·파생 활성 메타, 복제 시 노출 안내).
export default function TemplateQuestionsPage() {
  const { templateId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useTemplateQuestions(templateId)
  const saveQuestion = useSaveTemplateQuestion(templateId)
  const deleteQuestion = useDeleteTemplateQuestion(templateId)
  // mock 환경 — invalidate 후 refetch가 즉시 반영되지 않아 로컬에서도 즉시 갱신.
  const [questions, setQuestions] = useState<InstructorQuestion[]>([])
  useEffect(() => {
    if (data) setQuestions(data.questions)
  }, [data])
  usePageHeader(
    '템플릿 문항 관리',
    '문제 풀 편집 · 배점 합계 검증 — 변경은 다음 복제부터 반영',
  )

  if (isPending) {
    return <div className="text-fg-muted p-8">템플릿 문항을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="템플릿 문항을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  // 순번 재계산 — 추가/삭제/복제 후 1..N으로 정렬.
  const renumber = (list: InstructorQuestion[]) =>
    list.map((q, i) => ({ ...q, order: i + 1 }))

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  const handleAdd = () => {
    const today = new Date().toISOString().slice(0, 10)
    const local: InstructorQuestion = {
      id: `tq-local-${Date.now()}`,
      order: questions.length + 1,
      type: 'multiple_choice',
      points: 0,
      summary: '새 문항',
      body: '',
      modelAnswer: '',
      explanation: '',
      category: '알고리즘 · 재귀',
      difficulty: 'normal',
      createdAt: today,
      updatedAt: today,
      respondedCount: 0,
      totalCount: 0,
      avgScore: null,
    }
    setQuestions((prev) => renumber([...prev, local]))
    saveQuestion.mutate(
      {
        type: local.type,
        points: local.points,
        body: local.body,
        modelAnswer: local.modelAnswer,
        explanation: local.explanation,
        category: local.category,
        difficulty: local.difficulty,
      },
      {
        onSuccess: () => toast.success('새 문항 추가됨 — 다음 복제부터 반영'),
        onError: () =>
          toast.danger('문항 추가에 실패했어요. 다시 시도해 주세요.'),
      },
    )
  }

  const handleSave = (draft: InstructorQuestion) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === draft.id
          ? { ...draft, summary: summarize(draft.body) || draft.summary }
          : q,
      ),
    )
    saveQuestion.mutate(
      {
        type: draft.type,
        points: draft.points,
        body: draft.body,
        modelAnswer: draft.modelAnswer,
        explanation: draft.explanation,
        category: draft.category,
        difficulty: draft.difficulty,
      },
      {
        onSuccess: () =>
          toast.success('템플릿 문항 저장됨 — 다음 복제부터 반영'),
        onError: () =>
          toast.danger('문항 저장에 실패했어요. 다시 시도해 주세요.'),
      },
    )
  }

  const handleDelete = (id: string) => {
    setQuestions((prev) => renumber(prev.filter((q) => q.id !== id)))
    deleteQuestion.mutate(id, {
      onSuccess: () => toast.success('문항이 삭제됐어요'),
      onError: () =>
        toast.danger('문항 삭제에 실패했어요. 다시 시도해 주세요.'),
    })
  }

  const handleCopy = (id: string) => {
    const src = questions.find((q) => q.id === id)
    if (!src) return
    const today = new Date().toISOString().slice(0, 10)
    const copy: InstructorQuestion = {
      ...src,
      id: `tq-local-${Date.now()}`,
      order: questions.length + 1,
      createdAt: today,
      updatedAt: today,
    }
    setQuestions((prev) => renumber([...prev, copy]))
    saveQuestion.mutate(
      {
        type: src.type,
        points: src.points,
        body: src.body,
        modelAnswer: src.modelAnswer,
        explanation: src.explanation,
        category: src.category,
        difficulty: src.difficulty,
      },
      {
        onSuccess: () => toast.success('문항이 복제됐어요'),
        onError: () =>
          toast.danger('문항 복제에 실패했어요. 다시 시도해 주세요.'),
      },
    )
  }

  return (
    <QuestionWorkbench
      subjectLabel="템플릿"
      subjectName={data.templateName}
      gradingMode={data.gradingMode}
      totalPoints={totalPoints}
      targetPoints={data.targetPoints}
      questions={questions}
      listTitle="템플릿 문항 목록"
      itemNoun="문항"
      back={{
        label: '← 템플릿 설정으로',
        onClick: () =>
          navigate(`/instructor/quiz-templates/${templateId}/edit`),
      }}
      previewLabel="템플릿 미리보기"
      bodyHint="복제된 퀴즈에서 학생에게 노출 — 마크다운 지원"
      modelAnswerHint="수동 채점 기준 — 학생에게 비공개"
      explanationHint="복제된 퀴즈 결과 화면에서 노출"
      manualHint="복제된 퀴즈에서 수동 채점으로 연결"
      saveToastMessage="템플릿 문항 저장 — 다음 복제부터 반영 (mock)"
      onAddQuestion={handleAdd}
      onSaveQuestion={handleSave}
      onDeleteQuestion={handleDelete}
      onCopyQuestion={handleCopy}
      metaItems={(draft) => [
        `작성일: ${draft.createdAt}`,
        `최근 수정: ${draft.updatedAt}`,
        `사용 횟수: ${data.useCount}회`,
        `파생 활성 퀴즈: ${data.derivedActiveCount}건`,
      ]}
    />
  )
}
