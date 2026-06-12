import type { ReactNode } from 'react'

/** 단일 문단 흰 카드 — Figma 3198:178. 비노출 고지 등 짧은 안내 전용. */
export function VerifyNoticeCard({ children }: { children: ReactNode }) {
  return (
    <div className="border-border bg-surface text-fg-muted w-full rounded-2xl border px-[18px] py-4 text-left text-[11px] leading-4 font-medium">
      {children}
    </div>
  )
}
