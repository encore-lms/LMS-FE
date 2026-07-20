import { cn } from '@/shared/lib/cn'
import type { CertDomain } from '../types'
import { TONE_SOLID, TONE_TEXT } from '@/shared/lib/tone'

// 증명서 v2 — 도메인 경험 도넛(프로젝트/기록 기반 분포). 토큰 색만 사용(SVG stroke=currentColor).
const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'
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
      <div className="flex flex-col gap-0.5">
        <span className="text-fg text-[15px] font-bold">도메인 경험</span>
        <span className="text-fg-muted text-[11px]">
          외부 공개 시 포함 가능한 항목
        </span>
      </div>
      <div className="flex items-center gap-10">
        <svg viewBox="0 0 140 140" className="size-[150px] shrink-0">
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
                  className={TONE_TEXT[d.tone]}
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
        <div className="grid flex-1 grid-cols-1 gap-x-12 gap-y-3 sm:grid-cols-2">
          {domains.map((d) => (
            <div
              key={d.label}
              className="border-divider flex items-center gap-2.5 border-b pb-3 text-[13px] last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0"
            >
              <span
                className={cn('size-2.5 rounded-full', TONE_SOLID[d.tone])}
              />
              <span className="text-fg flex-1 font-medium">{d.label}</span>
              <span className="text-fg font-bold">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
