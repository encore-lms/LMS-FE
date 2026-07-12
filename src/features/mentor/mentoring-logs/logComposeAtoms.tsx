import { Lock } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

/** 자동 산정 잠금 칩 — Figma 의 x-circle 아이콘은 의미상 lock 으로 대체(openQuestion 기록). */
export function AutoLockChip() {
  return (
    <span className="border-border text-fg-subtle ml-auto flex items-center gap-0.5 rounded border px-1 py-px text-[9px] font-bold">
      <Lock className="h-2.5 w-2.5" />
      자동
    </span>
  )
}

export function CalcStat({
  label,
  value,
  valueClass = 'text-fg',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-fg-subtle text-[10px] font-medium tracking-[0.8px]">
        {label}
      </span>
      <span className={cn('text-xl font-bold', valueClass)}>{value}</span>
    </div>
  )
}

export function CalcDivider() {
  return <span className="bg-brand/30 hidden h-8 w-px sm:block" aria-hidden />
}
