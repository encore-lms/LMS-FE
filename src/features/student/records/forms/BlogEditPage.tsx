import { useParams } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { useBlogRecord } from '../../api/records'
import { BlogForm } from '../components/BlogForm'

// 블로그 기록 수정 (/student/records/blog/:recordId/edit) — Figma 2208:16414.
export default function BlogEditPage() {
  const { recordId = '' } = useParams()
  const { data, isPending, isError, refetch } = useBlogRecord(recordId)
  return (
    <DataBoundary
      isPending={isPending}
      isError={isError}
      onRetry={refetch}
      loadingText="기록을 불러오는 중…"
      errorTitle="기록을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && <BlogForm mode="edit" data={data} recordId={recordId} />}
    </DataBoundary>
  )
}
