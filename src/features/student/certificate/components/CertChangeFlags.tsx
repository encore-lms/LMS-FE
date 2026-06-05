import { cn } from '@/shared/lib/cn'
import type { CertChangeFlag, Tone } from '../types'

// 보완이 필요한 항목 — 미리보기 상단 경고 카드들(점수/산출물/개인정보).
const BADGE: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}

export function CertChangeFlags({ flags }: { flags: CertChangeFlag[] }) {
  if (flags.length === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-fg text-[15px] font-bold">보완이 필요한 항목</h2>
        <span className="bg-warning-bg text-warning rounded-md px-2 py-0.5 text-[11px] font-bold">
          {flags.length}건
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {flags.map((f) => (
          <div
            key={f.id}
            className="border-border bg-surface flex flex-col gap-1.5 rounded-[12px] border p-4"
          >
            <span
              className={cn(
                'w-fit rounded-md px-2 py-0.5 text-[10px] font-bold',
                BADGE[f.badgeTone],
              )}
            >
              {f.badge}
            </span>
            <span className="text-fg text-[13px] font-semibold">{f.title}</span>
            <span className="text-fg-muted text-[11px] leading-4">
              {f.detail}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
