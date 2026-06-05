import type { CertSkillAxis } from '../types'

// 6축 역량 레이더 — 격자(헥사곤) + 내 점수(brand) + 동료/기준(점선). 토큰 색만 사용.
export function SkillRadar({ axes }: { axes: CertSkillAxis[] }) {
  const N = axes.length
  const cx = 150
  const cy = 140
  const R = 110
  const pt = (val: number, i: number) => {
    const a = (-90 + i * (360 / N)) * (Math.PI / 180)
    const r = (Math.max(0, Math.min(100, val)) / 100) * R
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const
  }
  const poly = (vals: number[]) =>
    vals.map((v, i) => pt(v, i).join(',')).join(' ')
  const rings = [25, 50, 75, 100]

  return (
    <svg viewBox="0 0 300 290" className="w-full max-w-[320px]">
      {/* 격자 */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={poly(axes.map(() => ring))}
          className="stroke-divider fill-none"
          strokeWidth="1"
        />
      ))}
      {/* 축선 */}
      {axes.map((_, i) => {
        const [x, y] = pt(100, i)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            className="stroke-divider"
            strokeWidth="1"
          />
        )
      })}
      {/* 동료/기준 */}
      <polygon
        points={poly(axes.map((a) => a.peer))}
        className="stroke-fg-subtle fill-none"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      {/* 내 점수 */}
      <polygon
        points={poly(axes.map((a) => a.score))}
        className="fill-brand/15 stroke-brand"
        strokeWidth="2"
      />
      {axes.map((a, i) => {
        const [x, y] = pt(a.score, i)
        return <circle key={i} cx={x} cy={y} r="3" className="fill-brand" />
      })}
      {/* 라벨 + 점수 */}
      {axes.map((a, i) => {
        const [lx, ly] = pt(124, i)
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-fg-muted text-[11px] font-semibold"
          >
            {a.key} {a.score}
          </text>
        )
      })}
    </svg>
  )
}
