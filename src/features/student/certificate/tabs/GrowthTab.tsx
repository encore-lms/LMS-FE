import { useRef, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import type {
  CertGrowthTimelinePoint,
  CertGrowthTab,
  CertRecommendation,
} from '../types'
import { GrowthDetailPanel } from './GrowthDetailPanel'
import { TabHead } from './TechTab'

const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

const recommendationTone: Record<string, string> = {
  강사: 'bg-success-bg text-success',
  멘토: 'bg-accent-bg text-accent-strong',
}

const growthTicks = [100, 75, 50, 25, 0]
const MAX_PUBLIC_SHORT_COMMENTS = 5

function clampScore(score: number) {
  return Math.min(Math.max(score, 0), 100)
}

function signedScore(value: number) {
  return `${value > 0 ? '+' : ''}${Number.isInteger(value) ? value : value.toFixed(1)}`
}

function buildGrowthTrendPath(timeline: CertGrowthTimelinePoint[]) {
  const points = timeline.map((point, index) => ({
    x: ((index + 0.5) / timeline.length) * 1000,
    y: 100 - clampScore(point.score),
  }))
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let path = `M ${points[0].x} ${points[0].y}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[Math.max(0, index - 1)]
    const current = points[index]
    const next = points[index + 1]
    const following = points[Math.min(points.length - 1, index + 2)]
    const control1X = current.x + (next.x - previous.x) / 6
    const control1Y = current.y + (next.y - previous.y) / 6
    const control2X = next.x - (following.x - current.x) / 6
    const control2Y = next.y - (following.y - current.y) / 6
    path += ` C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${next.x} ${next.y}`
  }
  return path
}

function formatAssessmentDate(date: string) {
  const [, month, day] = date.split('-')
  return `${month}.${day}`
}

function assessmentSubject(title: string) {
  return (
    title
      .replace(/^SKN\s+\d+기\s*/u, '')
      .replace(/\s*(?:성취도|CS)\s*평가$/u, '')
      .trim() || title
  )
}

function shortCommentKey(
  comment: CertGrowthTab['shortComments'][number],
  index: number,
) {
  return `${comment.by}-${comment.quote}-${index}`
}

function Metric({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <span className="text-fg-muted flex items-center gap-1.5 text-[11px] font-semibold">
      <span className={cn('size-1.5 shrink-0 rounded-full', dot)} />
      {children}
    </span>
  )
}

function RecommendationRow({ item }: { item: CertRecommendation }) {
  return (
    <article className="flex flex-col gap-2 px-6 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-[10px] font-bold',
            recommendationTone[item.role] ?? 'bg-info-bg text-info',
          )}
        >
          {item.role}
        </span>
        <span className="text-fg text-[13px] font-bold">{item.name}</span>
        <span className="text-fg-subtle text-[11px]">{item.meta}</span>
      </div>
      <p className="text-fg-muted text-[12px] leading-5">{item.quote}</p>
      <span className="text-fg-subtle text-[10px]">{item.date}</span>
    </article>
  )
}

function LegacyGrowthTab({ g }: { g: CertGrowthTab }) {
  const toast = useToast()
  const growthChartRef = useRef<HTMLDivElement>(null)
  const [focusedAssessmentIndex, setFocusedAssessmentIndex] = useState<
    number | null
  >(null)
  const [subjectHover, setSubjectHover] = useState<{
    index: number
    x: number
    y: number
    placeBelow: boolean
  } | null>(null)
  const [publicShortCommentKeys, setPublicShortCommentKeys] = useState<
    Set<string>
  >(new Set())
  const startScore = g.timeline[0]?.score ?? 0
  const currentScore = g.timeline.at(-1)?.score ?? 0
  const totalGrowth = Number((currentScore - startScore).toFixed(1))
  const trendPath = buildGrowthTrendPath(g.timeline)
  const achievementCount = g.timeline.filter(
    (point) => point.type === '성취도',
  ).length
  const csCount = g.timeline.length - achievementCount
  const hasInstructorRecommendation = g.recommendations.some(
    (item) => item.role === '강사',
  )
  const hasMentorRecommendation = g.recommendations.some(
    (item) => item.role === '멘토',
  )
  const recommendationTitle =
    hasInstructorRecommendation && hasMentorRecommendation
      ? '강사·멘토 추천서'
      : hasInstructorRecommendation
        ? '강사 추천서'
        : hasMentorRecommendation
          ? '멘토 추천서'
          : '추천서'
  const publicShortCommentCount = g.shortComments.reduce(
    (count, comment, index) =>
      count +
      (publicShortCommentKeys.has(shortCommentKey(comment, index)) ? 1 : 0),
    0,
  )
  const hoveredGrowthSubject =
    subjectHover === null ? null : g.timeline[subjectHover.index]

  const updateSubjectHover = (
    event: React.MouseEvent<HTMLDivElement>,
    index: number,
  ) => {
    const chartBounds = growthChartRef.current?.getBoundingClientRect()
    if (!chartBounds) return

    const pointerX = event.clientX - chartBounds.left
    const pointerY = event.clientY - chartBounds.top
    const horizontalPadding = Math.min(92, chartBounds.width / 2)

    setSubjectHover({
      index,
      x: Math.min(
        Math.max(pointerX, horizontalPadding),
        chartBounds.width - horizontalPadding,
      ),
      y: pointerY,
      placeBelow: pointerY < 54,
    })
  }

  const toggleShortCommentVisibility = (commentKey: string) => {
    if (
      !publicShortCommentKeys.has(commentKey) &&
      publicShortCommentCount >= MAX_PUBLIC_SHORT_COMMENTS
    ) {
      toast.warning('팀원 한줄 코멘트는 최대 5개까지 공개할 수 있어요')
      return
    }

    setPublicShortCommentKeys((current) => {
      const next = new Set(current)
      if (next.has(commentKey)) next.delete(commentKey)
      else next.add(commentKey)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <TabHead
        no={5}
        title="성장·평판"
        sub="성장 곡선·동료 평판·팀원 한줄 코멘트·강사·멘토 추천서·공개/비공개 토글"
      >
        <Metric dot={totalGrowth >= 0 ? 'bg-success' : 'bg-danger'}>
          6개월 평가 {g.timeline.length}회 {signedScore(totalGrowth)}점
        </Metric>
        <Metric dot="bg-accent-strong">
          동료 5축 평균 {(g.peerAverage ?? 0).toFixed(1)}
        </Metric>
        {g.recommendations.length > 0 && (
          <Metric dot="bg-warning">추천서 {g.recommendations.length}건</Metric>
        )}
      </TabHead>

      <section className={cn(card, 'flex flex-col gap-1')}>
        <h3 className="text-fg text-[15px] font-bold">
          성장 곡선 (Growth Timeline)
        </h3>
        <span className="text-fg-subtle text-[11px]">
          성취도 평가·CS 평가 시험일 기준 · 과정 6개월 점수 추이
        </span>

        <div className="mt-3 w-full min-w-0 pb-1">
          <div className="relative ml-8 h-[220px] overflow-visible pt-5 pr-1">
            {growthTicks.map((tick) => (
              <div
                key={tick}
                className="absolute inset-x-0 flex items-center"
                style={{ bottom: `calc(${tick}% * 0.91)` }}
              >
                <span className="text-fg-subtle absolute right-full mr-2 w-7 text-right text-[10px] tabular-nums">
                  {tick}
                </span>
                <span className="bg-divider h-px w-full" />
              </div>
            ))}

            <svg
              className="pointer-events-none absolute inset-x-2 bottom-0 z-40 h-[91%] w-[calc(100%-1rem)] overflow-visible"
              viewBox="0 0 1000 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d={trendPath}
                fill="none"
                vectorEffect="non-scaling-stroke"
                className="stroke-accent-strong opacity-20"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                data-growth-trend-line
                d={trendPath}
                fill="none"
                vectorEffect="non-scaling-stroke"
                className="stroke-accent-strong"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div
              ref={growthChartRef}
              data-growth-chart-area
              className="absolute inset-x-0 bottom-0 z-auto grid h-[91%] items-end gap-2 px-2"
              style={{
                gridTemplateColumns: `repeat(${g.timeline.length}, minmax(0, 1fr))`,
              }}
            >
              {g.timeline.map((point, index) => {
                const previousScore =
                  index > 0 ? g.timeline[index - 1].score : null
                const difference =
                  previousScore === null
                    ? null
                    : Number((point.score - previousScore).toFixed(1))
                const direction =
                  difference === null
                    ? 'unavailable'
                    : difference > 0
                      ? 'up'
                      : difference < 0
                        ? 'down'
                        : 'same'

                return (
                  <div
                    key={`${point.date}-${point.type}`}
                    className="relative flex h-full min-w-0 items-end justify-center"
                  >
                    <button
                      type="button"
                      data-growth-trend-point={point.date}
                      aria-label={`${point.date} ${point.title} ${point.score}점 성장 추세 비교`}
                      className="group focus-visible:ring-ring absolute left-1/2 z-50 flex size-7 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
                      style={{ bottom: `${clampScore(point.score)}%` }}
                      onMouseEnter={() => setFocusedAssessmentIndex(index)}
                      onMouseLeave={() => setFocusedAssessmentIndex(null)}
                      onFocus={() => setFocusedAssessmentIndex(index)}
                      onBlur={() => setFocusedAssessmentIndex(null)}
                    >
                      <span
                        className={cn(
                          'flex size-5 items-center justify-center rounded-full transition-colors',
                          point.type === 'CS'
                            ? 'bg-info/15 group-hover:bg-info/25'
                            : 'bg-accent-strong/15 group-hover:bg-accent-strong/25',
                        )}
                      >
                        <span
                          className={cn(
                            'bg-surface pointer-events-none size-2.5 rounded-full border-2 shadow-sm transition-transform group-hover:scale-110',
                            point.type === 'CS'
                              ? 'border-info'
                              : 'border-accent-strong',
                          )}
                        />
                      </span>
                    </button>

                    {focusedAssessmentIndex === index && (
                      <aside
                        role="tooltip"
                        aria-live="polite"
                        data-growth-trend-comparison={point.date}
                        data-comparison-direction={direction}
                        className={cn(
                          'bg-surface-inverse border-surface/15 text-surface pointer-events-none absolute z-[60] w-[208px] rounded-lg border p-3 shadow-lg',
                          index < 2
                            ? 'left-0'
                            : index > g.timeline.length - 3
                              ? 'right-0'
                              : 'left-1/2 -translate-x-1/2',
                        )}
                        style={
                          point.score >= 70
                            ? {
                                top: `calc(${100 - clampScore(point.score)}% + 10px)`,
                              }
                            : {
                                bottom: `calc(${clampScore(point.score)}% + 10px)`,
                              }
                        }
                      >
                        <p className="text-[11px] leading-4 font-bold">
                          {point.title}
                        </p>
                        <p className="text-surface/60 mt-0.5 text-[9px] font-medium">
                          {point.date} · {point.type} 평가
                        </p>
                        <div className="border-surface/15 mt-2.5 grid grid-cols-2 gap-2 border-t pt-2.5">
                          <div className="border-info border-l-2 pl-2">
                            <p className="text-surface/65 text-[9px] font-semibold">
                              직전 시험
                            </p>
                            <p className="mt-0.5 text-[16px] font-bold">
                              {previousScore ?? '-'}
                              <span className="text-surface/55 ml-0.5 text-[10px] font-medium">
                                /100
                              </span>
                            </p>
                          </div>
                          <div className="border-accent-strong border-l-2 pl-2">
                            <p className="text-surface/65 text-[9px] font-semibold">
                              현재 시험
                            </p>
                            <p className="mt-0.5 text-[16px] font-bold">
                              {point.score}
                              <span className="text-surface/55 ml-0.5 text-[10px] font-medium">
                                /100
                              </span>
                            </p>
                          </div>
                        </div>
                        <div
                          className={cn(
                            'mt-2.5 flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-bold',
                            direction === 'up' && 'bg-success/15 text-success',
                            direction === 'down' && 'bg-danger/15 text-danger',
                            (direction === 'same' ||
                              direction === 'unavailable') &&
                              'bg-surface/10 text-surface/70',
                          )}
                        >
                          {direction === 'up' && (
                            <span aria-hidden="true">▲</span>
                          )}
                          {direction === 'down' && (
                            <span aria-hidden="true">▼</span>
                          )}
                          {direction === 'same' && (
                            <span aria-hidden="true">―</span>
                          )}
                          <span>
                            {difference === null
                              ? '첫 시험 · 비교 기준 없음'
                              : `${Math.abs(difference)}점`}
                          </span>
                        </div>
                        <p className="text-surface/50 mt-1 text-center text-[8px] font-medium">
                          직전 시험 대비 점수 변화
                        </p>
                      </aside>
                    )}

                    <div
                      data-growth-bar={point.date}
                      className={cn(
                        'relative w-full max-w-9 rounded-t-md bg-gradient-to-t',
                        point.type === 'CS'
                          ? 'from-info to-info/65'
                          : 'from-accent-strong to-brand',
                      )}
                      style={{ height: `${clampScore(point.score)}%` }}
                      onMouseMove={(event) => updateSubjectHover(event, index)}
                      onMouseLeave={() => setSubjectHover(null)}
                    >
                      <span
                        className={cn(
                          'absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold tabular-nums',
                          point.type === 'CS'
                            ? 'text-info'
                            : 'text-accent-strong',
                        )}
                      >
                        {point.score}
                      </span>
                    </div>
                  </div>
                )
              })}

              {subjectHover && hoveredGrowthSubject && (
                <aside
                  role="tooltip"
                  data-growth-subject-tooltip={hoveredGrowthSubject.date}
                  className={cn(
                    'bg-surface-inverse border-surface/15 text-surface pointer-events-none absolute z-[80] w-max max-w-[184px] -translate-x-1/2 rounded-md border px-2.5 py-2 shadow-md',
                    subjectHover.placeBelow
                      ? 'translate-y-3'
                      : '-translate-y-[calc(100%+10px)]',
                  )}
                  style={{ left: subjectHover.x, top: subjectHover.y }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[11px] leading-4 font-semibold">
                      {assessmentSubject(hoveredGrowthSubject.title)}
                    </p>
                    <span className="text-accent-bg shrink-0 text-[11px] font-bold tabular-nums">
                      {hoveredGrowthSubject.score}점
                    </span>
                  </div>
                </aside>
              )}
            </div>
          </div>

          <div
            className="ml-8 grid gap-1 px-2 pt-2 sm:gap-2"
            style={{
              gridTemplateColumns: `repeat(${g.timeline.length}, minmax(0, 1fr))`,
            }}
          >
            {g.timeline.map((point) => (
              <div
                key={`assessment-date-${point.date}-${point.type}`}
                className="flex min-w-0 items-center justify-center text-center"
              >
                <span className="text-fg text-[10px] font-semibold">
                  {formatAssessmentDate(point.date)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-fg-muted mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="bg-accent-strong size-2.5 rounded-full" />
            성취도 평가 {achievementCount}회
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-info size-2.5 rounded-full" />
            CS 평가 {csCount}회
          </span>
          <span>
            시작 {startScore}점 → 최근 {currentScore}점
          </span>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[11px] font-bold',
              totalGrowth >= 0
                ? 'bg-success-bg text-success'
                : 'bg-danger-bg text-danger',
            )}
          >
            {totalGrowth >= 0 ? '▲' : '▼'} {signedScore(totalGrowth)}점 / 6개월
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={cn(card, 'flex flex-col gap-3.5')}>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-fg text-[15px] font-bold">
              Peer Reputation · 동료 5축 평가
            </h3>
            <span className="text-fg-subtle text-[11px]">
              Skill360 · 누적 {g.peerEvaluationCount}회 동료 평가
            </span>
          </div>

          {g.reputation.map((item) => (
            <div key={item.key} className="flex flex-col gap-1">
              <div className="flex items-end justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="text-fg text-[13px] font-semibold">
                    {item.key}
                  </span>
                  <span className="text-fg-subtle truncate text-[10px]">
                    {item.detail}
                  </span>
                </div>
                <span className="text-fg shrink-0 text-[16px] font-bold">
                  {item.score.toFixed(1)}
                  <span className="text-fg-subtle ml-1 text-[10px] font-medium">
                    / 5.0
                  </span>
                </span>
              </div>
              <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-accent-strong h-full rounded-full"
                  style={{ width: `${(item.score / 5) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </section>

        <section className={cn(card, 'flex flex-col gap-3')}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-fg text-[15px] font-bold">
                팀원 한줄 코멘트 공개 후보
              </h3>
              <span className="text-fg-subtle text-[11px]">
                프로젝트 종료 후 팀원 동료평가에서 수집 · 기본 OFF
              </span>
            </div>
            <span className="bg-accent-bg text-accent-strong shrink-0 rounded-md px-2 py-1 text-[11px] font-bold tabular-nums">
              공개 {publicShortCommentCount}/{MAX_PUBLIC_SHORT_COMMENTS}
            </span>
          </div>

          {g.shortComments.map((comment, index) => {
            const commentKey = shortCommentKey(comment, index)
            const isPublic = publicShortCommentKeys.has(commentKey)

            return (
              <article
                key={commentKey}
                className={cn(
                  'flex flex-col gap-2 rounded-[10px] border p-4 transition-colors',
                  isPublic
                    ? 'border-accent-strong/30 bg-accent-bg/30'
                    : 'bg-surface-muted border-transparent',
                )}
              >
                <div className="flex items-start gap-3">
                  <p className="text-fg min-w-0 flex-1 text-[13px] leading-5">
                    {comment.quote}
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={cn(
                        'text-[10px] font-bold',
                        isPublic ? 'text-accent-strong' : 'text-fg-subtle',
                      )}
                    >
                      {isPublic ? 'ON' : 'OFF'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isPublic}
                      aria-label={`${index + 1}번 팀원 한줄 코멘트 공개`}
                      onClick={() => toggleShortCommentVisibility(commentKey)}
                      className={cn(
                        'focus-visible:ring-ring relative h-6 w-11 rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none',
                        isPublic ? 'bg-brand' : 'bg-border',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
                          isPublic && 'translate-x-5',
                        )}
                      />
                    </button>
                  </div>
                </div>
                <div className="text-fg-subtle flex flex-wrap items-center gap-2 text-[10px]">
                  <span>{comment.by}</span>
                  <span className="bg-accent-bg text-accent-strong rounded px-1.5 py-0.5 font-bold">
                    {comment.tag}
                  </span>
                </div>
              </article>
            )
          })}
        </section>
      </div>

      {g.recommendations.length > 0 && (
        <section
          data-recommendation-section
          className="border-border bg-surface flex flex-col overflow-hidden rounded-2xl border shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]"
        >
          <div className="flex flex-col gap-0.5 px-6 pt-5 pb-3">
            <h3 className="text-fg text-[15px] font-bold">
              {recommendationTitle}
            </h3>
            <span className="text-fg-subtle text-[11px]">
              개별 공개 토글 없음 · 인증 완료 + 최신화 작업 이후 공개 스냅샷에
              포함
            </span>
          </div>
          {g.recommendations.map((item, index) => (
            <div key={`${item.role}-${item.name}`}>
              {index > 0 && <div className="bg-divider h-px w-full" />}
              <RecommendationRow item={item} />
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

export function GrowthTab({
  g,
  studentId,
}: {
  g?: CertGrowthTab
  studentId?: string
}) {
  if (!g) return <GrowthDetailPanel studentId={studentId} />

  return (
    <div className="flex flex-col gap-4">
      <LegacyGrowthTab g={g} />
      <GrowthDetailPanel studentId={studentId} />
    </div>
  )
}
