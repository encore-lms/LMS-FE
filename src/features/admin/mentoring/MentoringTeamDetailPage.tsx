import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { usePageHeader } from '@/shared/store'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { useMentoringTeamDetail } from './api'
import { TeamDetailBody } from './TeamDetailBody'

// 멘토링 팀 상세 (/admin/mentoring/teams/:teamId) — 카드 클릭 진입.
// 개요 + 할 일·경고 스트립 + 누적 인정시간 추이 + 일지 상태 도넛 + 일지 타임라인 + 멘티 명단.

export default function MentoringTeamDetailPage() {
  usePageHeader('멘토링 상세', '팀 개요 · 멘티 · 일지 · 관리')
  const { teamId } = useParams<{ teamId: string }>()
  const detail = useMentoringTeamDetail(teamId ?? null)

  return (
    <div className="p-8">
      <Link
        to="/admin/mentors/assignments"
        className="text-fg-muted hover:text-fg mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold"
      >
        <ArrowLeft className="h-4 w-4" />
        멘토 배정 관리로 돌아가기
      </Link>

      <DataBoundary
        isPending={detail.isPending}
        isError={detail.isError || !detail.data}
        onRetry={() => detail.refetch()}
        skeleton={<SkeletonListPage kpis={0} columns={4} className="" />}
        errorTitle="멘토링 상세를 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {detail.data && <TeamDetailBody d={detail.data} />}
      </DataBoundary>
    </div>
  )
}
