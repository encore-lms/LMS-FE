import { cn } from '@/shared/lib/cn'
import type { MentorTeamMemberRole, MentoringRequestStatus } from '../types'
import { REQUEST_STATUS_META } from './requestMeta'

// 예약 화면 전용 칩 — Figma 2553:3820/3942 카드·모달 공용.

/** 예약 상태 칩 — 아이콘 + 라벨(요청 대기/조정 제안/확정/완료/거절/취소). */
export function RequestStatusChip({
  status,
}: {
  status: MentoringRequestStatus
}) {
  const meta = REQUEST_STATUS_META[status]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] text-[11px] font-bold whitespace-nowrap',
        meta.chip,
      )}
    >
      <Icon className="h-[11px] w-[11px]" />
      {meta.label}
    </span>
  )
}

/** 처리 마감 D-day 칩 — 'D-2'. 계산 규칙 BE 확정 대기(Figma 대표값). */
export function DdayChip({ label }: { label: string }) {
  return (
    <span className="bg-danger-bg text-danger inline-flex rounded-[5px] px-2 py-[3px] text-[11px] font-bold whitespace-nowrap">
      {label}
    </span>
  )
}

/** 요청자 역할 태그 — PM(accent solid) / 팀원(muted). */
export function RoleBadge({ role }: { role: MentorTeamMemberRole }) {
  return role === 'pm' ? (
    <span className="bg-accent-strong text-on-color inline-flex rounded px-[5px] py-px text-[9px] font-bold">
      PM
    </span>
  ) : (
    <span className="bg-surface-muted text-fg-subtle inline-flex rounded px-[5px] py-px text-[9px] font-bold">
      팀원
    </span>
  )
}

/** 미니 라벨 칩 — '희망 일정'·'확정 일정' 등 박스 헤더(흰 bg + border). */
export function SlotLabelChip({ label }: { label: string }) {
  return (
    <span className="bg-surface border-border text-fg-subtle self-start rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-[0.6px] whitespace-nowrap">
      {label}
    </span>
  )
}
