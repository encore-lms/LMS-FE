import { useId } from 'react'

// 출석률 추이 스파크라인(SVG, 라이브러리 없이). 이전 매니저 대시보드의 Sparkline 포팅.
// points: 0~100 값 배열. todayIndex 점은 링으로 강조.
export function Sparkline({
  points,
  width = 168,
  height = 44,
  stroke = 'var(--color-success)',
  todayIndex = -1,
}: {
  points: number[]
  width?: number
  height?: number
  stroke?: string
  todayIndex?: number
}) {
  // 한 화면에 여러 스파크라인이 있어 gradient id가 겹치면 렌더가 깨진다 → 인스턴스별 고유 id.
  const gradientId = useId()
  if (points.length < 2) return null
  const pad = 4
  const innerH = height - pad * 2
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const stepX = width / (points.length - 1)
  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: pad + innerH - ((p - min) / range) * innerH,
  }))
  const line = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((c, i) => {
        const isToday =
          i === todayIndex || (todayIndex < 0 && i === coords.length - 1)
        return (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={isToday ? 3.5 : 2}
            fill={isToday ? stroke : 'white'}
            stroke={stroke}
            strokeWidth={isToday ? 2 : 1.5}
          />
        )
      })}
    </svg>
  )
}
