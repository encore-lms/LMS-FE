import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useBlogRecord } from '../../api/records'
import { BlogForm } from '../components/BlogForm'

// 블로그 기록 수정 (/student/records/blog/:recordId/edit) — Figma 2208:16414.
export default function BlogEditPage() {
  const { recordId = '' } = useParams()
  const { data, isPending, isError, refetch } = useBlogRecord(recordId)
  if (isPending)
    return <div className="text-fg-muted p-8">기록을 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="기록을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }
  return <BlogForm mode="edit" data={data} />
}
