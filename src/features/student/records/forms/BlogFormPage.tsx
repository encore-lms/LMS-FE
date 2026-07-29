import { DataBoundary } from '@/components/ui/DataBoundary'
import { useBlogForm } from '../../api/records'
import { BlogForm } from '../components/BlogForm'

// 블로그 등록 폼 (/student/records/new/blog) — Figma 267:27.
export default function BlogFormPage() {
  const { data, isPending, isError, refetch } = useBlogForm()
  return (
    <DataBoundary
      isPending={isPending}
      isError={isError}
      onRetry={refetch}
      loadingText="폼을 불러오는 중…"
      errorTitle="폼을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && <BlogForm mode="create" data={data} />}
    </DataBoundary>
  )
}
