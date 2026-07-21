import { useParams } from 'react-router-dom'
import { usePageHeader } from '@/shared/store'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { useQnaDetail } from '../../api/qna'
import { QuestionForm } from '../components/QuestionForm'
import { QNA_CATEGORIES } from '../types'

// 질문 수정 (/student/qna/:id/edit) — 기존 값을 채운 작성 폼. 작성자만 진입(상세의 수정 버튼).
export default function EditQuestionPage() {
  const { id = '' } = useParams()
  usePageHeader('질문 수정', '질문 내용을 다듬어 다시 올려보세요.')
  const { data, isPending, isError, refetch } = useQnaDetail(id)
  // 상세는 카테고리 라벨만 주므로 key 로 역매핑(못 찾으면 기타).
  const categoryKey =
    QNA_CATEGORIES.find((c) => c.label === data?.category)?.key ?? 'etc'
  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={refetch}
      skeleton={
        <div className="p-8">
          <div className="bg-surface-muted h-96 animate-pulse rounded-2xl" />
        </div>
      }
      errorTitle="질문을 불러오지 못했어요"
      errorDescription="삭제되었거나 잘못된 주소일 수 있어요."
    >
      {data && (
        <QuestionForm
          initial={{
            id: data.id,
            title: data.title,
            categoryKey,
            content: data.content,
            tags: data.tags,
          }}
        />
      )}
    </DataBoundary>
  )
}
