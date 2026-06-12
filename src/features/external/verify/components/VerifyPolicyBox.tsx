import type { ReactNode } from 'react'
import { Info } from 'lucide-react'

/**
 * 정책 박스 공유 컴포넌트 — 두 변형.
 * ① 기본(Figma 3198:180 — 진입·미인증): raw #f8fafc는 토큰 부재로 surface/60
 *   (page bg surface-muted 위에서 근사 #f7f9f9)으로 매핑한 회색 박스.
 * ② withIcon(Figma 2815:277·498 — 공개·비공개·잘못된 링크): 흰 카드 + 44px info 틴트
 *   아이콘 박스(info-circle-fill → lucide Info).
 */
export function VerifyPolicyBox({
  title,
  withIcon = false,
  children,
}: {
  title: string
  withIcon?: boolean
  children: ReactNode
}) {
  if (withIcon) {
    return (
      <div className="border-border bg-surface flex w-full items-start gap-3.5 rounded-[14px] border p-[18px] text-left">
        <span className="bg-info-bg text-info flex size-11 shrink-0 items-center justify-center rounded-xl">
          <Info size={22} aria-hidden />
        </span>
        <span className="flex flex-col gap-1">
          <h2 className="text-fg text-[13px] font-bold">{title}</h2>
          <p className="text-fg-muted text-[11px] leading-4">{children}</p>
        </span>
      </div>
    )
  }
  return (
    <div className="border-border bg-surface/60 flex w-full flex-col gap-2 rounded-2xl border p-[18px] text-left">
      <h2 className="text-fg text-[13px] font-bold">{title}</h2>
      <p className="text-fg-muted text-[11px] leading-4">{children}</p>
    </div>
  )
}
