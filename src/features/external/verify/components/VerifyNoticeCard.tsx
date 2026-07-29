import type { ReactNode } from 'react'
import { Info } from 'lucide-react'

/**
 * 짧은 안내 공유 컴포넌트 — 두 변형.
 * ① card(기본): 단일 문단 흰 카드(Figma 3198:178 — 진입·미인증 비노출 고지)
 * ② strip: surface-muted 인라인 스트립 + info 아이콘(Figma 541:2907 안내 스트립·537:2905 힌트 바).
 *   Figma는 nowrap 1줄이나 구현은 줄바꿈 허용(스펙 권장).
 */
export function VerifyNoticeCard({
  variant = 'card',
  children,
}: {
  variant?: 'card' | 'strip'
  children: ReactNode
}) {
  if (variant === 'strip') {
    return (
      <div className="bg-surface-muted text-fg-subtle flex w-full items-start gap-2 rounded-lg p-3 text-left text-[11px] leading-4 font-medium">
        <Info size={12} className="mt-0.5 shrink-0" aria-hidden />
        <p>{children}</p>
      </div>
    )
  }
  return (
    <div className="border-border bg-surface text-fg-muted w-full rounded-2xl border px-[18px] py-4 text-left text-[11px] leading-4 font-medium">
      {children}
    </div>
  )
}
