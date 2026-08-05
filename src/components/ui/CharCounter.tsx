import { cn } from '@/shared/lib/cn'

// 글자수 카운터 — 'n / 한도'(한도 미지정 항목은 입력 길이만).
// 멘토 일지(LogChips)에서 승격(2026-08-06) — 평가 카드 공용화로 여러 feature 가 쓴다.
export function CharCounter({
  length,
  limit,
  over = false,
}: {
  length: number
  limit: number | null
  over?: boolean
}) {
  return (
    <span
      className={cn(
        'text-[11px] whitespace-nowrap',
        over ? 'text-danger font-bold' : 'text-fg-subtle',
      )}
    >
      {length}
      {limit != null ? ` / ${limit}` : '자'}
    </span>
  )
}
