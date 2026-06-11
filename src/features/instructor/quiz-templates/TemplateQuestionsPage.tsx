import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useTemplateQuestions } from '../api/quizTemplates'
import { QuestionWorkbench } from '../quizzes/QuestionWorkbench'

// 템플릿 문항 관리 (/instructor/quiz-templates/:templateId/questions) — §10. (Figma 3547:2247)
// 워크벤치 공용 골격 + 템플릿 문맥(사용 횟수·파생 활성 메타, 복제 시 노출 안내).
export default function TemplateQuestionsPage() {
  const { templateId = '' } = useParams()
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useTemplateQuestions(templateId)
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

  return (
    <QuestionWorkbench
      subjectLabel="템플릿"
      subjectName={data.templateName}
      gradingMode={data.gradingMode}
      totalPoints={data.totalPoints}
      targetPoints={data.targetPoints}
      questions={data.questions}
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
      metaItems={(draft) => [
        `작성일: ${draft.createdAt}`,
        `최근 수정: ${draft.updatedAt}`,
        `사용 횟수: ${data.useCount}회`,
        `파생 활성 퀴즈: ${data.derivedActiveCount}건`,
      ]}
    />
  )
}
