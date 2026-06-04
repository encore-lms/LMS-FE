import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

// 번호가 매겨진 스텝 카드 래퍼 — 동그란 번호 + 제목 + 단계 성격 배지(필수/보조토글/권장/선택).
type StepBadge = 'required' | 'toggle' | 'recommended' | 'optional'

const BADGE: Record<StepBadge, { label: string; className: string }> = {
  required: { label: '필수', className: 'bg-danger-bg text-danger' },
  toggle: { label: '보조 토글', className: 'bg-surface-muted text-fg-muted' },
  recommended: { label: '권장', className: 'bg-info-bg text-info' },
  optional: { label: '선택', className: 'bg-surface-muted text-fg-muted' },
}

export function FormStepCard({
  step,
  title,
  badge,
  children,
}: {
  step: number
  title: string
  badge: StepBadge
  children: ReactNode
}) {
  const b = BADGE[badge]
  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-6">
      <div className="flex items-center gap-2">
        <span className="bg-brand flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white">
          {step}
        </span>
        <h2 className="text-fg font-bold">{title}</h2>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            b.className,
          )}
        >
          {b.label}
        </span>
      </div>
      {children}
    </section>
  )
}
