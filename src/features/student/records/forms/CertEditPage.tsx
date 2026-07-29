import { useParams, useSearchParams } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { useCertRecord } from '../../api/records'
import { CertForm } from '../components/CertForm'

// 자격증 기록 수정 (/student/records/certificate/:recordId/edit) — 기존 기록 프리필.
// ?from=draft 면 임시저장 기록 수정(저장 시 임시저장 유지).
export default function CertEditPage() {
  const { recordId = '' } = useParams()
  const [params] = useSearchParams()
  const isDraft = params.get('from') === 'draft'
  const { data, isPending, isError, refetch } = useCertRecord(recordId)
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
        <CertForm
          mode="edit"
          initial={data}
          recordId={recordId}
          isDraft={isDraft}
        />
      )}
    </DataBoundary>
  )
}
