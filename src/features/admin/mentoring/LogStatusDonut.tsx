// 팀 상세 일지 상태 분포 도넛 차트 — MentoringTeamDetailPage에서 분리.
import { LOG_COLOR } from './logColors'
import type { AdminTeamLogBrief } from './types'

/** 일지 상태 분포 도넛 — 유효/수정요청/초안. */
export function LogStatusDonut({ logs }: { logs: AdminTeamLogBrief[] }) {
  const segs = [
    {
      key: 'valid',
      label: '유효',
      color: LOG_COLOR.valid,
      n: logs.filter((l) => l.status === 'valid').length,
    },
    {
      key: 'change_requested',
      label: '수정 요청',
      color: LOG_COLOR.change_requested,
      n: logs.filter((l) => l.status === 'change_requested').length,
    },
    {
      key: 'draft',
      label: '초안',
      color: LOG_COLOR.draft,
      n: logs.filter((l) => l.status === 'draft').length,
    },
  ].filter((s) => s.n > 0)
  const total = logs.length
  const r = 52
  const c = 2 * Math.PI * r
  let acc = 0

  if (total === 0)
    return (
      <p className="text-fg-subtle px-5 py-8 text-center text-[13px]">
        아직 일지가 없어요
      </p>
    )

  return (
    <div className="flex items-center gap-5 px-5 py-4">
      <svg viewBox="0 0 140 140" className="h-[120px] w-[120px] shrink-0">
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="var(--color-surface-muted)"
          strokeWidth="16"
        />
        {segs.map((s) => {
          const len = (s.n / total) * c
          const el = (
            <circle
              key={s.key}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-acc}
              transform="rotate(-90 70 70)"
            />
          )
          acc += len
          return el
        })}
        <text
          x="70"
          y="66"
          textAnchor="middle"
          className="fill-fg text-[22px] font-bold"
        >
          {total}
        </text>
        <text
          x="70"
          y="84"
          textAnchor="middle"
          className="fill-fg-subtle text-[11px]"
        >
          총 일지
        </text>
      </svg>
      <ul className="flex min-w-0 flex-col gap-2">
        {segs.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-[12px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-fg-muted">{s.label}</span>
            <span className="text-fg font-bold tabular-nums">{s.n}건</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
