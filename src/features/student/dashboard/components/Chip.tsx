import { cn } from '@/shared/lib/cn'
import type { Tone } from '../types'
import { TONE_SOFT } from './tone'

// 작은 라벨 칩 — 카테고리·태그·D-day 표시. tone으로 @theme 토큰 색조 선택(기본 중립).
export function Chip({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] font-semibold',
        TONE_SOFT[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
