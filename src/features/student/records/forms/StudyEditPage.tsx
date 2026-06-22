import { useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useStudyRecord } from '../../api/records'
import { StudyForm } from '../components/StudyForm'

// 스터디 기록 수정 (/student/records/study/:recordId/edit) — 기존 기록 프리필.
// ?from=draft 면 임시저장 기록 수정(저장 시 임시저장 유지).
export default function StudyEditPage() {
  const { recordId = '' } = useParams()
  const [params] = useSearchParams()
  const isDraft = params.get('from') === 'draft'
  const { data, isPending, isError, refetch } = useStudyRecord(recordId)
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
  return (
    <StudyForm
      mode="edit"
      initial={data}
      recordId={recordId}
      isDraft={isDraft}
    />
  )
}
