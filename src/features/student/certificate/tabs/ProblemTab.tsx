import { cn } from '@/shared/lib/cn'
import type { CertProblemTab, Tone } from '../types'
import { TabHead } from './TechTab'

// 증명서 탭4 문제해결·협업 — KPI·대표 트러블슈팅·문제 분포·PeerTag 클라우드·태그 연결.
const card =
  'border-border bg-surface rounded-2xl border p-6 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const SOLID: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}
const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}
const DELTA: Record<Tone, string> = {
  brand: 'text-brand',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
  accent: 'text-accent-strong',
  success: 'text-success',
}

export function ProblemTab({ p }: { p: CertProblemTab }) {
  return (
    <div className="flex flex-col gap-4">
      <TabHead
        no={4}
        title="문제해결·협업"
        sub="트러블슈팅 사례·독립 해결률·PeerTag·협업 평판 · 자동 산정 기반"
      >
        <span className="text-fg-muted text-[11px] font-semibold">
          ● 인증 사례 12건
        </span>
        <span className="text-fg-muted text-[11px] font-semibold">
          ● 독립 해결 83%
        </span>
        <span className="text-fg-muted text-[11px] font-semibold">
          ● PeerTag 37회
        </span>
      </TabHead>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {p.kpis.map((k) => (
          <div
            key={k.key}
            className="border-border bg-surface flex flex-col gap-1.5 rounded-[14px] border p-[18px]"
          >
            <span className="text-fg-muted text-[12px] font-medium">
              {k.label}
            </span>
            <span className="text-fg text-[28px] leading-none font-bold">
              {k.value}
              {k.unit && (
                <span className="text-fg-muted ml-0.5 text-[14px]">
                  {k.unit}
                </span>
              )}
            </span>
            {k.delta && (
              <span
                className={cn(
                  'text-[11px] font-semibold',
                  DELTA[k.deltaTone ?? 'brand'],
                )}
              >
                {k.delta}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-1 flex-col gap-3')}>
          <div className="flex flex-col">
            <span className="text-fg text-[15px] font-bold">
              대표 트러블슈팅 사례
            </span>
            <span className="text-fg-subtle text-[11px]">
              STAR · 카테고리·독립 해결·소요 일수
            </span>
          </div>
          {p.cases.map((c) => (
            <div
              key={c.id}
              className="border-border flex flex-col gap-1.5 rounded-[10px] border p-3.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] font-bold',
                    CHIP[c.badgeTone],
                  )}
                >
                  {c.badge}
                </span>
                {c.resolved && (
                  <span className="bg-success-bg text-success rounded px-1.5 py-0.5 text-[10px] font-bold">
                    ✓ 독립 해결
                  </span>
                )}
                <span className="text-fg-subtle ml-auto text-[11px]">
                  {c.days}
                </span>
              </div>
              <span className="text-fg text-[13px] font-semibold">
                {c.title}
              </span>
              <span className="text-fg-muted text-[11px] leading-4">
                {c.detail}
              </span>
            </div>
          ))}
        </section>

        <section className={cn(card, 'flex flex-1 flex-col gap-3.5')}>
          <span className="text-fg text-[15px] font-bold">문제 분포</span>
          <span className="text-fg-subtle text-[11px]">
            카테고리별 발생 빈도 · 12건 기준
          </span>
          {p.distribution.map((d) => (
            <div key={d.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-fg flex items-center gap-1.5 font-medium">
                  <span className={cn('size-2 rounded-full', SOLID[d.tone])} />
                  {d.label}
                </span>
                <span className="text-fg-muted font-semibold">{d.count}</span>
              </div>
              <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className={cn('h-full rounded-full', SOLID[d.tone])}
                  style={{ width: `${d.pct}%` }}
                />
              </div>
            </div>
          ))}
        </section>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-1 flex-col gap-3')}>
          <span className="text-fg text-[15px] font-bold">
            PeerTag 클라우드
          </span>
          <span className="text-fg-subtle text-[11px]">
            동료 평가에서 수집된 태그 · 누적 37회
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {p.tags.map((tg) => (
              <span
                key={tg.tag}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[13px] font-bold',
                  CHIP[tg.tone],
                )}
              >
                {tg.tag}{' '}
                <span className="text-[11px] opacity-70">{tg.count}</span>
              </span>
            ))}
          </div>
        </section>

        <section className={cn(card, 'flex flex-1 flex-col gap-3')}>
          <span className="text-fg text-[15px] font-bold">
            태그 ↔ 사례 연결
          </span>
          <span className="text-fg-subtle text-[11px]">
            주요 PeerTag별 대표 사례
          </span>
          {p.tagCases.map((tc, i) => (
            <div key={i} className="flex gap-3">
              <span
                className={cn(
                  'h-fit shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold',
                  CHIP[tc.tone],
                )}
              >
                {tc.tag}
              </span>
              <span className="text-fg-muted text-[11px] leading-4">
                {tc.detail}
              </span>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
