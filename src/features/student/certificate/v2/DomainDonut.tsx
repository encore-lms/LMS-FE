import { cn } from '@/shared/lib/cn'
import type { CertDomain, Tone } from '../types'

// 증명서 v2 — 도메인 경험 도넛(프로젝트/기록 기반 분포). 토큰 색만 사용(SVG stroke=currentColor).
const STROKE: Record<Tone, string> = {
  brand: 'text-brand',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
  accent: 'text-accent-strong',
  success: 'text-success',
}
const DOT: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}
const card =
  'border-border bg-surface rounded-2xl border p-6 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const R = 52
const C = 2 * Math.PI * R

export function DomainDonut({
  domains,
  className,
}: {
  domains: CertDomain[]
  className?: string
}) {
  let acc = 0
  return (
    <section className={cn(card, 'flex flex-col gap-4', className)}>
      <span className="text-fg text-[15px] font-bold">도메인 경험</span>
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 140 140" className="size-[140px] shrink-0">
          <g transform="rotate(-90 70 70)">
            {domains.map((d) => {
              const len = (d.pct / 100) * C
              const seg = (
                <circle
                  key={d.label}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke="currentColor"
                  className={STROKE[d.tone]}
                  strokeWidth="16"
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-acc}
                />
              )
              acc += len
              return seg
            })}
          </g>
        </svg>
        <div className="flex flex-1 flex-col gap-2">
          {domains.map((d) => (
            <div key={d.label} className="flex items-center gap-2 text-[12px]">
              <span className={cn('size-2.5 rounded-full', DOT[d.tone])} />
              <span className="text-fg flex-1">{d.label}</span>
              <span className="text-fg font-bold">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
