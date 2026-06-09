import type { CertRadarAxis } from '../types'

// 6축 역량 레이더 — Figma '탭1 종합요약 상세' 레이더 시각화.
// 회색 채움 육각형(트랙) + 옅은 격자 링 + 채워진 청록 점수 폴리곤 + 축별 라벨(이름/점수 2줄).
export function SkillRadar({ axes }: { axes: CertRadarAxis[] }) {
  const N = axes.length
  const cx = 150
  const cy = 150
  const R = 105
  const at = (frac: number, i: number) => {
    const a = (-90 + i * (360 / N)) * (Math.PI / 180)
    const r = frac * R
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const
  }
  const pt = (val: number, i: number) =>
    at(Math.max(0, Math.min(100, val)) / 100, i)
  const poly = (vals: number[]) =>
    vals.map((v, i) => pt(v, i).join(',')).join(' ')

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[340px]">
      {/* 격자 — 회색 채움 외곽 육각형 + 옅은 내부 링 */}
      <g className="text-fg-subtle">
        <polygon
          points={poly(axes.map(() => 100))}
          fill="currentColor"
          fillOpacity={0.2}
        />
        {[25, 50, 75].map((ring) => (
          <polygon
            key={ring}
            points={poly(axes.map(() => ring))}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.3}
            strokeWidth="1"
          />
        ))}
      </g>
      {/* 점수 폴리곤 */}
      <polygon
        points={poly(axes.map((a) => a.score))}
        className="fill-brand/15 stroke-brand"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* 축 라벨 — 이름 + 점수 (2줄) */}
      {axes.map((a, i) => {
        const [lx, ly] = at(1.18, i)
        return (
          <g key={i}>
            <text
              x={lx}
              y={ly - 4}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-fg-muted text-[11px] font-semibold"
            >
              {a.key}
            </text>
            <text
              x={lx}
              y={ly + 8}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-fg text-[12px] font-bold"
            >
              {a.score}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
