import { DataBoundary } from '@/components/ui/DataBoundary'
import { useCertificateOverview } from '../api/certificate'
import { CertPreview } from './components/CertPreview'

// 증명서 전체화면 미리보기 페이지 (/student/certificate/preview) — 쉘(사이드바) 밖 라우트.
// 데이터만 로드해 CertPreview(보기 전용)에 넘긴다.
export default function CertPreviewPage() {
  const { data, isPending, isError, refetch } = useCertificateOverview()

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="증명서를 불러오는 중…"
      errorTitle="증명서를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && <CertPreview data={data} />}
    </DataBoundary>
  )
}
