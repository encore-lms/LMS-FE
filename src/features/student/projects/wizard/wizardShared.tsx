import { type ReactNode } from 'react'
import { Pencil, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { type Tone } from '../types'
import { TONE_SOLID } from '@/shared/lib/tone'
import { card } from './wizardConstants'

/* ── 공용 소품 — 상수는 wizardConstants.ts, 컴포넌트만 여기(react-refresh 분리) ── */
export function Field({
  label,
  required,
  counter,
  children,
}: {
  label: string
  required?: boolean
  counter?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-fg text-[13px] font-bold">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </span>
        {counter && (
          <span className="text-fg-subtle text-[11px]">{counter}</span>
        )}
      </div>
      {children}
    </div>
  )
}
export function Avatar({
  name,
  tone,
  sm,
}: {
  name: string
  tone: Tone
  sm?: boolean
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        sm ? 'size-7 text-[11px]' : 'size-10 text-[14px]',
        TONE_SOLID[tone],
      )}
    >
      {name.slice(0, 1)}
    </span>
  )
}
export function SummaryCard({
  step,
  title,
  sub,
  icon: Icon,
  iconTone,
  onEdit,
  children,
}: {
  step: string
  title: string
  sub?: string
  icon: LucideIcon
  iconTone: Tone
  onEdit: () => void
  children: ReactNode
}) {
  return (
    <section className={cn(card, 'flex flex-col gap-3')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl text-white',
              TONE_SOLID[iconTone],
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 text-[10px] font-bold">
                {step}
              </span>
              <span className="text-fg text-[14px] font-bold">{title}</span>
            </div>
            {sub && <span className="text-fg-subtle text-[11px]">{sub}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="border-border text-fg-muted hover:text-fg flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold"
        >
          <Pencil className="size-3" aria-hidden="true" />
          수정
        </button>
      </div>
      {children}
    </section>
  )
}
