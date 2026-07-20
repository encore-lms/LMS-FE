import { useId, useLayoutEffect, useRef, useState } from 'react'

// 출석률 추이 스파크라인(SVG, 라이브러리 없이). 이전 매니저 대시보드의 Sparkline 포팅.
// points: 0~100 값 배열. todayIndex 점은 링으로 강조.
// width 미지정 시 컨테이너 폭에 맞춘다(fluid). 끝 점(반지름+stroke)이 타일 밖으로
// 삐져나오지 않도록 좌우 여백(PAD_X)만큼 인셋하고, 박스 밖 그리기는 클립한다.
const PAD_X = 4

export function Sparkline({
  points,
  width,
  height = 44,
  stroke = 'var(--color-success)',
  todayIndex = -1,
}: {
  points: number[]
  /** 미지정이면 컨테이너 폭에 맞춤(반응형). 지정 시 고정폭. */
  width?: number
  height?: number
  stroke?: string
  todayIndex?: number
}) {
  // 한 화면에 여러 스파크라인이 있어 gradient id가 겹치면 렌더가 깨진다 → 인스턴스별 고유 id.
  const gradientId = useId()
  const fluid = width == null
  const hostRef = useRef<HTMLSpanElement>(null)
  const [measured, setMeasured] = useState(0)
  useLayoutEffect(() => {
    if (!fluid) return
    const el = hostRef.current
    if (!el) return
    setMeasured(Math.floor(el.getBoundingClientRect().width))
    // jsdom(테스트) 등 ResizeObserver 미지원 환경에서도 크래시하지 않게 가드.
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (cr) setMeasured(Math.floor(cr.width))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [fluid])

  const w = fluid ? measured : width
  const ready = points.length >= 2 && !!w && w > 0

  function renderSvg(boxW: number) {
    const pad = 4
    const innerH = height - pad * 2
    const innerW = Math.max(1, boxW - PAD_X * 2)
    const max = Math.max(...points)
    const min = Math.min(...points)
    const range = max - min || 1
    const stepX = innerW / (points.length - 1)
    const coords = points.map((p, i) => ({
      x: PAD_X + i * stepX,
      y: pad + innerH - ((p - min) / range) * innerH,
    }))
    const line = coords
      .map(
        (c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`,
      )
      .join(' ')
    const area = `${line} L${(boxW - PAD_X).toFixed(1)},${height} L${PAD_X},${height} Z`
    return (
      <svg
        width={boxW}
        height={height}
        viewBox={`0 0 ${boxW} ${height}`}
        className="block overflow-hidden"
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

  // fluid: 컨테이너 폭 측정을 위해 w-full span으로 감싼다. 고정폭: 그대로 SVG 크기.
  return (
    <span
      ref={hostRef}
      className={
        fluid ? 'block w-full leading-[0]' : 'inline-block leading-[0]'
      }
      style={fluid ? undefined : { width, height }}
    >
      {ready ? renderSvg(w) : null}
    </span>
  )
}
