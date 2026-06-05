import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useBlogForm } from '../../api/records'
import { BlogForm } from '../components/BlogForm'

// 블로그 등록 폼 (/student/records/new/blog) — Figma 267:27.
export default function BlogFormPage() {
  const { data, isPending, isError, refetch } = useBlogForm()
  if (isPending)
    return <div className="text-fg-muted p-8">폼을 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="폼을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }
  return <BlogForm mode="create" data={data} />
}
