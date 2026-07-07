import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Hourglass,
  PenSquare,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { DashboardKpis, KpiTone } from '../types'

// 요약 KPI 카드 — 아이콘 리드형(아이콘 배지 + 큰 숫자 + 델타칩 + 트랙바/클리어 상태).
// 값이 0이면 빈 트랙바 대신 '클리어' 체크 상태를 보여줘 허전함을 없앤다.
const DOT: Record<KpiTone, string> = {
  brand: 'bg-brand',
  warning: 'bg-warning',
  accent: 'bg-accent-strong',
  success: 'bg-success',
  info: 'bg-info',
  danger: 'bg-danger',
}
const BADGE: Record<KpiTone, string> = {
  brand: 'bg-success-bg text-brand',
  warning: 'bg-warning-bg text-warning',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
  info: 'bg-info-bg text-info',
  danger: 'bg-danger-bg text-danger',
}
const DELTA: Record<'success' | 'warning' | 'danger', string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
}
// KPI key → 아이콘. 새 key가 생겨도 tone 배지 안에서 Sparkles로 폴백한다.
const ICON: Record<string, LucideIcon> = {
  attendance: CalendarCheck,
  quizzes: PenSquare,
  records: Hourglass,
  waiting: Hourglass,
  changes: AlertTriangle,
}

export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  return (
    // auto-fit: BE가 3개를 주든 4개를 주든 빈 슬롯 없이 균등 분배된다.
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
      {kpis.items.map((k) => {
        const Icon = ICON[k.key] ?? Sparkles
        const isClear = k.barPct === 0 && /^0/.test(k.value)
        return (
          <div
            key={k.key}
            className="border-border/70 bg-surface flex flex-col gap-2.5 rounded-2xl border p-[18px] shadow-[0px_2px_10px_0px_rgba(18,23,38,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0px_8px_20px_0px_rgba(18,23,38,0.1)]"
          >
            {/* 아이콘 배지 + 라벨 */}
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-[10px]',
                  BADGE[k.tone],
                )}
              >
                <Icon className="size-[18px]" />
              </span>
              <span className="text-fg-muted text-[12px] font-semibold">
                {k.label}
              </span>
            </div>
            {/* 숫자 + 단위 + 델타칩 */}
            <div className="flex items-end gap-0.5">
              <span className="text-fg text-[32px] leading-[36px] font-bold">
                {k.value}
              </span>
              {k.unit && (
                <span className="text-fg-muted text-[14px] font-medium">
                  {k.unit}
                </span>
              )}
              {k.delta && (
                <span
                  className={cn(
                    'mb-0.5 ml-2 rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold',
                    DELTA[k.delta.tone],
                  )}
                >
                  {k.delta.label}
                </span>
              )}
            </div>
            {/* 진행 트랙바 — 값 0이면 클리어 상태로 대체(빈 바 허전함 제거).
                클리어 문구가 캡션("…없습니다")과 중복이므로 이때 캡션은 생략한다. */}
            {isClear ? (
              <span className="text-success flex items-center gap-1 text-[11px] font-semibold">
                <CheckCircle2 className="size-3.5" />
                모두 처리했어요
              </span>
            ) : (
              <>
                <div className="bg-surface-muted h-[5px] w-full overflow-hidden rounded-full">
                  <div
                    className={cn('h-full rounded-full', DOT[k.tone])}
                    style={{ width: `${k.barPct}%` }}
                  />
                </div>
                <span className="text-fg-subtle text-[11px] break-keep">
                  {k.caption}
                </span>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
