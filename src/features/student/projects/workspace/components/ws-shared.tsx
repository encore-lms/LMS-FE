// 워크스페이스 공용 프리미티브 컴포넌트.
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import type { LucideIcon } from 'lucide-react'
import type { Badge, Tone, WsTask } from '../../types'
import { TONE_SOFT, TONE_SOLID } from '@/shared/lib/tone'
import { toneOf } from './ws-style'

export function Chip({ badge }: { badge: Badge }) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[10px] font-bold',
        TONE_SOFT[badge.tone],
      )}
    >
      {badge.label}
    </span>
  )
}

export function SectionHead({
  title,
  action,
  onAction,
  /** 막힌 이유 — 있으면 버튼을 비활성화하고 그대로 툴팁에 쓴다(눌러보고 실패하지 않게). */
  actionBlockedReason,
}: {
  title: string
  action?: string
  onAction?: () => void
  actionBlockedReason?: string | null
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-fg text-[16px] font-bold">{title}</h2>
      {action && (
        <button
          type="button"
          onClick={onAction}
          disabled={!!actionBlockedReason}
          title={actionBlockedReason ?? undefined}
          className={cn(
            buttonClass({ size: 'sm' }),
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          {action}
        </button>
      )}
    </div>
  )
}

export function Avatar({ name, tone }: { name: string; tone: Tone }) {
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white',
        TONE_SOLID[tone],
      )}
    >
      {name.slice(0, 1)}
    </span>
  )
}

export function TaskCard({
  t,
  onEdit,
  onDelete,
}: {
  t: WsTask
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <div className="border-border bg-surface group flex flex-col gap-2 rounded-[12px] border p-3.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-fg min-w-0 text-[13px] font-bold [overflow-wrap:anywhere]">
          {t.title}
        </span>
        {(onEdit || onDelete) && (
          // 카드가 드래그 대상이라, 액션은 눌렀을 때만 동작하도록 이벤트 전파를 끊는다.
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            {onEdit && (
              <button
                type="button"
                aria-label={`${t.title} 수정`}
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="text-fg-subtle hover:text-fg hover:bg-surface-muted rounded px-1.5 py-0.5 text-[11px] font-semibold"
              >
                수정
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                aria-label={`${t.title} 삭제`}
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="text-danger hover:bg-danger-bg rounded px-1.5 py-0.5 text-[11px] font-semibold"
              >
                삭제
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
            TONE_SOLID[toneOf(t.assignee)],
          )}
        >
          {t.assignee.slice(0, 1)}
        </span>
        <span className="text-fg-subtle text-[11px]">
          {t.assignee} · {t.due}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {t.tags.map((tg, i) => (
          <Chip key={i} badge={tg} />
        ))}
      </div>
    </div>
  )
}

// 상세 모달 공용 — "라벨 · 값" 한 줄.

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-fg-muted text-[12px]">{label}</span>
      <span className="text-fg text-[12px] font-semibold">{value}</span>
    </div>
  )
}
// 팀원 프로필 활동 요약 박스.

export function StatBox({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="border-border flex flex-col gap-1 rounded-xl border p-3">
      <span className="text-fg-muted flex items-center gap-1.5 text-[11px]">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </span>
      <span className="text-fg text-[18px] font-bold">{value}</span>
    </div>
  )
}
// "2026-05-14 · 참석 4명" → 날짜·참석 인원 분해(인원 표기 없으면 undefined).
