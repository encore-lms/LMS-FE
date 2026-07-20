import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { StatStrip } from './StatStrip'
import { card } from './shared'
import type { PlayStat } from './types'

// PLAY 결과 공통 틀 — 타자/코딩/CS퀴즈 결과가 동일 골격을 공유한다(Figma 결과 3프레임 통일).
//  KPI 4 → 결과 카드(뱃지+메시지+세부 분석 3-up+액션) → 정보 패널 → 하단 3-up.
type BadgeTone = 'brand' | 'success' | 'danger'

const BADGE: Record<BadgeTone, string> = {
  brand: 'bg-brand/10 text-brand',
  success: 'bg-success-bg text-success',
  danger: 'bg-danger-bg text-danger',
}

export interface PlayResultViewProps {
  stats: PlayStat[]
  cardTitle: string
  badge: { label: string; tone: BadgeTone }
  message: string
  breakdown: { label: string; value: string }[]
  extra?: ReactNode // 게임별 추가 영역(퀴즈 문제별 정오 등)
  infoTitle: string
  info: { label: string; value: string }[]
  recentTitle: string
  recent: { title: string; detail: string; me?: boolean }[]
  primary: { label: string; to: string }
}

export function PlayResultView({
  stats,
  cardTitle,
  badge,
  message,
  breakdown,
  extra,
  infoTitle,
  info,
  recentTitle,
  recent,
  primary,
}: PlayResultViewProps) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-5 p-8">
      <StatStrip stats={stats} />

      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-1 flex-col gap-4')}>
          <div className="flex items-center gap-2">
            <span className="text-fg text-[15px] font-bold">{cardTitle}</span>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-bold',
                BADGE[badge.tone],
              )}
            >
              {badge.label}
            </span>
          </div>
          <p className="bg-surface-muted/50 text-fg rounded-xl p-4 text-[14px] leading-7 whitespace-pre-line">
            {message}
          </p>

          <div className="flex flex-col gap-2">
            <span className="text-fg text-[15px] font-bold">세부 분석</span>
            <div className="grid grid-cols-3 gap-3">
              {breakdown.map((b) => (
                <div
                  key={b.label}
                  className="bg-surface-muted/60 flex flex-col gap-1.5 rounded-xl p-3.5"
                >
                  <span className="text-fg-subtle text-[11px]">{b.label}</span>
                  <span className="text-brand text-[18px] font-bold">
                    {b.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {extra}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => navigate(primary.to)}
              className={buttonClass({ size: 'md' })}
            >
              {primary.label}
            </button>
            <button
              type="button"
              onClick={() => navigate('/student/play')}
              className="border-border text-fg rounded-lg border px-4 py-2.5 text-[13px] font-semibold"
            >
              PLAY로 돌아가기
            </button>
          </div>
        </section>

        <section className={cn(card, 'flex flex-col gap-3 lg:w-[300px]')}>
          <span className="text-fg text-[15px] font-bold">{infoTitle}</span>
          {info.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between text-[12px]"
            >
              <span className="text-fg-subtle">{r.label}</span>
              <span className="text-fg font-semibold">{r.value}</span>
            </div>
          ))}
        </section>
      </div>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[15px] font-bold">{recentTitle}</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {recent.map((r, i) => (
            <div
              key={i}
              className={cn(
                'flex flex-col gap-1.5 rounded-[12px] border p-4',
                r.me ? 'border-brand/40 bg-brand/5' : 'border-border',
              )}
            >
              <span className="text-fg text-[13px] font-bold">{r.title}</span>
              <span className="text-fg-muted text-[11px]">{r.detail}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
