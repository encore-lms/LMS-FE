import type { ReactNode } from 'react'

// 읽기 전용 표시 필드 — 이름(잠금)·과정/기수 등. 잠금 박스 + 보조 안내.
export function ReadonlyField({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-fg text-[13px] font-bold">{label}</span>
      <div className="border-border bg-surface-muted text-fg flex h-[52px] items-center rounded-[10px] border px-4 text-[15px] font-medium">
        {value}
      </div>
      {hint && <span className="text-fg-subtle text-xs">{hint}</span>}
    </div>
  )
}
