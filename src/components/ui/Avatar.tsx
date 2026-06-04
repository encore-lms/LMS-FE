import { cn } from '@/shared/lib/cn'

// 이니셜 아바타 — 이름 첫 글자 + 이름 기반 결정적 색.
const COLORS = [
  'bg-brand',
  'bg-accent',
  'bg-success',
  'bg-warning',
  'bg-info',
  'bg-danger',
]

function colorFor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i += 1)
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initial = name.trim().charAt(0) || '?'
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        colorFor(name),
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-hidden
    >
      {initial}
    </span>
  )
}
