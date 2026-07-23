import { useEffect, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import type { CertRadarAxis } from '../types'

type RadarMode = 'all' | 'absolute' | 'relative'
type RadarSeries = 'absolute' | 'relative'

const modeLabel: Record<RadarMode, string> = {
  all: '함께 보기',
  absolute: '절대 점수',
  relative: '상대 위치',
}

const visibleModes: RadarMode[] = ['all', 'absolute', 'relative']

const clampUnit = (value: number) => Math.max(0, Math.min(1, value))
const easeOutCubic = (value: number) => 1 - (1 - value) ** 3

function formatScore(value: number | null) {
  if (value === null) return '-'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatPercent(value: number | null) {
  if (value === null) return '-'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export function SkillRadar({
  axes,
  selectedAxisKey,
  onSelectAxis,
}: {
  axes: CertRadarAxis[]
  selectedAxisKey: string
  onSelectAxis: (key: string) => void
}) {
  const [mode, setMode] = useState<RadarMode>('all')
  const [highlightedSeries, setHighlightedSeries] =
    useState<RadarSeries | null>(null)
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [progress, setProgress] = useState(prefersReducedMotion ? 1 : 0)
  const [animationRun, setAnimationRun] = useState(0)

  const absoluteReady = axes.every((axis) => axis.score !== null)
  const relativeReady = axes.every((axis) => axis.relativePercentile !== null)
  const axisCount = axes.length

  const cx = 360
  const cy = 250
  const radius = 155
  const angleAt = (index: number) =>
    (-90 + index * (360 / axisCount)) * (Math.PI / 180)
  const pointAt = (fraction: number, index: number) => {
    const angle = angleAt(index)
    const pointRadius = fraction * radius
    return [
      cx + pointRadius * Math.cos(angle),
      cy + pointRadius * Math.sin(angle),
    ] as const
  }
  const scorePoint = (value: number, index: number) =>
    pointAt(Math.max(0, Math.min(100, value)) / 100, index)
  const polygon = (values: number[]) =>
    values.map((value, index) => scorePoint(value, index).join(',')).join(' ')

  const valuesBySeries: Record<RadarSeries, (number | null)[]> = {
    absolute: axes.map((axis) => axis.score),
    relative: axes.map((axis) => axis.relativePercentile),
  }
  const readyBySeries: Record<RadarSeries, boolean> = {
    absolute: absoluteReady,
    relative: relativeReady,
  }
  const seriesOrder: RadarSeries[] =
    mode === 'all'
      ? ['relative', 'absolute']
      : mode === 'absolute'
        ? ['absolute']
        : ['relative']

  useEffect(() => {
    if (prefersReducedMotion) return

    let frameId = 0
    let startedAt: number | null = null
    const duration = 850
    const animate = (now: number) => {
      startedAt ??= now
      const next = clampUnit((now - startedAt) / duration)
      setProgress(next)
      if (next < 1) frameId = window.requestAnimationFrame(animate)
    }
    frameId = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frameId)
  }, [animationRun, prefersReducedMotion])

  const startAnimation = (nextMode: RadarMode) => {
    setProgress(prefersReducedMotion ? 1 : 0)
    setMode(nextMode)
    setHighlightedSeries(null)
    setAnimationRun((current) => current + 1)
  }

  const selectSeries = (series: RadarSeries) => {
    if (!readyBySeries[series]) return
    setHighlightedSeries((current) => (current === series ? null : series))
  }

  const animatedValue = (value: number, index: number, series: RadarSeries) => {
    const seriesDelay =
      seriesOrder.length > 1 && series !== 'absolute' ? 0.08 : 0
    const axisDelay = (index / Math.max(1, axisCount - 1)) * 0.18
    const localProgress = clampUnit(
      (progress - seriesDelay - axisDelay) / (1 - seriesDelay - axisDelay),
    )
    return value * easeOutCubic(localProgress)
  }

  if (axisCount === 0) return null

  return (
    <div className="bg-surface flex w-full flex-col items-center gap-2 px-2 pb-4">
      <div
        className="border-border bg-surface-muted flex rounded-md border p-0.5"
        aria-label="레이더 표시 방식"
      >
        {visibleModes.map((option) => {
          const disabled = option === 'relative' && !relativeReady
          return (
            <button
              key={option}
              type="button"
              className={cn(
                'min-w-[76px] rounded px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
                mode === option
                  ? 'bg-surface text-fg shadow-sm'
                  : 'text-fg-muted hover:text-fg',
                disabled && 'cursor-not-allowed opacity-45',
              )}
              aria-pressed={mode === option}
              disabled={disabled}
              onClick={() => startAnimation(option)}
            >
              {disabled ? '상대 위치 산출 전' : modeLabel[option]}
            </button>
          )
        })}
      </div>

      <svg
        viewBox="0 0 720 520"
        className="aspect-[18/13] w-full max-w-[620px]"
        role="group"
        aria-label={`${axisCount}축 절대점수와 기수 상대 위치 비교 레이더`}
        data-radar-animation-progress={progress.toFixed(3)}
      >
        <g className="text-fg">
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="currentColor"
            fillOpacity={0.035}
          />
          {[25, 50, 75, 100].map((ring) => (
            <circle
              key={ring}
              cx={cx}
              cy={cy}
              r={(radius * ring) / 100}
              fill="none"
              stroke="currentColor"
              strokeOpacity={ring === 100 ? 0.2 : 0.13}
              strokeWidth="1"
            />
          ))}
          {axes.map((axis, index) => {
            const [x, y] = pointAt(1, index)
            return (
              <line
                key={axis.key}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.2}
                strokeWidth="1"
                strokeDasharray="5 7"
                data-radar-spoke={axis.key}
              />
            )
          })}
        </g>

        {seriesOrder.map((series) => {
          if (!readyBySeries[series]) return null
          const animatedValues = valuesBySeries[series].map((value, index) =>
            value === null ? null : animatedValue(value, index, series),
          )
          if (!animatedValues.every((value): value is number => value !== null))
            return null

          const isAbsolute = series === 'absolute'
          const isFocused =
            highlightedSeries === null || highlightedSeries === series
          const points = polygon(animatedValues)

          return (
            <g
              key={series}
              className="cursor-pointer transition-opacity duration-200"
              style={{
                opacity: isFocused ? 1 : 0.12,
                mixBlendMode:
                  highlightedSeries === null && seriesOrder.length > 1
                    ? 'multiply'
                    : 'normal',
              }}
              data-radar-series={series}
              data-focused={highlightedSeries === series ? 'true' : 'false'}
              onClick={() => selectSeries(series)}
            >
              <polygon
                points={points}
                className={cn(
                  isAbsolute
                    ? 'fill-brand/20 stroke-brand'
                    : 'fill-info/20 stroke-info',
                )}
                strokeWidth={highlightedSeries === series ? 3 : 2}
                strokeDasharray={isAbsolute ? undefined : '8 5'}
                strokeLinejoin="round"
              />
              <polygon
                points={points}
                fill="transparent"
                stroke="transparent"
                strokeWidth="18"
                data-radar-hit={series}
              />
              {animatedValues.map((value, index) => {
                const [x, y] = scorePoint(value, index)
                return (
                  <circle
                    key={axes[index].key}
                    cx={x}
                    cy={y}
                    r={highlightedSeries === series ? 4.5 : 3.5}
                    className={
                      isAbsolute
                        ? 'fill-surface stroke-brand'
                        : 'fill-surface stroke-info'
                    }
                    strokeWidth="2"
                    pointerEvents="none"
                    data-radar-point={series}
                  />
                )
              })}
            </g>
          )
        })}

        {axes.map((axis, index) => {
          const angle = angleAt(index)
          const [outerX, outerY] = pointAt(1, index)
          const [elbowX, elbowY] = pointAt(1.13, index)
          const cosine = Math.cos(angle)
          const direction =
            Math.abs(cosine) > 0.18
              ? cosine > 0
                ? 1
                : -1
              : index === 0
                ? 1
                : -1
          const endX = elbowX + direction * 58
          const labelX = endX + direction * 7
          const textAnchor = direction > 0 ? 'start' : 'end'
          const selected = selectedAxisKey === axis.key
          const triggerX = direction > 0 ? labelX - 6 : labelX - 110
          const relativeLabel =
            axis.relativeTopPercent === null
              ? '상대 산출 전'
              : `상위 ${formatPercent(axis.relativeTopPercent)}%`

          return (
            <g
              key={axis.key}
              role="button"
              tabIndex={0}
              aria-label={`${axis.key} 점수 근거 보기`}
              aria-pressed={selected}
              className="group cursor-pointer outline-none"
              data-radar-axis-trigger={axis.key}
              data-radar-axis-clickable="true"
              onClick={() => onSelectAxis(axis.key)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectAxis(axis.key)
                }
              }}
            >
              <polyline
                points={`${outerX},${outerY} ${elbowX},${elbowY} ${endX},${elbowY}`}
                fill="none"
                className={
                  selected
                    ? 'stroke-brand'
                    : 'stroke-fg-subtle/60 group-hover:stroke-fg-muted'
                }
                strokeWidth="1"
              />
              <circle
                cx={outerX}
                cy={outerY}
                r="3"
                className={
                  selected
                    ? 'fill-brand stroke-brand'
                    : 'fill-surface stroke-fg-subtle group-hover:stroke-fg-muted'
                }
                strokeWidth="1.5"
              />
              <rect
                x={triggerX}
                y={elbowY - 18}
                width="116"
                height="36"
                rx="6"
                className={
                  selected
                    ? 'fill-brand/10 stroke-brand/30'
                    : 'group-hover:fill-surface-muted group-focus-visible:stroke-ring fill-transparent stroke-transparent'
                }
                strokeWidth="1"
              />
              <text
                x={labelX}
                y={elbowY - 5}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className={cn(
                  'text-[11px] font-semibold',
                  selected ? 'fill-brand' : 'fill-fg',
                )}
                data-radar-axis-label={axis.key}
                pointerEvents="none"
              >
                {axis.key}
              </text>
              <text
                x={labelX}
                y={elbowY + 11}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="fill-fg-muted text-[9px] font-medium"
                pointerEvents="none"
              >
                절대 {formatScore(axis.score)} · {relativeLabel}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-5 text-[11px] font-semibold">
        <button
          type="button"
          className="text-fg-muted hover:text-fg flex items-center gap-2"
          onClick={() => selectSeries('absolute')}
        >
          <span className="bg-brand h-0.5 w-6" />
          절대 점수
        </button>
        <button
          type="button"
          className={cn(
            'text-fg-muted hover:text-fg flex items-center gap-2',
            !relativeReady && 'cursor-not-allowed opacity-45',
          )}
          disabled={!relativeReady}
          onClick={() => selectSeries('relative')}
        >
          <span className="border-info w-6 border-t-2 border-dashed" />
          {relativeReady ? '기수 상대 위치' : '기수 상대 위치 산출 전'}
        </button>
      </div>
    </div>
  )
}

export function SkillRadarLoading() {
  const cx = 360
  const cy = 205
  const radius = 125
  const pointAtAngle = (angle: number) => {
    const radians = angle * (Math.PI / 180)
    return [
      cx + radius * Math.cos(radians),
      cy + radius * Math.sin(radians),
    ] as const
  }
  const [startX, startY] = pointAtAngle(-90)
  const [endX, endY] = pointAtAngle(-38)
  const wedge = `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY} Z`

  return (
    <div
      className="bg-surface flex w-full flex-col items-center px-3 pb-5"
      role="status"
      aria-live="polite"
      aria-label="6축 점수와 상대 위치 계산 중"
      data-radar-loading
    >
      <svg
        viewBox="0 0 720 410"
        className="aspect-[72/41] w-full max-w-[720px]"
        aria-hidden="true"
      >
        <g className="text-fg">
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="currentColor"
            fillOpacity={0.025}
          />
          {[25, 50, 75, 100].map((ring) => (
            <circle
              key={ring}
              cx={cx}
              cy={cy}
              r={(radius * ring) / 100}
              fill="none"
              stroke="currentColor"
              strokeOpacity={ring === 100 ? 0.18 : 0.1}
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 6 }, (_, index) => {
            const angle = -90 + index * (360 / 6)
            const [x, y] = pointAtAngle(angle)
            return (
              <line
                key={angle}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.14}
                strokeWidth="1"
                strokeDasharray="5 7"
              />
            )
          })}
        </g>
        <g
          className="animate-spin motion-reduce:animate-none"
          style={{
            animationDuration: '1.8s',
            transformOrigin: `${cx}px ${cy}px`,
          }}
          data-radar-scan
        >
          <path
            d={wedge}
            className="fill-brand/15 stroke-brand/50"
            strokeWidth="1.5"
          />
          <line
            x1={cx}
            y1={cy}
            x2={startX}
            y2={startY}
            className="stroke-brand"
            strokeWidth="2"
          />
        </g>
        <circle cx={cx} cy={cy} r="4" className="fill-brand" />
      </svg>
      <span className="text-fg-muted text-[12px] font-semibold">
        6축 점수와 기수 상대 위치를 계산하는 중…
      </span>
    </div>
  )
}
