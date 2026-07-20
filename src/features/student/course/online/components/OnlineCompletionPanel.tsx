import { GraduationCap } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { OnlineCompletion } from '../types'
import { OnlineProgressBar } from './OnlineProgressBar'

// 우측 수료 현황 패널 — 참고 시안의 'Pro Reviews'를 KDC 맥락(수료 기준 진도율 충족)으로 대체.
// 전체 진도율 + 수료 기준선(requiredPct) 마커 + 완료 차시/누적 시청 통계.
export function OnlineCompletionPanel({
  completion,
}: {
  completion: OnlineCompletion
}) {
  const c = completion
  const remainingPct = Math.max(0, 100 - c.overallPct)
  return (
    <section className="bg-surface flex flex-col gap-4 rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
      <div className="flex items-center gap-2">
        <span className="bg-success-bg text-success flex size-6 items-center justify-center rounded-md">
          <GraduationCap className="size-3.5" />
        </span>
        <h3 className="text-fg text-[15px] font-bold">수료 현황</h3>
        <span
          className={cn(
            'ml-auto rounded-md px-2 py-0.5 text-[11px] font-bold',
            c.metStandard
              ? 'bg-success-bg text-success'
              : 'bg-warning-bg text-warning',
          )}
        >
          {c.metStandard ? '수료 기준 충족' : '진행 중'}
        </span>
      </div>

      {/* 전체 진도율 */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className="text-fg-subtle text-[11px]">전체 진도율</span>
          <span className="text-fg text-[34px] leading-none font-bold tabular-nums">
            {c.overallPct}
            <span className="text-[20px]">%</span>
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-fg-subtle text-[11px]">남은 진도</span>
          <span className="text-fg-subtle text-[18px] font-bold tabular-nums">
            {remainingPct}%
          </span>
        </div>
      </div>

      {/* 진행바 + 수료 기준선 마커 */}
      <div className="relative">
        <OnlineProgressBar pct={c.overallPct} height={12} />
        <span
          className="bg-fg/40 absolute top-[-3px] bottom-[-3px] w-0.5 rounded-full"
          style={{ left: `${c.requiredPct}%` }}
          aria-hidden
        />
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-success font-semibold">{c.statusLabel}</span>
        <span className="text-fg-subtle">수료 기준 {c.requiredPct}%</span>
      </div>

      {/* 통계 */}
      <div className="border-divider grid grid-cols-2 gap-3 border-t pt-4">
        <Stat
          label="완료 차시"
          value={`${c.completedChapters}/${c.totalChapters}`}
          unit="차시"
        />
        <Stat
          label="누적 시청"
          value={c.watchedDurationLabel}
          unit={`/ ${c.totalDurationLabel}`}
        />
      </div>
    </section>
  )
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit: string
}) {
  return (
    <div className="bg-surface-muted flex flex-col gap-1 rounded-xl p-3">
      <span className="text-fg-subtle text-[11px]">{label}</span>
      <span className="text-fg flex items-baseline gap-1 text-[18px] font-bold tabular-nums">
        {value}
        <span className="text-fg-subtle text-[11px] font-medium">{unit}</span>
      </span>
    </div>
  )
}
