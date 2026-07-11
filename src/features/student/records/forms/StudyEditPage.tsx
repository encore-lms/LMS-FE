import { useParams, useSearchParams } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { useStudyRecord } from '../../api/records'
import { StudyForm } from '../components/StudyForm'

// 스터디 기록 수정 (/student/records/study/:recordId/edit) — 기존 기록 프리필.
// ?from=draft 면 임시저장 기록 수정(저장 시 임시저장 유지).
export default function StudyEditPage() {
  const { recordId = '' } = useParams()
  const [params] = useSearchParams()
  const isDraft = params.get('from') === 'draft'
  const { data, isPending, isError, refetch } = useStudyRecord(recordId)
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
      {data && (
        <StudyForm
          mode="edit"
          initial={data}
          recordId={recordId}
          isDraft={isDraft}
        />
      )}
    </DataBoundary>
  )
}
