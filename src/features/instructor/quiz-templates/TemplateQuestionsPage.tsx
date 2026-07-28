import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import type { InstructorQuestion } from '@/shared/types'
import {
  useDeleteTemplateQuestion,
  useSaveTemplateQuestion,
  useTemplateQuestions,
  type SaveTemplateQuestionInput,
} from '../api/quizTemplates'
import {
  buildAnswerPayload,
  parseAnswerDraft,
  type AnswerDraft,
} from '../quizzes/answerDraft'
import { QuestionWorkbench } from '../quizzes/QuestionWorkbench'
import { QuestionPreviewModal } from './QuestionPreviewModal'

// 미저장 로컬 드래프트 id 접두사 — 저장 성공 시 서버 문항으로 교체된다.
const LOCAL_PREFIX = 'tq-local-'
const isLocalId = (id: string) => id.startsWith(LOCAL_PREFIX)

// 순번 재계산 — 서버 목록 뒤에 미저장 로컬 드래프트를 1..N으로 이어 붙인다.
const renumber = (list: InstructorQuestion[]) =>
  list.map((q, i) => ({ ...q, order: i + 1 }))
const withLocals = (server: InstructorQuestion[], prev: InstructorQuestion[]) =>
  renumber([...server, ...prev.filter((q) => isLocalId(q.id))])

// BE 검증 메시지가 있으면 그대로 노출.
function apiMessage(e: unknown): string | undefined {
  return (e as { response?: { data?: { message?: string } } })?.response?.data
    ?.message
}

// 템플릿 문항 관리 (/instructor/quiz-templates/:templateId/questions) — §10. (Figma 3547:2247)
// 워크벤치 공용 골격 + 템플릿 문맥(사용 횟수·파생 활성 메타, 복제 시 노출 안내).
// 추가=미저장 로컬 드래프트 → 저장 시 POST, 기존 문항 저장=PUT. 목록은 서버 응답으로 재동기화.
export default function TemplateQuestionsPage() {
  const { templateId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useTemplateQuestions(templateId)
  const saveQuestion = useSaveTemplateQuestion(templateId)
  const deleteQuestion = useDeleteTemplateQuestion(templateId)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  // 서버 목록 + 미저장 로컬 드래프트 병합 상태.
  const [questions, setQuestions] = useState<InstructorQuestion[]>([])
  const mergeServer = (server: InstructorQuestion[]) =>
    setQuestions((prev) => withLocals(server, prev))

  useEffect(() => {
    if (data) setQuestions((prev) => withLocals(data.questions, prev))
  }, [data])

  usePageHeader(
    '템플릿 문항 관리',
    '템플릿에 사용할 문제를 추가하고 관리합니다',
  )

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  // 추가 — 미저장 로컬 드래프트만 만들고, 저장 버튼에서 POST.
  const handleAdd = () => {
    const today = new Date().toISOString().slice(0, 10)
    const local: InstructorQuestion = {
      id: `${LOCAL_PREFIX}${Date.now()}`,
      order: questions.length + 1,
      type: 'multiple_choice',
      points: 10,
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
    setActiveId(local.id)
  }

  // 저장 — 로컬 드래프트는 POST(신규), 서버 문항은 PUT(수정).
  const handleSave = (draft: InstructorQuestion, answer: AnswerDraft) => {
    if (!draft.body.trim()) {
      toast.danger('문항 내용을 입력해 주세요')
      return
    }
    const built = buildAnswerPayload(
      draft.type,
      draft.body,
      draft.points,
      answer,
    )
    if (!built.ok) {
      toast.danger(built.error)
      return
    }
    const creating = isLocalId(draft.id)
    const input: SaveTemplateQuestionInput = {
      type: draft.type,
      points: draft.points,
      body: draft.body,
      // 서술형 채점 기준은 modelAnswer 컬럼에 보관(정답 없음).
      modelAnswer:
        draft.type === 'essay' ? answer.answerText : draft.modelAnswer,
      explanation: draft.explanation,
      category: draft.category,
      difficulty: draft.difficulty,
      ...built.fields,
    }
    saveQuestion.mutate(
      { questionId: creating ? undefined : draft.id, input },
      {
        onSuccess: (fresh) => {
          setQuestions((prev) =>
            renumber([
              ...fresh.questions,
              ...prev.filter((q) => isLocalId(q.id) && q.id !== draft.id),
            ]),
          )
          // 신규는 서버가 부여한 id(맨 뒤)로 선택 유지.
          if (creating) setActiveId(fresh.questions.at(-1)?.id ?? null)
          toast.success(
            creating
              ? '새 문항 추가됨 — 다음 복제부터 반영'
              : '템플릿 문항 저장됨 — 다음 복제부터 반영',
          )
        },
        onError: (e) =>
          toast.danger(
            apiMessage(e) ?? '문항 저장에 실패했어요. 다시 시도해 주세요.',
          ),
      },
    )
  }

  const handleDelete = (id: string) => {
    if (isLocalId(id)) {
      setQuestions((prev) => renumber(prev.filter((q) => q.id !== id)))
      if (activeId === id) setActiveId(null)
      return
    }
    deleteQuestion.mutate(id, {
      onSuccess: (fresh) => {
        mergeServer(fresh.questions)
        if (activeId === id) setActiveId(null)
        toast.success('문항이 삭제됐어요')
      },
      onError: (e) =>
        toast.danger(
          apiMessage(e) ?? '문항 삭제에 실패했어요. 다시 시도해 주세요.',
        ),
    })
  }

  // 복제 — 정답 정보까지 그대로 POST. 미저장/정답 미비 문항은 로컬 드래프트로 복제.
  const handleCopy = (id: string) => {
    const src = questions.find((q) => q.id === id)
    if (!src) return
    const localCopy = () => {
      const today = new Date().toISOString().slice(0, 10)
      const copy: InstructorQuestion = {
        ...src,
        id: `${LOCAL_PREFIX}${Date.now()}`,
        order: questions.length + 1,
        createdAt: today,
        updatedAt: today,
      }
      setQuestions((prev) => renumber([...prev, copy]))
      setActiveId(copy.id)
    }
    if (isLocalId(src.id)) {
      localCopy()
      return
    }
    const answer = parseAnswerDraft(src.type, src.choices, src.answerKey)
    if (src.type === 'essay') answer.answerText = src.modelAnswer
    const built = buildAnswerPayload(src.type, src.body, src.points, answer)
    if (!built.ok) {
      // 구버전 문항(정답 미보관) — 미저장 복제본을 만들어 정답 입력을 유도.
      localCopy()
      toast.info('원본에 정답 정보가 없어요 — 정답을 입력하고 저장해 주세요')
      return
    }
    saveQuestion.mutate(
      {
        input: {
          type: src.type,
          points: src.points,
          body: src.body,
          modelAnswer: src.modelAnswer,
          explanation: src.explanation,
          category: src.category,
          difficulty: src.difficulty,
          ...built.fields,
        },
      },
      {
        onSuccess: (fresh) => {
          mergeServer(fresh.questions)
          setActiveId(fresh.questions.at(-1)?.id ?? null)
          toast.success('문항이 복제됐어요')
        },
        onError: (e) =>
          toast.danger(
            apiMessage(e) ?? '문항 복제에 실패했어요. 다시 시도해 주세요.',
          ),
      },
    )
  }

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="템플릿 문항을 불러오는 중…"
      errorTitle="템플릿 문항을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <>
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
            explanationHint="복제된 퀴즈 결과 화면에서 노출"
            manualHint="복제된 퀴즈에서 수동 채점으로 연결"
            saveToastMessage="템플릿 문항 저장 — 다음 복제부터 반영"
            activeId={activeId}
            onActiveIdChange={setActiveId}
            isUnsaved={(q) => isLocalId(q.id)}
            onAddQuestion={handleAdd}
            onSaveQuestion={handleSave}
            onDeleteQuestion={handleDelete}
            onCopyQuestion={handleCopy}
            onPreview={() => setPreviewOpen(true)}
            metaItems={(draft) => [
              `작성일: ${draft.createdAt}`,
              `최근 수정: ${draft.updatedAt}`,
              `사용 횟수: ${data.useCount}회`,
              `파생 활성 퀴즈: ${data.derivedActiveCount}건`,
            ]}
          />
          <QuestionPreviewModal
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            title="템플릿 미리보기"
            subjectName={data.templateName}
            gradingMode={data.gradingMode}
            totalPoints={totalPoints}
            questions={questions}
          />
        </>
      )}
    </DataBoundary>
  )
}
