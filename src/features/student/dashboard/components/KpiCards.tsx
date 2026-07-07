import {
  AlertTriangle,
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  Hourglass,
  PenSquare,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import type { DashboardKpis, KpiTone } from '../types'

// 요약 KPI 카드 — 행동 지향(카드 전체가 해당 화면 링크, 우상단 화살표) +
// 긴급도 위계(D-1 등 warning/danger 델타는 상단 액센트 바·은은한 틴트로 시선 유도).
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
// KPI key → 클릭 시 이동할 화면. 미지정 key는 대시보드에 머무는 대신 링크를 걸지 않는다.
const LINK: Record<string, string> = {
  attendance: '/student/attendance',
  quizzes: '/student/quizzes',
  records: '/student/records',
  waiting: '/student/records',
  changes: '/student/records',
}
// 긴급 델타(warning·danger) → 상단 액센트 바 색. 클리어·성장(success)은 무지.
const URGENT_BAR: Record<'warning' | 'danger', string> = {
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  return (
    // auto-fit: BE가 3개를 주든 4개를 주든 빈 슬롯 없이 균등 분배된다.
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
      {kpis.items.map((k) => {
        const Icon = ICON[k.key] ?? Sparkles
        const to = LINK[k.key]
        const isClear = k.barPct === 0 && /^0/.test(k.value)
        const urgency =
          !isClear && k.delta && k.delta.tone !== 'success'
            ? k.delta.tone
            : null

        const body = (
          <>
            {/* 긴급 카드 상단 액센트 바 */}
            {urgency && (
              <span
                className={cn(
                  'absolute inset-x-0 top-0 h-1 rounded-t-2xl',
                  URGENT_BAR[urgency],
                )}
              />
            )}
            {/* 아이콘 배지 + 라벨 + 이동 화살표 */}
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
              {to && (
                <ArrowUpRight className="text-fg-subtle group-hover:text-brand ml-auto size-4 shrink-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              )}
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
          </>
        )

        const cardCls = cn(
          'group border-border/70 bg-surface relative flex flex-col gap-2.5 overflow-hidden rounded-2xl border p-[18px] shadow-[0px_2px_10px_0px_rgba(18,23,38,0.04)] transition-all duration-200',
          to &&
            'hover:-translate-y-0.5 hover:shadow-[0px_8px_20px_0px_rgba(18,23,38,0.1)]',
          urgency === 'danger' && 'bg-danger-bg/15',
          urgency === 'warning' && 'bg-warning-bg/15',
        )

        return to ? (
          <Link key={k.key} to={to} className={cardCls} aria-label={k.label}>
            {body}
          </Link>
        ) : (
          <div key={k.key} className={cardCls}>
            {body}
          </div>
        )
      })}
    </div>
  )
}
