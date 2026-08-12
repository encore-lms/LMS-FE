import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { MentorTeamAssignment } from '../types'
import { teamAction, type TeamActionContext } from './statusMeta'

const VARIANT_CLASS = {
  outline:
    'border-border text-fg-muted border bg-surface font-medium hover:bg-surface-muted',
  warning: 'bg-warning text-on-color font-bold hover:bg-warning/90',
  danger: 'bg-danger text-on-color font-bold hover:bg-danger/90',
} as const

// 상태별 다음 액션 버튼(Link) — 카드 CTA(block)와 테이블 행 액션 공용.
export function TeamActionLink({
  team,
  context,
  block = false,
}: {
  team: MentorTeamAssignment
  context: TeamActionContext
  block?: boolean
}) {
  const action = teamAction(team, context)
  return (
    <Link
      to={action.to}
      // 표에서는 행 전체가 팀 상세로 가는 클릭 대상이다. 전파를 끊지 않으면 '일지 수정'을
      // 눌러도 행 클릭이 뒤따라 팀 상세로 덮어써진다.
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex items-center justify-center gap-1 whitespace-nowrap',
        block
          ? 'w-full rounded-[10px] px-3.5 py-2 text-xs'
          : 'rounded-lg px-3 py-1.5 text-[11px]',
        VARIANT_CLASS[action.variant],
      )}
    >
      {action.label}
      <ArrowRight className="h-3 w-3" />
    </Link>
  )
}
