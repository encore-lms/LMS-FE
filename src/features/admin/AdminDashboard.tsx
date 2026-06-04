import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { KpiCard, type KpiTone } from '@/components/data/KpiCard'
import type { MartState } from '@/shared/types'
import { useAdminDashboard } from './api/dashboard'

const MART_LABEL: Record<MartState, string> = {
  fresh: '최신',
  stale: '갱신 필요',
  recalculating: '재계산 중',
}

const MART_TONE: Record<MartState, KpiTone> = {
  fresh: 'success',
  stale: 'warning',
  recalculating: 'brand',
}

// 운영 대시보드 (/admin) — 인증·검토·마트 갱신 핵심 지표.
// (화면_구현_목록 운영 콘솔 §운영 대시보드 P0)
export default function AdminDashboard() {
  const { data, isPending, isError, refetch } = useAdminDashboard()

  if (isPending) {
    return <div className="text-fg-muted p-8">운영 현황을 불러오는 중…</div>
  }
  if (isError) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="운영 현황을 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-fg text-2xl font-bold">운영 대시보드</h1>
      <p className="text-fg-muted mt-1 text-sm">인증·검토·마트 갱신 현황</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="인증 요청"
          value={data.certificationRequests}
          tone="brand"
          hint="신규 정식 인증 요청"
        />
        <KpiCard
          label="검토 대기"
          value={data.reviewPending}
          tone="warning"
          hint="담당 배정·검토 필요"
        />
        <KpiCard
          label="보완 요청"
          value={data.changesRequested}
          hint="수강생 재요청 대기"
        />
        <KpiCard
          label="마트 갱신"
          value={MART_LABEL[data.mart.state]}
          tone={MART_TONE[data.mart.state]}
          hint={`업데이트 ${data.mart.updatedAt.slice(0, 10)}`}
        />
      </div>
    </div>
  )
}
