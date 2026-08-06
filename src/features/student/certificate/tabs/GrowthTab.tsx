import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import {
  CERTIFICATE_360_AXIS_KEYS,
  fetchCertificateScore,
  type CertificateAssessmentPoint,
  type CertificateScoreResult,
} from '../ai'
import type { CertGrowthTab, CertRecommendation } from '../types'
import { TabHead } from './TabHead'

const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'
const MAX_PUBLIC_SHORT_COMMENTS = 5
const growthTrendTicks = [100, 75, 50, 25, 0]

const recommendationTone: Record<string, string> = {
  강사: 'bg-success-bg text-success',
  멘토: 'bg-accent-bg text-accent-strong',
}

const evaluationAxisLabels: Record<
  (typeof CERTIFICATE_360_AXIS_KEYS)[number],
  string
> = {
  '기술·기술기여': '기술·기여',
  '소통·협업·팀워크': '소통·협업',
  문제해결: '문제해결',
  책임감: '책임감',
}

const evaluatorRoles = [
  {
    key: 'peerScore',
    label: '동료',
    description: '완료 프로젝트 평가',
    badge: 'bg-info-bg text-info',
    bar: 'bg-info',
  },
  {
    key: 'mentorScore',
    label: '멘토',
    description: '최신 멘토 평가',
    badge: 'bg-accent-bg text-accent-strong',
    bar: 'bg-accent-strong',
  },
  {
    key: 'managerScore',
    label: '운영(매니저)',
    description: '최신 운영 평가',
    badge: 'bg-warning-bg text-warning',
    bar: 'bg-warning',
  },
  {
    key: 'instructorScore',
    label: '강사',
    description: '최신 강사 평가',
    badge: 'bg-success-bg text-success',
    bar: 'bg-success',
  },
] as const

function clampScore(score: number) {
  return Math.min(Math.max(score, 0), 100)
}

function fivePointScore(value: number) {
  return (value / 100) * 4 + 1
}

type GrowthAssessmentType = 'ACHIEVEMENT' | 'CS'

interface GrowthTimelinePoint {
  id: string
  date: string
  type: GrowthAssessmentType
  title: string
  score: number
}

const growthTypeMeta = {
  ACHIEVEMENT: {
    label: '성취도 평가',
    shortLabel: '성취도',
    line: 'stroke-accent-strong',
    dot: 'border-accent-strong',
    halo: 'bg-accent-strong/15',
    bar: 'bg-gradient-to-t from-accent-strong to-brand',
    badge: 'bg-accent-bg text-accent-strong',
  },
  CS: {
    label: 'CS 평가',
    shortLabel: 'CS',
    line: 'stroke-info',
    dot: 'border-info',
    halo: 'bg-info/15',
    bar: 'bg-gradient-to-t from-info to-info/65',
    badge: 'bg-info-bg text-info',
  },
} as const

function growthAssessmentType(value: string): GrowthAssessmentType {
  return value.toUpperCase().includes('CS') ? 'CS' : 'ACHIEVEMENT'
}

function growthTimelinePoints(
  timeline: CertGrowthTab['timeline'],
  assessments?: CertificateAssessmentPoint[],
): GrowthTimelinePoint[] {
  const points = assessments
    ? assessments.map((assessment) => ({
        id: assessment.id,
        date: assessment.submittedAt,
        type: assessment.assessmentType,
        title: assessment.title,
        score: assessment.score,
      }))
    : timeline.map((point, index) => ({
        id: point.id ?? `${point.date}-${index}`,
        date: point.date,
        type: growthAssessmentType(point.type),
        title: point.title,
        score: point.score,
      }))

  return points
    .map((point, index) => ({ point, index }))
    .sort(
      (a, b) => a.point.date.localeCompare(b.point.date) || a.index - b.index,
    )
    .map(({ point }) => point)
}

function growthPointPosition(points: GrowthTimelinePoint[], index: number) {
  const point = points[index]
  return {
    x: ((index + 0.5) / points.length) * 1000,
    y: 100 - clampScore(point.score),
  }
}

function growthSegmentPath(points: GrowthTimelinePoint[], index: number) {
  const start = growthPointPosition(points, index)
  const end = growthPointPosition(points, index + 1)
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
}

function formatGrowthScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatGrowthDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : value
}

function assessmentAverage(
  points: GrowthTimelinePoint[],
  type: GrowthAssessmentType,
) {
  const scores = points.flatMap((point) =>
    point.type === type ? [point.score] : [],
  )
  if (scores.length === 0) return null
  return scores.reduce((sum, score) => sum + score, 0) / scores.length
}

function GrowthTimeline({ points }: { points: GrowthTimelinePoint[] }) {
  const achievementAverage = assessmentAverage(points, 'ACHIEVEMENT')
  const csAverage = assessmentAverage(points, 'CS')
  const minimumChartWidth = Math.max(560, points.length * 96)

  return (
    <section data-growth-timeline className={cn(card, 'flex flex-col gap-5')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-fg text-[15px] font-bold">성장 곡선</h3>
          <span className="text-fg-subtle text-[11px]">
            성취도와 CS 평가를 유형 색상으로 구분해 하나의 시간순 성장선으로
            표시
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          {(['ACHIEVEMENT', 'CS'] as const).map((type) => {
            const meta = growthTypeMeta[type]
            const average =
              type === 'ACHIEVEMENT' ? achievementAverage : csAverage
            const count = points.filter((point) => point.type === type).length
            return (
              <span
                key={type}
                data-growth-type-summary={type}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5',
                  meta.badge,
                )}
              >
                <span
                  className={cn('size-2 rounded-full border-2', meta.dot)}
                />
                {meta.label} {count}회 · 평균{' '}
                {average === null ? '-' : formatGrowthScore(average)}점
              </span>
            )
          })}
        </div>
      </div>

      {points.length === 0 ? (
        <div className="bg-surface-muted text-fg-subtle rounded-xl px-4 py-10 text-center text-[12px]">
          아직 표시할 성취도·CS 평가 이력이 없습니다.
        </div>
      ) : (
        <div className="w-full overflow-x-auto pb-2">
          <div style={{ minWidth: minimumChartWidth }}>
            <div data-growth-plot className="relative ml-9 h-[240px] pr-2">
              {growthTrendTicks.map((tick) => (
                <div
                  key={tick}
                  className="absolute inset-x-0 flex items-center"
                  style={{ bottom: `calc(${tick}% * 0.84)` }}
                >
                  <span className="text-fg-subtle absolute right-full mr-2 w-7 text-right text-[10px] tabular-nums">
                    {tick}
                  </span>
                  <span className="bg-divider h-px w-full" />
                </div>
              ))}

              <svg
                className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[84%] w-full overflow-visible pr-2"
                viewBox="0 0 1000 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {points.slice(1).map((point, index) => (
                  <path
                    key={`${points[index].id}-${point.id}`}
                    data-growth-trend-segment={point.id}
                    data-growth-trend-type={point.type}
                    d={growthSegmentPath(points, index)}
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                    className={growthTypeMeta[point.type].line}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>

              <div
                data-growth-plot-points
                className="absolute inset-x-0 bottom-0 z-30 grid h-[84%] items-end pr-2"
                style={{
                  gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))`,
                }}
              >
                {points.map((point) => {
                  const meta = growthTypeMeta[point.type]
                  return (
                    <div
                      key={point.id}
                      className="relative flex h-full min-w-0 justify-center"
                    >
                      <div
                        data-growth-score-bar={point.id}
                        className={cn(
                          'absolute bottom-0 w-8 rounded-t-md opacity-75',
                          meta.bar,
                        )}
                        style={{ height: `${clampScore(point.score)}%` }}
                      />
                      <button
                        type="button"
                        data-growth-trend-point={point.id}
                        aria-label={`${formatGrowthDate(point.date)} ${meta.label} ${point.title} ${formatGrowthScore(point.score)}점`}
                        className="focus-visible:ring-ring group absolute left-1/2 flex size-8 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
                        style={{ bottom: `${clampScore(point.score)}%` }}
                      >
                        <span
                          className={cn(
                            'flex size-6 items-center justify-center rounded-full transition-transform group-hover:scale-110',
                            meta.halo,
                          )}
                        >
                          <span
                            className={cn(
                              'bg-surface size-3 rounded-full border-[3px] shadow-sm',
                              meta.dot,
                            )}
                          />
                        </span>
                        <span
                          className={cn(
                            'absolute bottom-full mb-0.5 text-[11px] font-bold tabular-nums',
                            point.type === 'CS'
                              ? 'text-info'
                              : 'text-accent-strong',
                          )}
                        >
                          {formatGrowthScore(point.score)}
                        </span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            <ol
              data-growth-chronology
              className="ml-9 grid pt-3 pr-2"
              style={{
                gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))`,
              }}
            >
              {points.map((point) => {
                const meta = growthTypeMeta[point.type]
                return (
                  <li
                    key={point.id}
                    className="border-divider flex min-w-0 flex-col items-center gap-1 border-t px-2 pt-3 text-center"
                  >
                    <time className="text-fg-subtle text-[10px] tabular-nums">
                      {formatGrowthDate(point.date)}
                    </time>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-bold',
                        meta.badge,
                      )}
                    >
                      {meta.shortLabel}
                    </span>
                    <span
                      className="text-fg-muted line-clamp-2 text-[10px] leading-4 font-semibold"
                      title={point.title}
                    >
                      {point.title}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      )}
    </section>
  )
}

export function AssessmentGrowthTimeline({
  assessments,
}: {
  assessments: CertificateAssessmentPoint[]
}) {
  return <GrowthTimeline points={growthTimelinePoints([], assessments)} />
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

function EvaluationRoleCard({
  score,
  role,
}: {
  score?: CertificateScoreResult
  role: (typeof evaluatorRoles)[number]
}) {
  const axes = CERTIFICATE_360_AXIS_KEYS.map((axisKey) => {
    const axis = score?.axes.find((item) => item.key === axisKey)
    return { key: axisKey, value: axis?.comparison[role.key] ?? null }
  })
  const completeValues = axes.flatMap((axis) =>
    axis.value === null ? [] : [axis.value],
  )
  const average =
    completeValues.length === axes.length
      ? completeValues.reduce((sum, value) => sum + value, 0) /
        completeValues.length
      : null

  return (
    <article
      data-evaluator-role={role.key}
      className="border-border bg-surface flex min-w-0 flex-col gap-3 rounded-xl border p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span
            className={cn(
              'w-fit rounded px-2 py-0.5 text-[11px] font-bold',
              role.badge,
            )}
          >
            {role.label}
          </span>
          <span className="text-fg-subtle truncate text-[10px]">
            {role.description}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <strong className="text-fg text-[20px] leading-none">
            {average === null ? '-' : fivePointScore(average).toFixed(1)}
          </strong>
          <span className="text-fg-subtle ml-1 text-[10px] font-medium">
            / 5.0
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {axes.map((axis) => (
          <div key={axis.key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="text-fg-muted truncate font-semibold">
                {evaluationAxisLabels[axis.key]}
              </span>
              <span className="text-fg shrink-0 font-bold tabular-nums">
                {axis.value === null
                  ? '산출 전'
                  : fivePointScore(axis.value).toFixed(1)}
              </span>
            </div>
            <div className="bg-surface-muted h-1.5 overflow-hidden rounded-full">
              {axis.value !== null && (
                <div
                  className={cn('h-full rounded-full', role.bar)}
                  style={{ width: `${clampScore(axis.value)}%` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
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

export function GrowthTabData({
  g,
  studentId,
}: {
  g: CertGrowthTab
  studentId: string
}) {
  const scoreQuery = useQuery({
    queryKey: ['certificateScore', studentId],
    queryFn: () => fetchCertificateScore(studentId),
  })

  return (
    <DataBoundary
      isPending={scoreQuery.isPending}
      isError={scoreQuery.isError || !scoreQuery.data}
      onRetry={() => {
        void scoreQuery.refetch()
      }}
      errorTitle="평가·추천 데이터를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요."
    >
      {scoreQuery.data && <GrowthTab g={g} score={scoreQuery.data} />}
    </DataBoundary>
  )
}

export function GrowthTab({
  g,
  score,
}: {
  g: CertGrowthTab
  score?: CertificateScoreResult
}) {
  const toast = useToast()
  const [publicShortCommentKeys, setPublicShortCommentKeys] = useState<
    Set<string>
  >(new Set())
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
        title="평가·추천"
        sub="동료·멘토·운영·강사 4축 평가·추천서·팀원 한줄 코멘트"
      >
        <Metric dot="bg-accent-strong">4평가자 · 공통 4축 비교</Metric>
        {g.recommendations.length > 0 && (
          <Metric dot="bg-warning">추천서 {g.recommendations.length}건</Metric>
        )}
        {g.shortComments.length > 0 && (
          <Metric dot="bg-info">한줄 코멘트 {g.shortComments.length}건</Metric>
        )}
      </TabHead>

      <div
        data-growth-evaluation-row
        className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2"
      >
        <section className={cn(card, 'flex h-full flex-col gap-4')}>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-fg text-[15px] font-bold">역할별 4축 평가</h3>
              <span className="text-fg-subtle text-[11px]">
                기술·기여 · 소통·협업 · 문제해결 · 책임감
              </span>
            </div>
            <span className="text-fg-subtle text-[10px]">
              역할별 집계값 · 개별 평가자 정보 비노출
            </span>
          </div>
          <div
            data-evaluator-role-grid
            className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {evaluatorRoles.map((role) => (
              <EvaluationRoleCard key={role.key} score={score} role={role} />
            ))}
          </div>
        </section>
        <div
          data-evaluation-support-panel
          className="flex min-w-0 flex-col gap-4"
        >
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
                  인증 완료와 최신화 작업 이후 공개 스냅샷에 포함
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
      </div>
    </div>
  )
}
