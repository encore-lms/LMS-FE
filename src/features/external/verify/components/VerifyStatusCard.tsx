import type { ReactNode } from 'react'

/**
 * 라벨/값 우측정렬 행 카드 — Figma 3198:168. /verify 상태 화면들이 행 구성만 바꿔 공유.
 */
export function VerifyStatusCard({
  rows,
}: {
  rows: { label: string; value: ReactNode }[]
}) {
  return (
    <div className="border-border bg-surface flex w-full flex-col gap-2.5 rounded-[18px] border px-6 py-[18px] shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex h-8 items-center justify-between gap-4"
        >
          <span className="text-fg-subtle w-[150px] shrink-0 text-[10px] font-medium">
            {row.label}
          </span>
          <span className="text-fg text-right text-[13px] font-bold">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )
}
