import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import type { Sentiment, SentimentBubble } from '../ai'
import { AiAnalysisPanel } from './AiAnalysisPanel'

// 버블 색은 상담 시기가 아니라 감성(긍정·중립·우려)을 뜻한다.
// 중립은 판단이 실린 경고색 대신 무채색(fg-muted)을 써서 긍정·우려와만 대비되게 둔다.
const POLARITY_META = {
  POSITIVE: { label: '긍정', color: 'text-success', surface: 'bg-success' },
  NEUTRAL: { label: '중립', color: 'text-fg-muted', surface: 'bg-fg-muted' },
  CONCERN: { label: '우려', color: 'text-danger', surface: 'bg-danger' },
} as const

const POLARITY_ORDER = ['POSITIVE', 'NEUTRAL', 'CONCERN'] as const

// 레이아웃 상수는 모두 px다. 예전 SVG 좌표계(viewBox 420×120)는 컨테이너 폭에 따라
// 글자·선·모서리가 함께 축소돼 키워드가 판독 불가 크기(모바일 2~4px)까지 줄었다.
// 축·레인·라벨은 HTML/CSS가 그리고, 버블만 트랙 안에서 비율로 배치한다.
const LANE_HEIGHT = 100
const RAIL_LABEL_WIDTH = 52
const TRACK_INSET = 36
const MIN_CELL_WIDTH = 124
// 같은 칸의 키워드는 칸 폭의 64%까지만 벌린다 — 칸 경계를 넘지 않아야 차수가 그대로 읽힌다.
const CLUSTER_X_SPREAD = 0.64
const CLUSTER_Y_SPREAD = 13
const MIN_DIAMETER = 46
const MAX_DIAMETER = 68
const MIN_LABEL_SIZE = 10
const MAX_LABEL_SIZE = 13

interface Consultation {
  key: string
  at?: string
}

interface PositionedBubble {
  bubble: SentimentBubble
  sourceIndex: number
  consultationIndex: number
  consultationIndexes: number[]
  xPercent: number
  offsetY: number
  diameter: number
  labelSize: number
}

function normalizedDate(value: string | undefined) {
  return value?.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
}

function consultationCatalog(sentiment: Sentiment): Consultation[] {
  const consultations = new Map<string, Consultation>()

  sentiment.bubbles.forEach((bubble) => {
    bubble.evidence?.forEach((evidence) => {
      const at = normalizedDate(evidence.at)
      if (!at || consultations.has(at)) return
      consultations.set(at, { key: at, at })
    })
  })

  if (consultations.size > 0) {
    return [...consultations.values()].sort(
      (left, right) =>
        (left.at ?? '').localeCompare(right.at ?? '') ||
        left.key.localeCompare(right.key),
    )
  }

  return Array.from(
    { length: Math.max(1, sentiment.noteCount) },
    (_, index) => ({ key: `consultation-${index + 1}` }),
  )
}

function evidenceConsultationIndexes(
  bubble: SentimentBubble,
  consultationIndexByKey: Map<string, number>,
) {
  return [
    ...new Set(
      (bubble.evidence ?? [])
        .map((evidence) => {
          const at = normalizedDate(evidence.at)
          return consultationIndexByKey.get(at || '')
        })
        .filter((index): index is number => index !== undefined),
    ),
  ].sort((left, right) => left - right)
}

// 버블 지름과 라벨 크기는 px 고정이다. 라벨은 원 안쪽 유효 폭(≈지름의 0.78)에
// 가장 긴 어절이 들어가는 크기로 줄이되 10px 아래로는 내리지 않는다.
function bubbleSize(bubble: SentimentBubble) {
  const diameter = Math.round(
    Math.min(MAX_DIAMETER, Math.max(MIN_DIAMETER, bubble.r * 3.9)),
  )
  const longestWord = Math.max(
    1,
    ...bubble.label
      .trim()
      .split(/\s+/)
      .map((word) => word.length),
  )
  const labelSize = Math.round(
    Math.min(
      MAX_LABEL_SIZE,
      Math.max(
        MIN_LABEL_SIZE,
        Math.min(diameter * 0.21, (diameter * 0.78) / longestWord),
      ),
    ),
  )
  return { diameter, labelSize }
}

// 상담 차수(가로)와 감성(세로)이 배치의 유일한 기준이다.
// 같은 칸에 여러 키워드가 오면 칸 안에서만 좌우로 나누고 세로로 살짝 벌려 라벨이 겹치지 않게 한다.
function layoutBubbles(sentiment: Sentiment, consultations: Consultation[]) {
  const consultationIndexByKey = new Map(
    consultations.map((consultation, index) => [consultation.key, index]),
  )
  const assignments = sentiment.bubbles.map((bubble, index) => {
    const evidenceIndexes = evidenceConsultationIndexes(
      bubble,
      consultationIndexByKey,
    )
    const fallbackIndex = Math.min(
      consultations.length - 1,
      Math.floor((index * consultations.length) / sentiment.bubbles.length),
    )

    return {
      bubble,
      sourceIndex: index,
      consultationIndexes:
        evidenceIndexes.length > 0 ? evidenceIndexes : [fallbackIndex],
      consultationIndex:
        evidenceIndexes.length > 1 ? -1 : (evidenceIndexes[0] ?? fallbackIndex),
    }
  })

  // 여러 차수에 걸친 키워드는 근거가 있는 차수 중 가장 덜 붐비는 칸에 놓는다.
  const assignedCounts = Array.from({ length: consultations.length }, () => 0)
  assignments.forEach((assignment) => {
    if (assignment.consultationIndex >= 0) {
      assignedCounts[assignment.consultationIndex] += 1
    }
  })
  assignments.forEach((assignment) => {
    if (assignment.consultationIndex >= 0) return
    assignment.consultationIndex = assignment.consultationIndexes.reduce(
      (selected, candidate) =>
        assignedCounts[candidate] < assignedCounts[selected]
          ? candidate
          : selected,
    )
    assignedCounts[assignment.consultationIndex] += 1
  })

  const cells = new Map<string, typeof assignments>()
  assignments.forEach((assignment) => {
    const key = `${assignment.consultationIndex}|${assignment.bubble.polarity}`
    const cell = cells.get(key) ?? []
    cell.push(assignment)
    cells.set(key, cell)
  })

  const positioned: PositionedBubble[] = []
  cells.forEach((cell) => {
    cell.sort(
      (left, right) =>
        right.bubble.weight - left.bubble.weight ||
        left.sourceIndex - right.sourceIndex,
    )
    cell.forEach((assignment, index) => {
      const spread =
        cell.length === 1 ? 0 : (index / (cell.length - 1) - 0.5) * 2
      const share = 0.5 + (spread * CLUSTER_X_SPREAD) / 2
      positioned.push({
        bubble: assignment.bubble,
        sourceIndex: assignment.sourceIndex,
        consultationIndex: assignment.consultationIndex,
        consultationIndexes: assignment.consultationIndexes,
        xPercent:
          ((assignment.consultationIndex + share) / consultations.length) * 100,
        offsetY: spread * CLUSTER_Y_SPREAD,
        ...bubbleSize(assignment.bubble),
      })
    })
  })

  // 작은 버블이 큰 버블에 가려지지 않도록 큰 것부터 먼저 그린다.
  return positioned.sort(
    (left, right) =>
      right.diameter - left.diameter || left.sourceIndex - right.sourceIndex,
  )
}

function keywordReason(bubble: SentimentBubble, orderLabel: string) {
  const excerpt = [
    ...new Set(bubble.evidence?.map((item) => item.excerpt) ?? []),
  ]
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' ')
  const shortenedExcerpt =
    excerpt.length > 88 ? `${excerpt.slice(0, 88).trim()}…` : excerpt
  const evidenceType = {
    POSITIVE: '긍정적인 변화·대응',
    NEUTRAL: '탐색·상태',
    CONCERN: '부담·어려움',
  }[bubble.polarity]

  if (shortenedExcerpt) {
    return `${orderLabel} 마스킹 상담 기록에서 “${shortenedExcerpt}” 내용이 확인됐습니다. 이 ${evidenceType} 근거를 바탕으로 ‘${bubble.label}’ 키워드로 정리했습니다.`
  }

  return `${orderLabel} 상담의 ${bubble.evidenceCount}개 근거 문장에서 ${evidenceType} 맥락이 반복되어 ‘${bubble.label}’ 키워드로 정리했습니다.`
}

function shortDate(value: string | undefined) {
  return value ? value.slice(5).replace('-', '.') : undefined
}

function consultationOrderLabel(indexes: number[]) {
  return indexes.map((index) => `${index + 1}차`).join('·')
}

function consultationFlow(
  positionedBubbles: PositionedBubble[],
  consultations: Consultation[],
) {
  return consultations
    .map((_, consultationIndex) => {
      const keywords = positionedBubbles
        .filter((item) => item.consultationIndex === consultationIndex)
        .sort(
          (left, right) =>
            right.bubble.weight - left.bubble.weight ||
            right.bubble.evidenceCount - left.bubble.evidenceCount,
        )
        .slice(0, 2)
        .map((item) => item.bubble.label)

      return keywords.length > 0
        ? `${consultationIndex + 1}차 ${keywords.join('·')}`
        : `${consultationIndex + 1}차`
    })
    .join(' → ')
}

export function SentimentBubbles({
  sentiment,
  className,
}: {
  sentiment: Sentiment
  className?: string
}) {
  return (
    <AiAnalysisPanel title="AI 상담 감성·키워드 버블" className={className}>
      <SentimentBubblesView sentiment={sentiment} />
    </AiAnalysisPanel>
  )
}

// 상담 원문 대신 상담 순서와 근거 키워드의 크기·흐름만 보여준다.
export function SentimentBubblesView({ sentiment }: { sentiment: Sentiment }) {
  const [selectedBubbleIndex, setSelectedBubbleIndex] = useState<number | null>(
    null,
  )

  if (sentiment.status === 'NOT_READY' || sentiment.bubbles.length === 0) {
    return (
      <p className="text-fg-muted text-[12px] leading-5">
        상담 기록이 없어 감성·키워드 분석은 산출 전입니다.
      </p>
    )
  }

  const consultations = consultationCatalog(sentiment)
  const positionedBubbles = layoutBubbles(sentiment, consultations)
  const selectedBubble = positionedBubbles.find(
    (item) => item.sourceIndex === selectedBubbleIndex,
  )
  const selectedOrderLabel = selectedBubble
    ? consultationOrderLabel(selectedBubble.consultationIndexes)
    : ''
  const selectedReason = selectedBubble
    ? keywordReason(selectedBubble.bubble, selectedOrderLabel)
    : ''
  const trackWidth =
    RAIL_LABEL_WIDTH + TRACK_INSET * 2 + consultations.length * MIN_CELL_WIDTH

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <div
          role="group"
          aria-label={`${consultations.length}회 상담 순서와 긍정·중립·우려 위치로 배치한 감성 키워드 ${sentiment.bubbles.length}개. 크기는 빈도와 중요도`}
          className="bg-surface relative rounded-xl px-3 py-3"
          style={{ minWidth: `${trackWidth}px` }}
        >
          {/* 상담 차수 세로 안내선 — 버블·타임라인 노드와 같은 트랙 위에 놓는다 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-3 z-10"
            style={{
              left: `${RAIL_LABEL_WIDTH + TRACK_INSET + 12}px`,
              right: `${TRACK_INSET + 12}px`,
            }}
          >
            {consultations.map((consultation, index) => (
              <div
                key={`guide-${consultation.key}`}
                data-consultation-lane={index + 1}
                className="border-divider absolute top-0 bottom-0 border-l border-dashed"
                style={{
                  left: `${((index + 0.5) / consultations.length) * 100}%`,
                }}
              />
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            {POLARITY_ORDER.map((polarity) => {
              const meta = POLARITY_META[polarity]
              return (
                <div
                  key={polarity}
                  data-sentiment-rail={polarity}
                  className="flex items-stretch"
                >
                  <div
                    className="flex shrink-0 items-center gap-1.5"
                    style={{ width: `${RAIL_LABEL_WIDTH}px` }}
                  >
                    <span
                      aria-hidden="true"
                      className={cn('h-4 w-[3px] rounded-full', meta.surface)}
                    />
                    <span className={cn('text-[11px] font-bold', meta.color)}>
                      {meta.label}
                    </span>
                  </div>

                  <div
                    className="bg-surface-muted relative flex-1 rounded-2xl"
                    style={{ height: `${LANE_HEIGHT}px` }}
                  >
                    <div
                      className="absolute inset-y-0"
                      style={{
                        left: `${TRACK_INSET}px`,
                        right: `${TRACK_INSET}px`,
                      }}
                    >
                      {positionedBubbles
                        .filter((item) => item.bubble.polarity === polarity)
                        .map((item) => (
                          <SentimentBubbleButton
                            key={item.sourceIndex}
                            item={item}
                            consultations={consultations}
                            isSelected={
                              selectedBubbleIndex === item.sourceIndex
                            }
                            onToggle={() =>
                              setSelectedBubbleIndex((current) =>
                                current === item.sourceIndex
                                  ? null
                                  : item.sourceIndex,
                              )
                            }
                          />
                        ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 상담 차수 타임라인 — 차수와 상담일을 한 줄에서 함께 읽는다 */}
          <div className="mt-2 flex items-start">
            <div
              className="shrink-0"
              style={{ width: `${RAIL_LABEL_WIDTH}px` }}
            />
            <div className="relative h-[34px] flex-1">
              <div
                aria-hidden="true"
                className="bg-border absolute top-[3px] h-px"
                style={{
                  left: `${TRACK_INSET}px`,
                  right: `${TRACK_INSET}px`,
                }}
              />
              <div
                className="absolute inset-y-0"
                style={{
                  left: `${TRACK_INSET}px`,
                  right: `${TRACK_INSET}px`,
                }}
                data-testid="consultation-legend"
              >
                {consultations.map((consultation, index) => (
                  <span
                    key={consultation.key}
                    data-consultation-node={index + 1}
                    className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1.5"
                    style={{
                      left: `${((index + 0.5) / consultations.length) * 100}%`,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="bg-fg-subtle size-[7px] shrink-0 rounded-full"
                    />
                    <span className="text-fg-muted flex items-center text-[11px] font-bold whitespace-nowrap">
                      <span>{index + 1}차</span>
                      {shortDate(consultation.at) ? (
                        <span className="text-fg-subtle font-normal">
                          {' '}
                          · {shortDate(consultation.at)}
                        </span>
                      ) : null}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedBubble ? (
        <div
          className="border-border-subtle bg-surface-muted flex flex-col gap-2 rounded-xl border px-4 py-3"
          data-testid="sentiment-keyword-reason"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'size-2.5 rounded-full',
                POLARITY_META[selectedBubble.bubble.polarity].surface,
              )}
            />
            <span className="text-fg text-[12px] font-bold">
              왜 ‘{selectedBubble.bubble.label}’ 키워드인가요?
            </span>
            <span className="text-fg-subtle text-[10px]">
              {selectedOrderLabel} 상담 근거
            </span>
          </div>
          <p className="text-fg-muted line-clamp-2 text-[11px] leading-5">
            <b className="text-fg">사용 데이터</b>
            <br />
            상담 기록, 상담 감성 키워드, 상담 일자, 상담 키워드 신호 강도
          </p>
          <p className="text-fg-muted text-[11px] leading-5">
            <b className="text-fg">판단 근거</b>
            <br />
            {selectedReason}
          </p>
          <p className="text-fg-muted text-[11px] leading-5">
            <b className="text-fg">계산 흐름</b>
            <br />
            {selectedOrderLabel} 상담 기록에서 키워드 반복과 감성 위치를 확인 →
            신호 강도 {selectedBubble.bubble.weight}/10으로 버블 크기 반영
          </p>
          <p className="text-fg-muted text-[11px] leading-5">
            <b className="text-fg">결과</b>
            <br />
            {selectedBubble.bubble.label} ·{' '}
            {POLARITY_META[selectedBubble.bubble.polarity].label}
          </p>
        </div>
      ) : (
        <p className="text-fg-subtle text-center text-[10px]">
          버블을 선택하면 상담 기록에서 이 키워드가 나온 이유를 확인할 수
          있습니다.
        </p>
      )}

      <div className="flex items-start justify-between gap-4">
        <span className="text-fg-subtle text-[11px]">
          가로 = 상담 차수 · 세로 = 감성
        </span>
        <span className="text-fg-subtle shrink-0 text-[11px]">
          크기 = 빈도/중요도
        </span>
      </div>

      <div className="border-border-subtle flex flex-col gap-2 border-t pt-3">
        <span className="text-fg text-[12px] font-bold">상담 흐름</span>
        <span className="text-fg-muted text-[11px] leading-5">
          {consultationFlow(positionedBubbles, consultations)}
        </span>
      </div>
    </div>
  )
}

function SentimentBubbleButton({
  item,
  consultations,
  isSelected,
  onToggle,
}: {
  item: PositionedBubble
  consultations: Consultation[]
  isSelected: boolean
  onToggle: () => void
}) {
  const { bubble, sourceIndex, consultationIndex, consultationIndexes } = item
  const meta = POLARITY_META[bubble.polarity]
  const orderLabel = consultationOrderLabel(consultationIndexes)
  const dates = consultationIndexes
    .map((consultationOrder) => shortDate(consultations[consultationOrder]?.at))
    .filter((date): date is string => Boolean(date))
    .join(', ')

  return (
    <button
      type="button"
      data-bubble-index={sourceIndex}
      data-bubble-surface="solid-signal"
      data-consultation-order={consultationIndex + 1}
      data-consultation-orders={consultationIndexes
        .map((order) => order + 1)
        .join(',')}
      data-signal-weight={bubble.weight}
      data-sentiment-polarity={bubble.polarity}
      aria-pressed={isSelected}
      aria-label={`${orderLabel} 상담 · ${meta.label} · ${bubble.label} · 상담 근거 ${bubble.evidenceCount}문장`}
      title={`${orderLabel} 상담${dates ? ` · ${dates}` : ''} · ${meta.label} · ${bubble.label} · 상담 근거 ${bubble.evidenceCount}문장`}
      onClick={onToggle}
      className={cn(
        'text-on-color absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full px-1 text-center font-bold [overflow-wrap:anywhere] break-keep shadow-md',
        'transition-transform duration-200 outline-none hover:z-30 hover:scale-[1.04] focus-visible:z-30 focus-visible:scale-[1.04] motion-reduce:transform-none motion-reduce:hover:scale-100',
        'focus-visible:ring-brand focus-visible:ring-2 focus-visible:ring-offset-2',
        isSelected && 'ring-fg ring-2 ring-offset-2',
        meta.surface,
      )}
      style={{
        left: `${item.xPercent}%`,
        top: `${LANE_HEIGHT / 2 + item.offsetY}px`,
        width: `${item.diameter}px`,
        height: `${item.diameter}px`,
        fontSize: `${item.labelSize}px`,
        lineHeight: 1.15,
      }}
    >
      <span data-bubble-label={sourceIndex}>{bubble.label}</span>
    </button>
  )
}
