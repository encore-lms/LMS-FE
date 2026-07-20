import type { ReactNode } from 'react'
import type { MentoringReservation } from '../types'

// 확정 예약 카드 — 확정 일시·장소·예상 시간·담당 멘토. 확정 후 변경/취소는 멘토만.
const ICON_CLS = 'size-4'
const ClockIcon = (
  <svg
    viewBox="0 0 24 24"
    className={ICON_CLS}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const PinIcon = (
  <svg
    viewBox="0 0 24 24"
    className={ICON_CLS}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
)
const TimerIcon = (
  <svg
    viewBox="0 0 24 24"
    className={ICON_CLS}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      d="M10 2h4M12 8v6M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const StarIcon = (
  <svg viewBox="0 0 24 24" className={ICON_CLS} fill="currentColor">
    <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6L12 16.8 6.6 19.6l1-6L3.3 9.4l6-.9L12 3Z" />
  </svg>
)

function Cell({
  icon,
  label,
  top,
  sub,
}: {
  icon: ReactNode
  label: string
  top: string
  sub: string
}) {
  return (
    <div className="flex flex-1 items-center gap-2.5">
      <span className="bg-surface-muted text-fg-muted flex size-8 shrink-0 items-center justify-center rounded-lg">
        {icon}
      </span>
      <div className="flex flex-col gap-px">
        <span className="text-fg-subtle text-[10px] font-medium tracking-wider">
          {label}
        </span>
        <span className="text-fg text-[13px] font-bold">{top}</span>
        <span className="text-fg-subtle text-[10px]">{sub}</span>
      </div>
    </div>
  )
}

export function ConfirmedReservationCard({ r }: { r: MentoringReservation }) {
  return (
    <section className="bg-surface overflow-hidden rounded-2xl">
      <div className="bg-success-bg flex items-center justify-between px-6 py-[18px]">
        <div className="flex items-center gap-2.5">
          <span className="bg-surface text-success flex size-9 items-center justify-center rounded-[10px] text-[15px] font-bold">
            ✓
          </span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-fg text-[15px] font-bold">
                확정 예약 1건
              </span>
              <span className="bg-success rounded-[5px] px-[7px] py-[3px] text-[11px] font-bold text-white">
                확정
              </span>
            </div>
            <span className="text-fg-muted text-[12px]">
              확정 후 일정·장소 변경/취소는 멘토만 가능합니다.
            </span>
          </div>
        </div>
        <span className="text-fg-subtle text-[11px] font-medium">
          예약 #{r.id}
        </span>
      </div>
      <div className="bg-surface flex items-start gap-4 px-6 py-5">
        <Cell
          icon={ClockIcon}
          label="확정 일시"
          top={r.dateLabel}
          sub={r.timeLabel}
        />
        <Cell
          icon={PinIcon}
          label="장소"
          top={r.placeType}
          sub={r.placeDetail}
        />
        <Cell
          icon={TimerIcon}
          label="예상 시간"
          top={r.estHours}
          sub="멘토 메모 기준"
        />
        <Cell
          icon={StarIcon}
          label="담당 멘토"
          top={r.mentorName}
          sub={r.mentorSpecialty}
        />
      </div>
    </section>
  )
}
