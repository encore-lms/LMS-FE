import { useEffect, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import type { CertRadarAxis, CertThreeSixtyRadarAxis } from '../types'

type RadarMode = 'all' | 'absolute' | 'relative' | 'threeSixty'
type RadarSeries = 'absolute' | 'relative' | 'peer'
type HoveredPoint = { axisIndex: number; series: RadarSeries }

const modeLabel: Record<RadarMode, string> = {
  all: '함께 보기',
  absolute: '절대 점수',
  relative: '상대 위치',
  threeSixty: '동료 5축 평가 비교',
}
const visibleModes: RadarMode[] = ['all', 'absolute', 'relative', 'threeSixty']

const criteriaStatusLabel: Record<CertRadarAxis['status'], string> = {
  READY: '산출 완료',
  NOT_READY: '산출 대기',
  ERROR: '산출 오류',
}

function formatPercent(value: number | null) {
  if (value === null) return '-'
  return Number.isInteger(value) ? value : value.toFixed(1)
}

const clampUnit = (value: number) => Math.max(0, Math.min(1, value))
const easeOutCubic = (value: number) => 1 - (1 - value) ** 3

function formatScore(value: number | null) {
  if (value === null) return '-'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function criteriaDataSource(axisKey: string, mode: 'absolute' | 'relative') {
  if (mode === 'relative') {
    return '수강역량증명서 절대 점수 · 비교 집단'
  }
  const sourceByAxis: Record<string, string> = {
    기술: '성취도 평가 전체 평균 · CS 평가 전체 평균 · 외부 인증 코딩테스트',
    소통: '프로젝트 상호평가 소통 점수 · 최종 멘토평가 소통',
    팀워크: '프로젝트 상호평가 협업 점수 · 최종 멘토평가 팀워크',
    책임감: '프로젝트 상호평가 책임감 점수 · 최종 멘토평가 책임감',
    문제해결: '인증 트러블슈팅 · 프로젝트 상호평가 문제해결 점수',
    학습지속성: '출석 · 블로그 제출 · 과제·스터디·멘토링 가산점',
  }
  return sourceByAxis[axisKey] ?? '수강역량증명서 산출 데이터'
}

// 기본 모드는 확정된 6축을 유지하고, 동료평가 모드에서만 절대점수와 동료평가를 5축으로 비교한다.
export function SkillRadar({
  axes,
  threeSixtyAxes,
}: {
  axes: CertRadarAxis[]
  threeSixtyAxes: CertThreeSixtyRadarAxis[]
}) {
  const [mode, setMode] = useState<RadarMode>('all')
  const [highlightedSeries, setHighlightedSeries] =
    useState<RadarSeries | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null)
  const [selectedCriteriaKey, setSelectedCriteriaKey] = useState<string | null>(
    null,
  )
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [progress, setProgress] = useState(prefersReducedMotion ? 1 : 0)
  const [animationRun, setAnimationRun] = useState(0)

  const absoluteReady = axes.every((axis) => axis.score !== null)
  const relativeReady = axes.every((axis) => axis.relativePercentile !== null)
  const threeSixtyReady =
    threeSixtyAxes.length === 5 &&
    threeSixtyAxes.every(
      (axis) => axis.score !== null && axis.peerScore !== null,
    )
  const activeAxes = mode === 'threeSixty' ? threeSixtyAxes : axes
  const N = activeAxes.length

  const cx = 360
  const cy = 250
  const R = 155
  const angleAt = (i: number) => (-90 + i * (360 / N)) * (Math.PI / 180)
  const at = (frac: number, i: number) => {
    const angle = angleAt(i)
    const radius = frac * R
    return [
      cx + radius * Math.cos(angle),
      cy + radius * Math.sin(angle),
    ] as const
  }
  const pt = (value: number, i: number) =>
    at(Math.max(0, Math.min(100, value)) / 100, i)
  const poly = (values: number[]) =>
    values.map((value, i) => pt(value, i).join(',')).join(' ')

  const absoluteValues = activeAxes.map((axis) => axis.score)
  const relativeValues =
    mode === 'threeSixty' ? [] : axes.map((axis) => axis.relativePercentile)
  const peerValues =
    mode === 'threeSixty' ? threeSixtyAxes.map((axis) => axis.peerScore) : []
  const valuesBySeries: Record<RadarSeries, (number | null)[]> = {
    absolute: absoluteValues,
    relative: relativeValues,
    peer: peerValues,
  }
  const readyBySeries: Record<RadarSeries, boolean> = {
    absolute: mode === 'threeSixty' ? threeSixtyReady : absoluteReady,
    relative: mode !== 'threeSixty' && relativeReady,
    peer: mode === 'threeSixty' && threeSixtyReady,
  }
  const seriesOrder: RadarSeries[] =
    mode === 'threeSixty'
      ? ['peer', 'absolute']
      : mode === 'all'
        ? ['relative', 'absolute']
        : mode === 'absolute'
          ? ['absolute']
          : ['relative']
  const isComparisonMode = mode === 'all' || mode === 'threeSixty'
  const axisDetails =
    mode === 'threeSixty'
      ? threeSixtyAxes.map(
          (axis) =>
            `절대 ${formatScore(axis.score)} · 동료환산 ${formatScore(axis.peerScore)}`,
        )
      : axes.map(
          (axis) =>
            `절대 ${axis.score ?? '-'} · ${
              axis.relativeTopPercent === null
                ? '상대 산출 전'
                : `상위 ${formatPercent(axis.relativeTopPercent)}%`
            }`,
        )

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
    setHoveredPoint(null)
    setHighlightedSeries(null)
    setSelectedCriteriaKey(null)
    setAnimationRun((current) => current + 1)
  }

  const selectSeries = (series: RadarSeries) => {
    if (!readyBySeries[series]) return
    setHighlightedSeries((current) => (current === series ? null : series))
  }

  const animatedValue = (value: number, index: number, series: RadarSeries) => {
    const seriesDelay =
      seriesOrder.length > 1 && series !== 'absolute' ? 0.08 : 0
    const axisDelay = (index / Math.max(1, N - 1)) * 0.18
    const localProgress = clampUnit(
      (progress - seriesDelay - axisDelay) / (1 - seriesDelay - axisDelay),
    )
    return value * easeOutCubic(localProgress)
  }

  if (N === 0) return null

  const selectedAxisIndex = Math.min(hoveredPoint?.axisIndex ?? 0, N - 1)
  const selectedAxis = activeAxes[selectedAxisIndex]
  const primaryValue = selectedAxis.score
  const secondaryValue =
    mode === 'threeSixty'
      ? threeSixtyAxes[selectedAxisIndex].peerScore
      : axes[selectedAxisIndex].relativePercentile
  const secondaryLabel =
    mode === 'threeSixty' ? '동료평가 환산' : '기수 상대 위치'
  const hoveredValue = hoveredPoint
    ? valuesBySeries[hoveredPoint.series][selectedAxisIndex]
    : null
  const counterpartSeries: RadarSeries =
    hoveredPoint?.series === 'absolute'
      ? mode === 'threeSixty'
        ? 'peer'
        : 'relative'
      : 'absolute'
  const counterpartValue = hoveredPoint
    ? valuesBySeries[counterpartSeries][selectedAxisIndex]
    : null
  const signedDifference =
    hoveredValue === null || counterpartValue === null
      ? null
      : hoveredValue - counterpartValue
  const comparisonDirection =
    signedDifference === null
      ? 'unavailable'
      : signedDifference > 0
        ? 'up'
        : signedDifference < 0
          ? 'down'
          : 'same'
  const [hoveredX, hoveredY] =
    hoveredValue === null ? [cx, cy] : pt(hoveredValue, selectedAxisIndex)
  const comparisonPosition = {
    left: `${(hoveredX / 720) * 100}%`,
    top: `${(hoveredY / 520) * 100}%`,
    transform:
      hoveredX <= cx
        ? 'translate(14px, -50%)'
        : 'translate(calc(-100% - 14px), -50%)',
  }
  const criteriaEnabled = mode === 'absolute' || mode === 'relative'
  const selectedCriteria =
    criteriaEnabled && selectedCriteriaKey
      ? (axes.find((axis) => axis.key === selectedCriteriaKey) ?? null)
      : null
  const selectedCriteriaEvidenceMode =
    mode === 'relative' ? 'relative' : 'absolute'
  const toggleCriteria = (key: string) => {
    if (!criteriaEnabled) return
    if (!axes.some((axis) => axis.key === key)) return
    setSelectedCriteriaKey((current) => (current === key ? null : key))
  }

  return (
    <div className="bg-surface flex w-full flex-col items-center gap-3 px-3 pb-5">
      <div
        className="border-border bg-surface-muted flex rounded-md border p-0.5"
        aria-label="레이더 표시 방식"
      >
        {visibleModes.map((option) => {
          const disabled =
            (option === 'relative' && !relativeReady) ||
            (option === 'threeSixty' && !threeSixtyReady)
          return (
            <button
              key={option}
              type="button"
              className={cn(
                'min-w-[82px] rounded px-3 py-1.5 text-[11px] font-semibold transition-colors',
                mode === option
                  ? 'bg-surface text-fg shadow-sm'
                  : 'text-fg-muted hover:text-fg',
                disabled && 'cursor-not-allowed opacity-45',
              )}
              aria-pressed={mode === option}
              disabled={disabled}
              onClick={() => startAnimation(option)}
            >
              {disabled
                ? option === 'relative'
                  ? '상대 위치 산출 전'
                  : '360° 비교 없음'
                : modeLabel[option]}
            </button>
          )
        })}
      </div>

      <div className="relative w-full max-w-[720px]">
        <svg
          viewBox="0 0 720 520"
          className="aspect-[18/13] w-full"
          role="group"
          aria-label={
            mode === 'threeSixty'
              ? '5축 종합 절대점수와 동료평가 환산점수 비교 레이더'
              : `${N}축 절대점수와 기수 상대 위치 비교 레이더`
          }
          data-radar-animation-progress={progress.toFixed(3)}
        >
          <g className="text-fg">
            <circle
              cx={cx}
              cy={cy}
              r={R}
              fill="currentColor"
              fillOpacity={0.035}
            />
            {[25, 50, 75, 100].map((ring) => (
              <circle
                key={ring}
                cx={cx}
                cy={cy}
                r={(R * ring) / 100}
                fill="none"
                stroke="currentColor"
                strokeOpacity={ring === 100 ? 0.2 : 0.13}
                strokeWidth="1"
              />
            ))}
            {activeAxes.map((axis, i) => {
              const [x, y] = at(1, i)
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
            const completeValues = animatedValues.every(
              (value): value is number => value !== null,
            )
            if (!completeValues) return null

            const points = poly(animatedValues)
            const isAbsolute = series === 'absolute'
            const isRelative = series === 'relative'
            const strokeClass = isAbsolute
              ? 'stroke-brand'
              : isRelative
                ? 'stroke-info'
                : 'stroke-accent'
            const fillClass = isAbsolute
              ? 'fill-brand/20'
              : isRelative
                ? 'fill-info/20'
                : 'fill-accent/15'
            const isFocused =
              highlightedSeries === null || highlightedSeries === series

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
                  className={cn(fillClass, strokeClass)}
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
                {animatedValues.map((value, i) => {
                  const [x, y] = pt(value, i)
                  return (
                    <g key={activeAxes[i].key}>
                      <circle
                        cx={x}
                        cy={y}
                        r={highlightedSeries === series ? 4.5 : 3.5}
                        className={
                          isAbsolute
                            ? 'fill-surface stroke-brand'
                            : isRelative
                              ? 'fill-surface stroke-info'
                              : 'fill-surface stroke-accent'
                        }
                        strokeWidth="2"
                        pointerEvents="none"
                        data-radar-point={series}
                      />
                    </g>
                  )
                })}
              </g>
            )
          })}

          {isComparisonMode &&
            activeAxes.map((axis, i) => {
              const absoluteValue = absoluteValues[i]
              const comparisonValue =
                mode === 'threeSixty' ? peerValues[i] : relativeValues[i]
              if (absoluteValue === null || comparisonValue === null)
                return null
              const [absoluteX, absoluteY] = pt(absoluteValue, i)
              const [comparisonX, comparisonY] = pt(comparisonValue, i)
              const comparisonSeries: RadarSeries =
                mode === 'threeSixty' ? 'peer' : 'relative'
              const angle = angleAt(i)
              const unitX = Math.cos(angle)
              const unitY = Math.sin(angle)
              const perpendicularX = -unitY
              const perpendicularY = unitX
              const absoluteRadius = (absoluteValue / 100) * R
              const comparisonRadius = (comparisonValue / 100) * R
              const boundary = (absoluteRadius + comparisonRadius) / 2
              const hitExtension = 10
              const hitHalfWidth = 8
              const intervalFor = (
                radius: number,
                otherRadius: number,
                equalDirection: 'inward' | 'outward',
              ) => {
                if (radius === otherRadius) {
                  return equalDirection === 'outward'
                    ? [boundary, boundary + hitExtension]
                    : [boundary - hitExtension, boundary]
                }
                return radius < otherRadius
                  ? [Math.max(0, radius - hitExtension), boundary]
                  : [boundary, Math.min(R, radius + hitExtension)]
              }
              const polygonFor = (start: number, end: number) => {
                const startX = cx + unitX * start
                const startY = cy + unitY * start
                const endX = cx + unitX * end
                const endY = cy + unitY * end
                return [
                  `${startX + perpendicularX * hitHalfWidth},${startY + perpendicularY * hitHalfWidth}`,
                  `${endX + perpendicularX * hitHalfWidth},${endY + perpendicularY * hitHalfWidth}`,
                  `${endX - perpendicularX * hitHalfWidth},${endY - perpendicularY * hitHalfWidth}`,
                  `${startX - perpendicularX * hitHalfWidth},${startY - perpendicularY * hitHalfWidth}`,
                ].join(' ')
              }
              const absoluteInterval = intervalFor(
                absoluteRadius,
                comparisonRadius,
                'outward',
              )
              const comparisonInterval = intervalFor(
                comparisonRadius,
                absoluteRadius,
                'inward',
              )

              return (
                <g
                  key={`comparison-${axis.key}`}
                  className="cursor-help"
                  data-radar-comparison-hit={axis.key}
                >
                  <polygon
                    points={polygonFor(
                      absoluteInterval[0],
                      absoluteInterval[1],
                    )}
                    fill="transparent"
                    data-radar-point-hit={axis.key}
                    data-radar-point-series="absolute"
                    data-point-x={absoluteX}
                    data-point-y={absoluteY}
                    onPointerEnter={() =>
                      setHoveredPoint({ axisIndex: i, series: 'absolute' })
                    }
                    onPointerLeave={() => setHoveredPoint(null)}
                  />
                  <polygon
                    points={polygonFor(
                      comparisonInterval[0],
                      comparisonInterval[1],
                    )}
                    fill="transparent"
                    data-radar-point-hit={axis.key}
                    data-radar-point-series={comparisonSeries}
                    data-point-x={comparisonX}
                    data-point-y={comparisonY}
                    onPointerEnter={() =>
                      setHoveredPoint({
                        axisIndex: i,
                        series: comparisonSeries,
                      })
                    }
                    onPointerLeave={() => setHoveredPoint(null)}
                  />
                </g>
              )
            })}

          {activeAxes.map((axis, i) => {
            const angle = angleAt(i)
            const [outerX, outerY] = at(1, i)
            const [elbowX, elbowY] = at(1.13, i)
            const cosine = Math.cos(angle)
            const direction =
              Math.abs(cosine) > 0.18 ? (cosine > 0 ? 1 : -1) : i === 0 ? 1 : -1
            const endX = elbowX + direction * 58
            const labelX = endX + direction * 7
            const textAnchor = direction > 0 ? 'start' : 'end'
            const criteriaSelected = selectedCriteriaKey === axis.key
            const triggerX = direction > 0 ? labelX - 6 : labelX - 110
            return (
              <g
                key={axis.key}
                role={criteriaEnabled ? 'button' : undefined}
                tabIndex={criteriaEnabled ? 0 : undefined}
                aria-label={
                  criteriaEnabled ? `${axis.key} 평가 기준 보기` : undefined
                }
                aria-pressed={criteriaEnabled ? criteriaSelected : undefined}
                className={cn(
                  'group outline-none',
                  criteriaEnabled ? 'cursor-pointer' : 'cursor-default',
                )}
                data-radar-axis-trigger={axis.key}
                data-radar-axis-clickable={criteriaEnabled ? 'true' : 'false'}
                onClick={
                  criteriaEnabled ? () => toggleCriteria(axis.key) : undefined
                }
                onKeyDown={(event) => {
                  if (!criteriaEnabled) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    toggleCriteria(axis.key)
                  }
                }}
              >
                <polyline
                  points={`${outerX},${outerY} ${elbowX},${elbowY} ${endX},${elbowY}`}
                  fill="none"
                  className={
                    criteriaSelected
                      ? 'stroke-brand'
                      : criteriaEnabled
                        ? 'stroke-fg-subtle/60 group-hover:stroke-fg-muted'
                        : 'stroke-fg-subtle/45'
                  }
                  strokeWidth="1"
                />
                <circle
                  cx={outerX}
                  cy={outerY}
                  r="3"
                  className={
                    criteriaSelected
                      ? 'fill-brand stroke-brand'
                      : criteriaEnabled
                        ? 'fill-surface stroke-fg-subtle group-hover:stroke-fg-muted'
                        : 'fill-surface stroke-fg-subtle/70'
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
                    criteriaSelected
                      ? 'fill-brand/10 stroke-brand/30'
                      : criteriaEnabled
                        ? 'group-hover:fill-surface-muted group-focus-visible:stroke-ring fill-transparent stroke-transparent'
                        : 'fill-transparent stroke-transparent'
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
                    criteriaSelected ? 'fill-brand' : 'fill-fg',
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
                  {axisDetails[i]}
                </text>
              </g>
            )
          })}
        </svg>

        {isComparisonMode && hoveredPoint !== null && (
          <aside
            className="bg-surface-inverse border-surface/15 text-surface pointer-events-none absolute w-[224px] rounded-xl border p-4 shadow-xl"
            style={comparisonPosition}
            aria-live="polite"
            data-radar-comparison={selectedAxis.key}
            data-hovered-series={hoveredPoint.series}
            data-comparison-direction={comparisonDirection}
          >
            <p className="border-surface/15 border-b pb-2 text-[12px] font-bold">
              {selectedAxis.key} 비교
            </p>
            <div className="grid grid-cols-2 gap-3 pt-3">
              <div className="border-brand border-l-4 pl-2.5">
                <p className="text-surface/65 text-[9px] font-semibold">
                  {mode === 'threeSixty' ? '종합 절대점수' : '절대 점수'}
                </p>
                <p className="mt-1 text-[18px] font-bold">
                  {formatScore(primaryValue)}
                  <span className="text-surface/55 ml-0.5 text-[10px] font-medium">
                    /100
                  </span>
                </p>
              </div>
              <div
                className={cn(
                  'border-l-4 pl-2.5',
                  mode === 'threeSixty' ? 'border-accent' : 'border-info',
                )}
              >
                <p className="text-surface/65 text-[9px] font-semibold">
                  {secondaryLabel}
                </p>
                <p className="mt-1 text-[18px] font-bold">
                  {formatScore(secondaryValue)}
                  <span className="text-surface/55 ml-0.5 text-[10px] font-medium">
                    {mode === 'threeSixty' ? '/100' : ' 백분위'}
                  </span>
                </p>
              </div>
            </div>
            <div
              className={cn(
                'mt-3 flex items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-[13px] font-bold',
                comparisonDirection === 'up' && 'bg-success/15 text-success',
                comparisonDirection === 'down' && 'bg-danger/15 text-danger',
                (comparisonDirection === 'same' ||
                  comparisonDirection === 'unavailable') &&
                  'bg-surface/10 text-surface/70',
              )}
            >
              {comparisonDirection === 'up' && (
                <span aria-hidden="true">▲</span>
              )}
              {comparisonDirection === 'down' && (
                <span aria-hidden="true">▼</span>
              )}
              {comparisonDirection === 'same' && (
                <span aria-hidden="true">―</span>
              )}
              <span>
                {signedDifference === null
                  ? '비교값 산출 전'
                  : `${formatScore(Math.abs(signedDifference))}p`}
              </span>
            </div>
            <p className="text-surface/50 mt-1.5 text-center text-[9px] font-medium">
              {mode === 'threeSixty'
                ? '호버한 점 기준 · 100점 환산 차이'
                : '호버한 점 기준 · 0–100 레이더 좌표 차이'}
            </p>
          </aside>
        )}
      </div>

      {selectedCriteria && (
        <section
          data-radar-criteria={selectedCriteria.key}
          aria-live="polite"
          className="border-brand/20 bg-brand/5 w-full max-w-[680px] rounded-xl border p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-brand text-[10px] font-bold">
                {selectedCriteria.key}{' '}
                {selectedCriteriaEvidenceMode === 'relative'
                  ? '상대 위치'
                  : '절대 점수'}{' '}
                산출 근거
              </span>
              <span className="text-fg text-[20px] font-bold">
                {formatScore(
                  selectedCriteriaEvidenceMode === 'relative'
                    ? selectedCriteria.relativePercentile
                    : selectedCriteria.score,
                )}
                <span className="text-fg-muted ml-1 text-[11px] font-medium">
                  / 100 ·{' '}
                  {selectedCriteriaEvidenceMode === 'relative'
                    ? selectedCriteria.relativeStatus === 'READY'
                      ? '산출 완료'
                      : '산출 대기'
                    : criteriaStatusLabel[selectedCriteria.status]}
                </span>
              </span>
            </div>
            <button
              type="button"
              aria-label={`${selectedCriteria.key} 평가 기준 닫기`}
              className="text-fg-subtle hover:bg-surface-muted hover:text-fg focus-visible:ring-ring flex size-7 shrink-0 items-center justify-center rounded-md text-[16px] focus-visible:ring-2 focus-visible:outline-none"
              onClick={() => setSelectedCriteriaKey(null)}
            >
              ×
            </button>
          </div>

          <div className="border-brand/15 mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-fg-subtle text-[10px] font-bold">
                1. 사용 데이터
              </span>
              <span className="text-fg-muted text-[11px] leading-5 [overflow-wrap:anywhere]">
                {criteriaDataSource(
                  selectedCriteria.key,
                  selectedCriteriaEvidenceMode,
                )}
              </span>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-fg-subtle text-[10px] font-bold">
                2. 판단 근거
              </span>
              <span className="text-fg-muted text-[11px] leading-5">
                {selectedCriteriaEvidenceMode === 'relative'
                  ? `${selectedCriteria.relativeDetail} · ${selectedCriteria.relativeScope === 'COHORT' ? '동일 기수' : '전체 수강생'} 유효 ${selectedCriteria.relativePopulationSize}명`
                  : `${selectedCriteria.detail} · ${criteriaStatusLabel[selectedCriteria.status]}`}
              </span>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-fg-subtle text-[10px] font-bold">
                3. 계산 흐름
              </span>
              <span className="text-fg-muted text-[11px] leading-5 [overflow-wrap:anywhere]">
                {selectedCriteriaEvidenceMode === 'relative'
                  ? '높은 점수 인원 + 동점자의 평균 순위 → 상위 비율 = 평균 순위 ÷ 모집단 × 100 → 백분위 = 100 - 상위 비율'
                  : selectedCriteria.source}
              </span>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-fg-subtle text-[10px] font-bold">
                4. 결과
              </span>
              <span className="text-fg-muted text-[11px] leading-5">
                {selectedCriteriaEvidenceMode === 'relative'
                  ? selectedCriteria.relativeTopPercent === null
                    ? '상대 위치 산출 전'
                    : `백분위 ${formatScore(selectedCriteria.relativePercentile)} · 기수 상위 ${formatPercent(selectedCriteria.relativeTopPercent)}%`
                  : `절대 ${formatScore(selectedCriteria.score)}점`}
              </span>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-center gap-5 text-[11px] font-semibold">
        <button
          type="button"
          className="text-fg-muted hover:text-fg flex items-center gap-2"
          onClick={() => selectSeries('absolute')}
        >
          <span className="bg-brand h-0.5 w-6" />
          {mode === 'threeSixty' ? '종합 절대점수' : '절대 점수'}
        </button>
        {mode === 'threeSixty' ? (
          <button
            type="button"
            className="text-fg-muted hover:text-fg flex items-center gap-2"
            onClick={() => selectSeries('peer')}
          >
            <span className="border-accent w-6 border-t-2 border-dashed" />
            동료평가 환산점수
          </button>
        ) : (
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
        )}
      </div>
    </div>
  )
}

export function SkillRadarLoading() {
  const cx = 360
  const cy = 205
  const R = 125
  const pointAtAngle = (angle: number) => {
    const radians = angle * (Math.PI / 180)
    return [cx + R * Math.cos(radians), cy + R * Math.sin(radians)] as const
  }
  const [startX, startY] = pointAtAngle(-90)
  const [endX, endY] = pointAtAngle(-38)
  const wedge = `M ${cx} ${cy} L ${startX} ${startY} A ${R} ${R} 0 0 1 ${endX} ${endY} Z`

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
            r={R}
            fill="currentColor"
            fillOpacity={0.025}
          />
          {[25, 50, 75, 100].map((ring) => (
            <circle
              key={ring}
              cx={cx}
              cy={cy}
              r={(R * ring) / 100}
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
