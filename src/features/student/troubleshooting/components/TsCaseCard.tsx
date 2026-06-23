import { ArrowRight, Check, Timer, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { TsCase, TsStatus, Tone } from '../types'

// 트러블슈팅 사례 카드 — 목록 화면과 프로젝트 워크스페이스(연결된 사례)에서 공용으로 쓴다.
// 표시는 동일하고, 우상단 액션(라벨/동작)만 사용처가 주입한다.
const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}
const ACCENT: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}
const STATUS: Record<TsStatus, Tone> = {
  certified: 'success',
  reviewing: 'warning',
  draft: 'accent',
}

export function TsCaseCard({
  c,
  onOpen,
  actionLabel,
  onRemove,
  removeLabel = '연결 해제',
}: {
  c: TsCase
  onOpen: (c: TsCase) => void
  /** 우상단 버튼 라벨. 미지정 시 사례의 기본 액션(이어 작성/사례 열기). */
  actionLabel?: string
  /** 지정 시 보조 '연결 해제' 버튼을 노출(프로젝트 연결 카드 전용 — 실제 사례는 삭제하지 않음). */
  onRemove?: () => void
  removeLabel?: string
}) {
  const label = actionLabel ?? c.actionLabel
  // 작성 중(이어 작성)만 강조 버튼, 나머지는 보조 버튼.
  const primary = c.status === 'draft'
  return (
    <section className="border-border bg-surface relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-5 pl-6">
      <span
        className={cn('absolute top-0 left-0 h-full w-1', ACCENT[c.accentTone])}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'rounded px-2 py-0.5 text-[11px] font-bold',
              CHIP[c.categoryTone],
            )}
          >
            {c.category}
          </span>
          <span
            className={cn(
              'rounded px-2 py-0.5 text-[11px] font-bold',
              CHIP[STATUS[c.status]],
            )}
          >
            {c.statusLabel}
          </span>
          {c.independent && (
            <span className="bg-brand/10 text-brand flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold">
              <Check className="size-3" /> 독립 해결
            </span>
          )}
          <span className="text-fg-subtle flex items-center gap-1 text-[11px]">
            <Timer className="size-3" /> {c.days}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="border-border text-fg-muted hover:border-danger hover:text-danger inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-[12px] font-semibold"
            >
              <X className="size-3" />
              {removeLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpen(c)}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg px-4 py-2 text-[12px] font-bold',
              primary
                ? 'bg-brand text-white'
                : 'border-border text-fg-muted hover:bg-surface-muted border',
            )}
          >
            {label}
            <ArrowRight className="size-3" />
          </button>
        </div>
      </div>
      <h3 className="text-fg text-[16px] font-bold">{c.title}</h3>
      <span className="text-fg-subtle text-[11px]">
        {c.createdAt} · {c.updatedAt}
      </span>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {[
          { label: '상황', text: c.situation },
          { label: '해결', text: c.resolution },
          { label: '결과', text: c.result },
        ].map((b) => (
          <div
            key={b.label}
            className="bg-surface-muted/50 flex flex-col gap-1 rounded-[10px] p-3"
          >
            <span className="text-fg-subtle text-[11px] font-bold">
              {b.label}
            </span>
            <span className="text-fg-muted line-clamp-3 text-[12px] leading-5">
              {b.text}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {c.tags.map((t) => (
          <span key={t} className="text-fg-muted text-[11px]">
            {t}
          </span>
        ))}
      </div>
    </section>
  )
}
