import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type Tone = 'info' | 'warning'

const TONE: Record<Tone, string> = {
  info: 'bg-surface-muted text-fg-muted',
  warning: 'bg-warning-bg text-warning',
}

// 아이콘은 lucide 버전별 이름 편차를 피해 인라인 SVG로 둔다(QuizListPage 패턴과 동일).
const InfoIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.5h.01" strokeLinecap="round" />
  </svg>
)

const WarnIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden
  >
    <path
      d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
      strokeLinejoin="round"
    />
    <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
  </svg>
)

/**
 * 안내 배너 — 한 줄 정보(info)부터 제목+설명(warning)까지.
 * 사용처: HRD 단방향 표시 안내(info, calendar), 출결 폼 덮어쓰기 경고(warning).
 */
export function InfoBanner({
  tone = 'info',
  title,
  children,
}: {
  tone?: Tone
  title?: ReactNode
  children?: ReactNode
}) {
  return (
    <div
      className={cn('flex items-start gap-2 rounded-lg px-4 py-3', TONE[tone])}
    >
      <span className="mt-0.5 h-4 w-4 shrink-0">
        {tone === 'warning' ? WarnIcon : InfoIcon}
      </span>
      <div className="flex flex-col gap-0.5 text-[13px]">
        {title && <span className="text-sm font-semibold">{title}</span>}
        {children && <span>{children}</span>}
      </div>
    </div>
  )
}
