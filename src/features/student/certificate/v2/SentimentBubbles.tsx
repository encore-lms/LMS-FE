import { cn } from '@/shared/lib/cn'
import { AiAnalysisPanel } from './AiAnalysisPanel'
import type { CertSentiment, SentimentPhase } from '../types'

// 증명서 v2 — AI 상담 감성·키워드 버블(초기 불안 → 중기 탐색 → 후기 성장).
// 좌표/크기 mock 프리셋 → 정적 SVG. 색은 토큰 text-* + currentColor.
const PHASE: Record<SentimentPhase, { color: string; label: string }> = {
  early: { color: 'text-danger', label: '초기 · 불안' },
  mid: { color: 'text-warning', label: '중기 · 탐색' },
  late: { color: 'text-success', label: '후기 · 성장' },
}
const PHASES: SentimentPhase[] = ['early', 'mid', 'late']

export function SentimentBubbles({
  sentiment,
  className,
}: {
  sentiment: CertSentiment
  className?: string
}) {
  return (
    <AiAnalysisPanel title="AI 상담 감성·키워드 버블" className={className}>
      <svg viewBox="0 0 100 72" className="h-[240px] w-full">
        {sentiment.bubbles.map((b, i) => (
          <g key={i} className={PHASE[b.phase].color}>
            <circle
              cx={b.x}
              cy={b.y}
              r={b.r}
              fill="currentColor"
              fillOpacity={0.15}
              stroke="currentColor"
              strokeWidth={0.4}
            />
            <text
              x={b.x}
              y={b.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={Math.max(2.4, b.r * 0.32)}
              fontWeight={600}
              fill="currentColor"
            >
              {b.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {PHASES.map((p) => (
            <span
              key={p}
              className="text-fg-muted flex items-center gap-1.5 text-[11px]"
            >
              <span
                className={cn('size-2 rounded-full', PHASE[p].color)}
                style={{ backgroundColor: 'currentColor' }}
              />
              {PHASE[p].label}
            </span>
          ))}
        </div>
      </div>
      <span className="text-fg-muted bg-surface rounded-lg px-3 py-2 text-[12px]">
        {sentiment.trend}
      </span>
    </AiAnalysisPanel>
  )
}
