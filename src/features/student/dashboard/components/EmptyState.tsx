import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

// 대시보드 빈 상태 — 텍스트 한 줄 대신 아이콘+격려 문구+다음 행동 CTA로 친근하게.
// "데이터 없음"이 아니라 "지금은 여유"라는 긍정 프레임을 준다(데모·신규 수강생 첫인상).
export function EmptyState({
  icon: Icon,
  title,
  sub,
  ctaLabel,
  ctaTo,
}: {
  icon: LucideIcon
  title: string
  sub?: string
  ctaLabel?: string
  ctaTo?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6">
      <span className="bg-surface-muted text-fg-subtle flex size-11 items-center justify-center rounded-full">
        <Icon className="size-5" />
      </span>
      <p className="text-fg-muted text-sm font-medium">{title}</p>
      {sub && <p className="text-fg-subtle -mt-1 text-xs">{sub}</p>}
      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          className="text-brand mt-1 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
        >
          {ctaLabel}
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  )
}
