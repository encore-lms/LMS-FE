import { Check, Send } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { MentorTeamAssignment } from '../types'
import { TEAM_STATUS_META } from './statusMeta'
import { CohortChip, TeamStatusChip } from './chips'
import { ProgressBar } from './ProgressBar'
import { TeamActionLink } from './TeamActionLink'

// 팀 요약 카드 — 대시보드·내 배정 팀 공용. withStatusBar: 좌측 세로 상태 컬러 바 변형(내 배정 팀).
export function TeamSummaryCard({
  team,
  withStatusBar = false,
}: {
  team: MentorTeamAssignment
  withStatusBar?: boolean
}) {
  const meta = TEAM_STATUS_META[team.status]
  return (
    <div
      className={cn(
        'bg-surface relative flex flex-col gap-3 rounded-2xl p-5 shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(18,23,38,0.05)]',
        withStatusBar && 'overflow-hidden',
      )}
    >
      {withStatusBar && (
        <span
          className={cn('absolute inset-y-0 left-0 w-1.5', meta.bar)}
          aria-hidden
        />
      )}
      <div className="flex items-center justify-between gap-2">
        <CohortChip label={team.cohortLabel} />
        <TeamStatusChip status={team.status} />
      </div>
      <p className="text-fg text-[17px] font-bold">{team.teamName}</p>
      <p className="text-fg-muted flex items-center gap-1 text-[11px] font-medium">
        <Send className="h-3 w-3" />
        팀원 {team.memberCount}명
      </p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-end justify-between gap-2">
          <span className="text-fg-subtle text-[11px] font-medium">
            인정 / 배정 시간
          </span>
          <span
            className={cn(
              'text-[13px] font-bold',
              team.nHoursDone ? 'text-success' : 'text-fg',
            )}
          >
            {team.recognizedHours}h{' '}
            <span className="text-fg-subtle text-[11px] font-medium">
              / {team.allocatedHours}h
            </span>
          </span>
        </div>
        <ProgressBar
          value={team.recognizedHours}
          max={team.allocatedHours}
          fillClass={meta.fill}
        />
      </div>
      {team.nHoursDone && (
        <p className="text-success flex items-center gap-1 text-[11px] font-bold">
          <Check className="h-3 w-3" />
          N시간 완료
        </p>
      )}
      <TeamActionLink team={team} context="card" block />
    </div>
  )
}
