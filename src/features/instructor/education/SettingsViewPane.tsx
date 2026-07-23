import { Lock } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { SkeletonText } from '@/components/ui/Skeleton'
import { useInstructorCohortDetail } from './api'

// 설정 탭(강사 조회 전용) — HRD-Net 과정 상세 카드. 단위기간·커리큘럼 설정(운영 전용)은 제외.
export function SettingsViewPane({ cohortId }: { cohortId: string }) {
  const { data, isPending, isError, refetch } =
    useInstructorCohortDetail(cohortId)

  const rows: { label: string; value: string }[] = data
    ? [
        { label: '훈련과정 구분', value: data.trainingType },
        { label: 'NCS 분류', value: data.ncsName },
        { label: '훈련기관', value: data.institution },
        { label: '소재지', value: data.address },
        { label: '지원 금액', value: data.supportAmount },
        { label: '담당자', value: data.manager },
        {
          label: '훈련기간',
          value: `~ (총 ${data.trainingDays}일 / ${data.trainingHours}시간)`,
        },
      ]
    : []

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      skeleton={
        <div className="py-6">
          <SkeletonText lines={8} />
        </div>
      }
      errorTitle="과정 설명을 불러오지 못했어요"
      errorDescription="HRD 훈련과정ID가 없는 기수이거나 HRD-Net 연결을 확인해 주세요."
    >
      {data && (
        <div className="border-border bg-surface rounded-xl border p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-fg text-lg font-bold">{data.title}</h3>
            <span className="text-info flex items-center gap-1 text-xs font-medium">
              <Lock className="h-3 w-3" /> HRD-Net 원본
            </span>
          </div>
          <dl className="mt-5 flex flex-col gap-3">
            {rows.map((r) => (
              <div key={r.label} className="flex gap-4 text-sm">
                <dt className="text-fg-muted w-24 shrink-0 font-medium">
                  {r.label}
                </dt>
                <dd className="text-fg">{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </DataBoundary>
  )
}
