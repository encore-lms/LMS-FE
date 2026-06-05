import { cn } from '@/shared/lib/cn'
import type { MentoringStat, StatTone } from '../types'

// 멘토링 통계 4카드 — 요청 대기/조정 제안/확정 예약/완료 기록. 좌측 톤 아이콘 + 우측 큰 수치.
const TONE: Record<StatTone, string> = {
  neutral: 'bg-surface-muted text-fg-muted',
  warning: 'bg-warning-bg text-warning',
  success: 'bg-success-bg text-success',
  info: 'bg-info-bg text-info',
}

const ICON: Record<string, React.ReactNode> = {
  waiting: (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  proposed: (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z" />
    </svg>
  ),
  confirmed: (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  done: (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5M8 13h8M8 17h5" strokeLinecap="round" />
    </svg>
  ),
}

export function MentoringStatCards({ stats }: { stats: MentoringStat[] }) {
  return (
    <div className="flex flex-col gap-3.5 sm:flex-row">
      {stats.map((s) => (
        <div
          key={s.key}
          className="border-border bg-surface flex flex-1 flex-col gap-3 rounded-[14px] border p-[18px] shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]"
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'flex size-9 items-center justify-center rounded-[10px]',
                TONE[s.tone],
              )}
            >
              {ICON[s.key] ?? ICON.done}
            </span>
            <span className="text-fg text-[22px] font-bold">{s.value}</span>
          </div>
          <span className="text-fg text-[13px] font-bold">{s.label}</span>
          <span className="text-fg-subtle text-[11px] leading-4">
            {s.caption}
          </span>
        </div>
      ))}
    </div>
  )
}
