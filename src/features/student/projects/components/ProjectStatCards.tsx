import { cn } from '@/shared/lib/cn'
import {
  CheckCircle2,
  ClipboardList,
  Info,
  Pencil,
  Timer,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { StatTileCard } from '@/components/data/StatTileCard'
import type { ProjectStat, Tone } from '../types'

// 프로젝트 목록 상단 통계 4종 — 참여/인증완료/검토중/작성중.
const ICON: Record<Tone, { Icon: LucideIcon; cls: string }> = {
  brand: { Icon: ClipboardList, cls: 'bg-brand/10 text-brand' },
  success: { Icon: CheckCircle2, cls: 'bg-success-bg text-success' },
  warning: { Icon: Timer, cls: 'bg-warning-bg text-warning' },
  accent: { Icon: Pencil, cls: 'bg-accent-bg text-accent-strong' },
  info: { Icon: Info, cls: 'bg-info-bg text-info' },
  danger: { Icon: TriangleAlert, cls: 'bg-danger-bg text-danger' },
}

export function ProjectStatCards({ stats }: { stats: ProjectStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <StatCard key={s.key} stat={s} />
      ))}
    </div>
  )
}

function StatCard({ stat: s }: { stat: ProjectStat }) {
  const { Icon, cls } = ICON[s.tone]

  return (
    <StatTileCard
      label={s.label}
      value={s.value}
      unit={s.unit}
      sub={s.sub}
      headerAlign="start"
      subDivider
      badge={
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-md text-[12px] font-bold',
            cls,
          )}
        >
          <Icon className="size-3.5" strokeWidth={2.2} />
        </span>
      }
    />
  )
}
