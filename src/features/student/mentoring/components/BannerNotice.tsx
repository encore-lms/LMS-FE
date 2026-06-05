import { cn } from '@/shared/lib/cn'

// 멘토링 상단 인라인 알림 배너 — 요청/수락 완료(초록)·취소 완료(앰버). 아이콘+라벨+메시지+액션 링크.
export type BannerTone = 'success' | 'warning'

const TONE = {
  success: {
    box: 'bg-success-bg border-success',
    icon: 'text-success',
    label: 'text-success',
    action: 'border-success text-success',
    glyph: '✓',
  },
  warning: {
    box: 'bg-warning-bg border-warning',
    icon: 'text-warning',
    label: 'text-warning',
    action: 'border-warning text-warning',
    glyph: '!',
  },
} satisfies Record<BannerTone, Record<string, string>>

export function BannerNotice({
  tone,
  label,
  message,
  sub,
  actionLabel,
  onAction,
  onClose,
}: {
  tone: BannerTone
  label: string
  message: string
  sub?: string
  actionLabel?: string
  onAction?: () => void
  onClose?: () => void
}) {
  const t = TONE[tone]
  return (
    <div
      className={cn(
        'flex w-full items-center justify-between gap-4 rounded-[14px] border px-5 py-4',
        t.box,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'bg-surface flex size-9 shrink-0 items-center justify-center rounded-full text-[16px] font-bold',
            t.icon,
          )}
        >
          {t.glyph}
        </span>
        <div className="flex flex-col gap-0.5">
          <span
            className={cn('text-[10px] font-bold tracking-[0.12em]', t.label)}
          >
            {label}
          </span>
          <span className="text-fg text-[14px] font-bold">{message}</span>
          {sub && <span className="text-fg-muted text-[12px]">{sub}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className={cn(
              'bg-surface rounded-lg border px-3.5 py-2 text-[12px] font-semibold',
              t.action,
            )}
          >
            {actionLabel}
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-fg-subtle px-1 text-[14px]"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
