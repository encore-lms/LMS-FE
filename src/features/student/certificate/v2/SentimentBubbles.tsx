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
const BAR: Record<SentimentPhase, string> = {
  early: 'bg-danger',
  mid: 'bg-warning',
  late: 'bg-success',
}
// 감성 추이 미니 바(시기별 색) — 위기→탐색→급반등 V자 흐름 시각화.
const TREND_BARS: { phase: SentimentPhase; h: number }[] = [
  { phase: 'early', h: 14 },
  { phase: 'early', h: 12 },
  { phase: 'mid', h: 9 },
  { phase: 'mid', h: 8 },
  { phase: 'mid', h: 11 },
  { phase: 'late', h: 13 },
  { phase: 'late', h: 16 },
  { phase: 'late', h: 18 },
]

export function SentimentBubbles({
  sentiment,
  className,
}: {
  sentiment: CertSentiment
  className?: string
}) {
  return (
    <AiAnalysisPanel title="AI 상담 감성·키워드 버블" className={className}>
      <SentimentBubblesView sentiment={sentiment} />
    </AiAnalysisPanel>
  )
}

// 패널 없이 버블 SVG + 범례 + 추세만 — 레코더 등에서 자체 패널 안에 재사용.
export function SentimentBubblesView({
  sentiment,
}: {
  sentiment: CertSentiment
}) {
  // 버블 반경까지 포함해 경계(viewBox)를 동적 계산 → 원이 잘리지 않고 가운데 정렬.
  // 원이 얼마든지 커지거나 위치가 바뀌어도 자동으로 맞춰진다.
  const pad = 10
  const bs = sentiment.bubbles
  const minX = Math.min(...bs.map((b) => b.x - b.r))
  const maxX = Math.max(...bs.map((b) => b.x + b.r))
  const minY = Math.min(...bs.map((b) => b.y - b.r))
  const maxY = Math.max(...bs.map((b) => b.y + b.r))
  const viewBox = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${
    maxY - minY + pad * 2
  }`
  return (
    <>
      <svg viewBox={viewBox} className="h-[280px] w-full">
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
        <span className="text-fg-subtle text-[11px]">크기 = 빈도/중요도</span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-fg text-[12px] font-bold">감성 추이</span>
          <div className="flex items-end gap-1">
            {TREND_BARS.map((b, i) => (
              <span
                key={i}
                className={cn('w-6 rounded-sm', BAR[b.phase])}
                style={{ height: b.h }}
              />
            ))}
          </div>
          <span className="text-fg-muted text-[11px]">{sentiment.trend}</span>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-fg text-[12px] font-bold">키워드 클러스터</span>
          {PHASES.map((p) => {
            const kws = sentiment.bubbles
              .filter((b) => b.phase === p)
              .map((b) => b.label)
            return (
              <div key={p} className="flex items-center gap-2 text-[11px]">
                <span
                  className={cn('size-2 shrink-0 rounded-full', PHASE[p].color)}
                  style={{ backgroundColor: 'currentColor' }}
                />
                <span className="text-fg-muted">
                  {PHASE[p].label.split(' · ')[0]}:{' '}
                  {kws.slice(0, 3).join(' · ')}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
