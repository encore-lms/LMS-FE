import { useNavigate, useParams } from 'react-router-dom'
import { useQuizBasePath } from './useQuizBasePath'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useQuizQuestions } from '../api/quizzes'
import { QuestionWorkbench } from './QuestionWorkbench'

// 문제 관리 (/instructor/quizzes/:quizId/questions) — §7. (Figma 1341:9831)
// 워크벤치 공용 골격 + 퀴즈 문맥(응답 수·평균 점수 메타, 자동 재채점 안내).
export default function QuestionManagePage() {
  const { quizId = '' } = useParams()
  const navigate = useNavigate()
  const base = useQuizBasePath()
  const { data, isPending, isError, refetch } = useQuizQuestions(quizId)
  usePageHeader('문제 관리', '문항 편집 · 배점 합계 검증 · 학생 미리보기')

  if (isPending) {
    return <div className="text-fg-muted p-8">문제 목록을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="문제 목록을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  return (
    <QuestionWorkbench
      subjectLabel="퀴즈"
      subjectName={data.quizTitle}
      gradingMode={data.gradingMode}
      totalPoints={data.totalPoints}
      targetPoints={data.targetPoints}
      questions={data.questions}
      listTitle="문제 목록"
      itemNoun="문제"
      back={{
        label: '← 퀴즈 설정으로',
        onClick: () => navigate(`${base}/${quizId}/edit`),
      }}
      previewLabel="학생 미리보기"
      bodyHint="학생에게 그대로 노출 — 마크다운 지원"
      modelAnswerHint="강사 채점 시 참고용 — 학생에게 비공개"
      explanationHint="결과 화면에서 학생에게 노출"
      manualHint="주관식은 수동으로 자동 연결됨"
      saveToastMessage="문제 저장 — 정답/배점 변경 시 자동 재채점 (mock)"
      metaItems={(draft) => [
        `작성일: ${draft.createdAt}`,
        `최근 수정: ${draft.updatedAt}`,
        `응답 수: ${draft.respondedCount} / ${draft.totalCount}`,
        `평균 점수: ${draft.avgScore !== null ? `${draft.avgScore} / ${draft.points}` : '-'}`,
      ]}
    />
  )
}
