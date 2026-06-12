import type { ReactNode } from 'react'

/**
 * 정책 박스(제목+본문) — Figma 3198:180. raw #f8fafc는 토큰 부재로 surface/60
 * (page bg surface-muted 위에서 근사 #f7f9f9)으로 매핑.
 */
export function VerifyPolicyBox({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="border-border bg-surface/60 flex w-full flex-col gap-2 rounded-2xl border p-[18px] text-left">
      <h2 className="text-fg text-[13px] font-bold">{title}</h2>
      <p className="text-fg-muted text-[11px] leading-4">{children}</p>
    </div>
  )
}
