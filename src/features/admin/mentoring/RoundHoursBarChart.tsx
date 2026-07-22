// 팀 상세 회차별 인정 시간 막대 차트 — MentoringTeamDetailPage에서 분리.
import { logColorOf } from './logColors'
import type { AdminTeamLogBrief } from './types'

/** 회차별 인정 시간 막대 차트 — 회차마다 인정 시간, 상태별 색. 2건 이상이면 평균선. */
export function RoundHoursBarChart({ logs }: { logs: AdminTeamLogBrief[] }) {
  const asc = [...logs].reverse() // BE desc → 회차순
  const bars = asc.map((l) => ({
    label: l.roundLabel,
    value: l.recognizedHours ?? 0,
    color: logColorOf(l.status, l.resubmitted),
  }))
  const vals = bars.map((b) => b.value)
  const avg =
    vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
  // 상단 여백을 넉넉히 둬 막대가 꽉 차 보이지 않게(비율 완화).
  const maxY = Math.max(...vals, avg, 1) * 1.35
  const W = 640
  const H = 132
  const padL = 12
  const padR = 12
  const padT = 16
  const padB = 24
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const baseY = padT + innerH
  const slot = innerW / bars.length
  const barW = Math.min(44, slot * 0.4)
  const avgY = baseY - (avg / maxY) * innerH

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="회차별 인정 시간"
    >
      {/* 기준선 */}
      <line
        x1={padL}
        y1={baseY}
        x2={W - padR}
        y2={baseY}
        stroke="var(--color-border)"
        strokeWidth="1"
      />
      {/* 평균선 (2건 이상) */}
      {bars.length >= 2 && avg > 0 && (
        <>
          <line
            x1={padL}
            y1={avgY}
            x2={W - padR}
            y2={avgY}
            stroke="var(--color-fg-subtle)"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.6"
          />
          <text
            x={W - padR}
            y={avgY - 5}
            textAnchor="end"
            className="fill-fg-subtle text-[10px]"
          >
            평균 {avg.toFixed(1)}h
          </text>
        </>
      )}
      {/* 막대 */}
      {bars.map((b, i) => {
        const x = padL + i * slot + (slot - barW) / 2
        const h = (b.value / maxY) * innerH
        const y = baseY - h
        return (
          <g key={i}>
            {h > 0 && (
              <rect x={x} y={y} width={barW} height={h} rx={4} fill={b.color} />
            )}
            {b.value > 0 && (
              <text
                x={x + barW / 2}
                y={y - 5}
                textAnchor="middle"
                className="fill-fg text-[11px] font-semibold"
              >
                {b.value}h
              </text>
            )}
            <text
              x={x + barW / 2}
              y={H - 8}
              textAnchor="middle"
              className="fill-fg-subtle text-[10px]"
            >
              {b.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
