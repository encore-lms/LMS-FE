import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Award, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import { TONE_SOFT, TONE_SOLID, TONE_TEXT } from '@/shared/lib/tone'
import {
  CERTIFICATE_MOCK_STUDENT_ID,
  CERTIFICATE_AXIS_KEYS,
  fetchAiAnalysis,
  fetchCertificateScore,
  type CertificateAssessmentPoint,
  type CertificateScoreMetric,
  type CertificateScoreResult,
} from '../ai'
import { CERT_V2 } from '../config'
import type {
  CertKpi,
  CertRecommendation,
  CertSummaryTab,
  Tone,
} from '../types'
import { DomainDonut } from '../v2/DomainDonut'
import { OntologyMap } from '../v2/OntologyMap'
import { TabHead } from './TabHead'

const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

type AxisKey = CertificateScoreResult['axes'][number]['key']

const axisTone: Record<AxisKey, Tone> = {
  '기술·기술기여': 'brand',
  '소통·협업·팀워크': 'info',
  문제해결: 'danger',
  책임감: 'warning',
  학습지속성: 'success',
  '성취도 평가': 'accent',
}

const toneRing: Record<Tone, string> = {
  brand: 'ring-brand/50',
  info: 'ring-info/50',
  warning: 'ring-warning/50',
  danger: 'ring-danger/50',
  accent: 'ring-accent/50',
  success: 'ring-success/50',
}

const progressMetricOrder = [
  'attendance',
  'assessment',
  'evaluatorAverage',
] as const satisfies ReadonlyArray<CertificateScoreMetric['key']>

type ProgressMetricKey = (typeof progressMetricOrder)[number]
type ProgressMetric = CertificateScoreMetric & { key: ProgressMetricKey }

const metricTone: Record<ProgressMetricKey, Tone> = {
  attendance: axisTone.학습지속성,
  assessment: axisTone['성취도 평가'],
  evaluatorAverage: axisTone['소통·협업·팀워크'],
}

const metricLabelOverride: Partial<Record<ProgressMetricKey, string>> = {
  assessment: '성취도 평가 평균',
  evaluatorAverage: '4축 평가 전체 평균',
}

function metricRoute(key: ProgressMetricKey) {
  if (key === 'assessment') return '/student/quizzes'
  if (key === 'attendance') return '/student/attendance'
  return '/student/certificate?tab=growth-reputation'
}

const domainTones: Tone[] = [
  'info',
  'success',
  'warning',
  'accent',
  'brand',
  'danger',
]

type RecommendationRole = '강사' | '멘토'

const recommendationStyles: Record<
  RecommendationRole,
  {
    label: string
    marker: string
    roleText: string
  }
> = {
  강사: {
    label: '강사 추천',
    marker: 'bg-success',
    roleText: 'text-success',
  },
  멘토: {
    label: '멘토 추천',
    marker: 'bg-accent',
    roleText: 'text-accent-strong',
  },
}

function RecommendationBadge({
  item,
  onClick,
}: {
  item: CertRecommendation
  onClick: () => void
}) {
  const role = item.role as RecommendationRole
  const style = recommendationStyles[role]

  return (
    <button
      type="button"
      aria-label={`${style.label} 인증서 보기`}
      onClick={onClick}
      className="border-border bg-surface hover:border-brand/40 hover:bg-surface-muted focus-visible:ring-brand group flex min-w-32 items-center gap-2.5 rounded-xl border px-2 py-2 text-left shadow-sm transition-all outline-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2"
    >
      <span className="bg-brand-deep text-warning-inverse ring-border relative flex size-9 shrink-0 items-center justify-center rounded-full shadow-sm ring-2 ring-offset-1">
        <Award aria-hidden="true" className="size-5" strokeWidth={1.8} />
        <span
          aria-hidden="true"
          className={cn(
            'border-surface absolute right-0 bottom-0 size-2.5 rounded-full border-2',
            style.marker,
          )}
        />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-fg-subtle text-[8px] leading-none font-bold tracking-[0.12em]">
          RECOMMENDED
        </span>
        <span className="text-fg mt-1 text-[11px] leading-none font-bold">
          {style.label}
        </span>
      </span>
    </button>
  )
}

function recommendationQuote(quote: string) {
  return quote.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim()
}

function RecommendationCertificate({ item }: { item: CertRecommendation }) {
  const role = item.role as RecommendationRole
  const style = recommendationStyles[role]

  return (
    <article
      aria-label={`${style.label} 인증서`}
      className="border-brand-deep/20 bg-surface-muted relative overflow-hidden rounded-sm border p-2 shadow-lg"
    >
      <div className="border-brand-deep/25 bg-surface relative flex min-h-[420px] flex-col items-center overflow-hidden border px-7 py-8 text-center sm:px-12">
        <span
          aria-hidden="true"
          className="border-warning/55 absolute top-4 left-4 size-7 border-t-2 border-l-2"
        />
        <span
          aria-hidden="true"
          className="border-warning/55 absolute top-4 right-4 size-7 border-t-2 border-r-2"
        />
        <span
          aria-hidden="true"
          className="border-warning/55 absolute bottom-4 left-4 size-7 border-b-2 border-l-2"
        />
        <span
          aria-hidden="true"
          className="border-warning/55 absolute right-4 bottom-4 size-7 border-r-2 border-b-2"
        />
        <Award
          aria-hidden="true"
          className="text-brand-deep pointer-events-none absolute top-1/2 left-1/2 size-60 -translate-x-1/2 -translate-y-1/2 opacity-[0.025]"
          strokeWidth={1}
        />

        <div className="relative z-10 flex w-full flex-1 flex-col items-center">
          <p className="text-fg-subtle text-[9px] font-bold tracking-[0.22em]">
            PLAYDATA LMS · COURSE COMPETENCY CERTIFICATE
          </p>

          <span className="border-brand-deep/20 bg-surface mt-5 flex size-16 items-center justify-center rounded-full border p-1 shadow-sm">
            <span className="bg-brand-deep text-warning-inverse flex size-full items-center justify-center rounded-full">
              <Award aria-hidden="true" className="size-8" strokeWidth={1.6} />
            </span>
          </span>

          <h3 className="text-brand-deep mt-4 text-2xl font-extrabold tracking-[-0.02em]">
            추천 인증서
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn('size-1.5 rounded-full', style.marker)}
            />
            <span className={cn('text-[11px] font-bold', style.roleText)}>
              {style.label}
            </span>
          </div>

          <div
            className="my-5 flex w-full items-center gap-3"
            aria-hidden="true"
          >
            <span className="bg-brand-deep/10 h-px flex-1" />
            <span className="bg-warning size-1.5 rotate-45" />
            <span className="bg-brand-deep/10 h-px flex-1" />
          </div>

          <div className="text-fg-muted flex items-center gap-1.5 text-[10px] font-semibold">
            <ShieldCheck aria-hidden="true" className="text-brand size-3.5" />
            수강역량증명서에 반영된 추천
          </div>

          <blockquote className="text-fg my-5 max-w-md text-[16px] leading-8 font-semibold break-keep">
            “{recommendationQuote(item.quote)}”
          </blockquote>

          <div className="border-brand-deep/10 mt-auto grid w-full gap-3 border-t pt-5 sm:grid-cols-[1fr_auto] sm:items-end sm:text-left">
            <div>
              <span className="text-fg-subtle block text-[9px] font-bold tracking-[0.12em]">
                RECOMMENDED BY
              </span>
              <strong className="text-brand-deep mt-1 block text-[14px]">
                {item.name}
              </strong>
              <span className="text-fg-muted mt-0.5 block text-[11px]">
                {item.meta}
              </span>
            </div>
            <span className="text-fg-subtle text-[10px] sm:pb-0.5">
              {item.date}
            </span>
          </div>

          <p className="text-fg-subtle mt-5 text-[9px] leading-4 break-keep">
            수강 과정에서 작성되어 최종 수강역량증명서에 반영된 추천입니다.
          </p>
        </div>
      </div>
    </article>
  )
}

function formatValue(value: number | null) {
  return value === null ? '-' : String(value)
}

function formatPercent(value: number | null) {
  return value === null
    ? null
    : Number.isInteger(value)
      ? value
      : value.toFixed(1)
}

function isProgressMetric(
  metric: CertificateScoreMetric,
): metric is ProgressMetric {
  return progressMetricOrder.some((key) => key === metric.key)
}

function metricToKpi(metric: ProgressMetric): CertKpi {
  const bar =
    metric.value !== null && metric.maximum !== null && metric.maximum > 0
      ? Math.min(100, (metric.value / metric.maximum) * 100)
      : 0

  return {
    key: metric.key,
    label: metricLabelOverride[metric.key] ?? metric.label,
    value: formatValue(metric.value),
    unit: metric.unit,
    tone: metricTone[metric.key],
    bar,
    sub: metric.detail,
  }
}

const evaluatorAxisDefinitions = [
  {
    key: '기술·기술기여',
    label: '기술·기술기여',
    tone: axisTone['기술·기술기여'],
  },
  {
    key: '소통·협업·팀워크',
    label: '소통·협업·팀워크',
    tone: axisTone['소통·협업·팀워크'],
  },
  { key: '문제해결', label: '문제해결', tone: axisTone.문제해결 },
  { key: '책임감', label: '책임감', tone: axisTone.책임감 },
] as const satisfies ReadonlyArray<{
  key: CertificateScoreResult['axes'][number]['key']
  label: string
  tone: Tone
}>

function EvaluatorAverageKpi({
  kpi,
  axes,
  selectedAxisKey,
  route,
}: {
  kpi: CertKpi
  axes: CertificateScoreResult['axes']
  selectedAxisKey: AxisKey | null
  route: string
}) {
  const competencyAxes = evaluatorAxisDefinitions.map((definition) => {
    const axis = axes.find((item) => item.key === definition.key)
    const fivePointAverage =
      axis?.score === null || axis?.score === undefined
        ? null
        : 1 + axis.score / 25

    return {
      ...definition,
      score: fivePointAverage,
      convertedScore: axis?.score ?? null,
    }
  })
  const highlightedAxis = competencyAxes.find(
    (axis) => axis.key === selectedAxisKey,
  )

  return (
    <Link
      to={route}
      aria-label={`${kpi.label} 평가·추천 탭으로 이동`}
      data-summary-kpi="evaluatorAverage"
      data-summary-kpi-route={route}
      data-kpi-visual="evaluation"
      data-axis-highlighted={Boolean(highlightedAxis)}
      className={cn(
        card,
        'focus-visible:ring-ring group flex min-w-0 flex-col gap-2 p-4 transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none',
        highlightedAxis && 'ring-offset-surface ring-2 ring-offset-2',
        highlightedAxis && toneRing[highlightedAxis.tone],
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-fg-muted truncate text-[11px] font-medium">
            {kpi.label}
          </span>
          <span className="text-fg-muted truncate text-[10px] font-medium">
            동료·멘토·강사·운영 각 25% · 100점 환산
          </span>
        </div>
        {highlightedAxis && (
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-1 text-[9px] font-bold',
              TONE_SOFT[highlightedAxis.tone],
            )}
          >
            연결된 지표
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-1">
        {competencyAxes.map((axis) => (
          <div
            key={axis.key}
            className={cn(
              'grid grid-cols-[90px_minmax(0,1fr)_88px] items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors',
              selectedAxisKey === axis.key && TONE_SOFT[axis.tone],
            )}
            data-evaluator-axis-row={axis.key}
            data-axis-highlighted={selectedAxisKey === axis.key}
          >
            <span className="text-fg-subtle text-[9px] leading-3 font-medium">
              {axis.label}
            </span>
            <div className="bg-surface-muted h-1.5 min-w-0 overflow-hidden rounded-full">
              <div
                data-evaluator-axis-bar={axis.key}
                data-axis-tone={axis.tone}
                className={cn('h-full rounded-full', TONE_SOLID[axis.tone])}
                style={{
                  width: `${axis.score === null ? 0 : Math.min(100, (axis.score / 5) * 100)}%`,
                }}
              />
            </div>
            <span className="text-fg text-right text-[9px] font-bold tabular-nums">
              {axis.score?.toFixed(1) ?? '-'} / 5 →{' '}
              {displayNumber(axis.convertedScore)}점
            </span>
          </div>
        ))}
      </div>

      <div
        className="border-divider text-fg-subtle mt-1 flex items-center justify-between border-t pt-2 text-[9px] font-semibold"
        data-kpi-link-footer
      >
        <span>평가·추천 탭에서 자세히 보기</span>
        <ArrowRight
          aria-hidden="true"
          className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  )
}

function ProgressKpiCard({
  kpi,
  route,
  contribution,
  highlighted,
}: {
  kpi: CertKpi
  route: string
  contribution: {
    axisLabel: AxisKey
    score: number | null
    rule: string
  }
  highlighted: boolean
}) {
  return (
    <Link
      to={route}
      aria-label={`${kpi.label} 상세 화면으로 이동`}
      data-summary-kpi={kpi.key}
      data-summary-kpi-route={route}
      data-kpi-visual="progress"
      data-kpi-tone={kpi.tone}
      className={cn(
        card,
        'focus-visible:ring-ring group flex min-w-0 flex-col justify-between gap-4 p-5 transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none',
        highlighted && 'ring-offset-surface ring-2 ring-offset-2',
        highlighted && toneRing[kpi.tone ?? 'brand'],
      )}
      data-axis-highlighted={highlighted}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-fg-muted truncate text-[12px] font-semibold">
          {kpi.label}
        </span>
        {highlighted ? (
          <span
            className={cn(
              'rounded-full px-2 py-1 text-[9px] font-bold',
              TONE_SOFT[kpi.tone ?? 'brand'],
            )}
          >
            연결된 지표
          </span>
        ) : (
          <span
            className={cn(
              'size-2.5 rounded-full',
              TONE_SOLID[kpi.tone ?? 'brand'],
            )}
          />
        )}
      </div>

      <span className="text-fg text-[30px] leading-none font-bold tabular-nums">
        {kpi.value}
        {kpi.unit && (
          <span className="text-fg-muted ml-1 text-[14px] font-medium">
            {kpi.unit}
          </span>
        )}
      </span>

      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-1.5 rounded-lg px-2.5 py-2 text-[10px]',
          TONE_SOFT[kpi.tone ?? 'brand'],
        )}
        data-kpi-contribution={contribution.axisLabel}
      >
        <span className="font-semibold">6축 반영</span>
        <strong className="font-bold">
          {contribution.axisLabel} {displayNumber(contribution.score)}점
        </strong>
        <span className="w-full opacity-80">{contribution.rule}</span>
      </div>

      <div className="grid gap-2">
        <div
          className="bg-surface-muted h-2.5 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-label={`${kpi.label} 달성도`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(kpi.bar ?? 0)}
        >
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-500',
              TONE_SOLID[kpi.tone ?? 'brand'],
            )}
            style={{ width: `${kpi.bar ?? 0}%` }}
          />
        </div>
        <div
          className="flex items-center justify-between gap-2"
          data-kpi-link-footer
        >
          <span className="text-fg-subtle truncate text-[10px]" title={kpi.sub}>
            {kpi.sub}
          </span>
          <ArrowRight
            aria-hidden="true"
            className="text-fg-subtle size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
            data-progress-kpi-link-arrow
          />
        </div>
      </div>
    </Link>
  )
}

function LearningPersistenceKpi({
  axis,
  highlighted,
}: {
  axis: CertificateScoreResult['axes'][number] | undefined
  highlighted: boolean
}) {
  const definitions = [
    { key: 'blog', label: '블로그 제출', bonus: false },
    { key: 'assignment', label: '과제 제출', bonus: true },
    { key: 'study', label: '스터디 참여', bonus: true },
    { key: 'mentoring', label: '멘토링 참석', bonus: true },
  ] as const
  const items = definitions.map((definition) => ({
    ...definition,
    evidence: axis ? evidenceByKey(axis, definition.key) : undefined,
  }))
  const attendanceScore = axis
    ? (evidenceByKey(axis, 'attendance')?.appliedScore ?? 0)
    : 0
  const blogScore = items.find((item) => item.key === 'blog')?.evidence
    ?.appliedScore
  const bonusScore = items
    .filter((item) => item.bonus)
    .reduce((total, item) => total + (item.evidence?.appliedScore ?? 0), 0)
  const participationScore = (blogScore ?? 0) + bonusScore
  const combinedScore = attendanceScore + participationScore
  const finalScore = axis?.score ?? combinedScore

  return (
    <Link
      to="/student/records?category=blog"
      aria-label="학습 참여·제출 블로그 화면으로 이동"
      className={cn(
        card,
        'group flex min-w-0 flex-col gap-3 p-4 transition-shadow',
        highlighted && 'ring-offset-surface ring-2 ring-offset-2',
        highlighted && toneRing[axisTone.학습지속성],
      )}
      data-summary-kpi="learningPersistenceInputs"
      data-summary-kpi-route="/student/records?category=blog"
      data-kpi-visual="learning-components"
      data-kpi-tone={axisTone.학습지속성}
      data-axis-highlighted={highlighted}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-fg-muted text-[11px] font-semibold">
            학습 참여·제출
          </span>
          <span className="text-fg-subtle text-[9px]">
            블로그 기본 {items[0]?.evidence?.weightPercent ?? 30}% ·
            과제·스터디·멘토링 가산점
          </span>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-1 text-[9px] font-bold',
            TONE_SOFT[axisTone.학습지속성],
          )}
        >
          {axis?.score === null || axis?.score === undefined
            ? '산출 전'
            : `${highlighted ? '연결됨 · ' : ''}학습지속성 +${displayNumber(participationScore)}점`}
        </span>
      </div>

      <div className="grid gap-1.5">
        {items.map((item) => {
          const value = item.evidence?.value
          const appliedScore = item.evidence?.appliedScore
          const appliedLabel =
            appliedScore === null || appliedScore === undefined
              ? '-'
              : item.bonus
                ? `+${displayNumber(appliedScore)}점`
                : `${displayNumber(appliedScore)}점 반영`

          return (
            <div
              key={item.key}
              className="grid grid-cols-[76px_minmax(0,1fr)_64px] items-center gap-2"
              data-learning-input={item.key}
            >
              <span className="text-fg-subtle text-[9px] font-medium">
                {item.label}
              </span>
              <div className="bg-surface-muted h-1.5 min-w-0 overflow-hidden rounded-full">
                <div
                  className={cn(
                    'h-full rounded-full',
                    TONE_SOLID[axisTone.학습지속성],
                  )}
                  style={{
                    width: `${value === null || value === undefined ? 0 : Math.min(100, Math.max(0, value))}%`,
                  }}
                />
              </div>
              <span className="text-fg text-right text-[9px] font-bold tabular-nums">
                {value === null || value === undefined
                  ? '-'
                  : `${displayNumber(value)}%`}
                <span className={cn('ml-1', TONE_TEXT[axisTone.학습지속성])}>
                  {appliedLabel}
                </span>
              </span>
            </div>
          )
        })}
      </div>

      <div
        className="border-border text-fg-muted mt-auto flex items-end justify-between gap-2 border-t pt-2 text-[9px] font-medium"
        data-learning-persistence-calculation
        data-kpi-link-footer
      >
        <span className="flex flex-wrap items-center gap-x-1">
          <span>출석 {displayNumber(attendanceScore)}점</span>
          <span aria-hidden="true">+</span>
          <span>블로그 {displayNumber(blogScore ?? 0)}점</span>
          <span aria-hidden="true">+</span>
          <span>가산점 {displayNumber(bonusScore)}점</span>
          <span aria-hidden="true">=</span>
          {combinedScore !== finalScore && (
            <>
              <span>{displayNumber(combinedScore)}점</span>
              <span aria-hidden="true">→</span>
            </>
          )}
          <strong className={TONE_TEXT[axisTone.학습지속성]}>
            학습지속성 {displayNumber(finalScore)}점
          </strong>
        </span>
        <ArrowRight
          aria-hidden="true"
          className="text-fg-subtle size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
          data-learning-persistence-link-arrow
        />
      </div>
    </Link>
  )
}

function CertificateScoreLoading() {
  return (
    <section
      className={cn(card, 'flex w-full flex-col gap-4')}
      role="status"
      aria-live="polite"
      data-axis-gauge-loading
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-fg text-[15px] font-bold">6축 역량 점수</span>
        <span className="text-fg-muted text-[11px]">
          원천 평가 데이터를 절대 점수와 전체 상대 위치로 변환 중
        </span>
      </div>
      <div className="grid gap-3">
        {CERTIFICATE_AXIS_KEYS.map((key) => (
          <div key={key} className="grid gap-2 sm:grid-cols-[150px_1fr_120px]">
            <span className="bg-surface-muted h-4 animate-pulse rounded" />
            <span className="bg-surface-muted h-2.5 animate-pulse self-center rounded-full" />
            <span className="bg-surface-muted h-4 animate-pulse rounded" />
          </div>
        ))}
      </div>
      <span className="text-fg-muted text-[12px] font-semibold">
        6축 점수를 계산하는 중…
      </span>
    </section>
  )
}

const axisEvidencePolicy: Record<
  AxisKey,
  { description: string; data: string; calculation: string }
> = {
  '기술·기술기여': {
    description:
      '과정에서 기술을 이해하고 실제 팀 결과물에 기여한 정도를 보여주는 점수입니다.',
    data: '동료 기술기여 평가, 멘토·강사·운영 기술 평가',
    calculation:
      '동료·멘토·강사·운영 평가자 그룹의 1~5점 평균을 각각 25%로 반영해 100점으로 환산합니다.',
  },
  학습지속성: {
    description:
      '수업 참여와 학습 기록을 얼마나 꾸준히 이어 갔는지 보여주는 점수입니다.',
    data: '출결 기록, 블로그 제출, 과제 제출, 스터디 활동, 멘토링 참석',
    calculation:
      '출석률 70%와 블로그 제출률 30%를 기본으로 하고, 과제·스터디·멘토링 참여는 가산점으로 반영합니다.',
  },
  '소통·협업·팀워크': {
    description:
      '프로젝트에서 의견을 나누고 공동 목표를 위해 협력한 정도를 보여주는 점수입니다.',
    data: '동료 소통·협업 평가, 멘토 소통·팀워크 평가, 강사·운영 통합 평가',
    calculation:
      '동료·멘토·강사·운영 평가자 그룹의 1~5점 평균을 각각 25%로 반영해 100점으로 환산합니다.',
  },
  문제해결: {
    description:
      '문제를 파악하고 해결 방향을 찾아 실행한 정도를 보여주는 점수입니다.',
    data: '동료·멘토·강사·운영 문제해결 평가',
    calculation:
      '동료·멘토·강사·운영 평가자 그룹의 1~5점 평균을 각각 25%로 반영해 100점으로 환산합니다.',
  },
  책임감: {
    description:
      '맡은 역할과 약속을 프로젝트 안에서 꾸준히 지킨 정도를 보여주는 점수입니다.',
    data: '동료·멘토·강사·운영 책임감 평가',
    calculation:
      '동료·멘토·강사·운영 평가자 그룹의 1~5점 평균을 각각 25%로 반영해 100점으로 환산합니다.',
  },
  '성취도 평가': {
    description:
      '과정에서 실시한 성취도 평가의 학습 결과를 보여주는 점수입니다.',
    data: '채점이 끝난 성취도 평가의 최신 유효 응시 점수',
    calculation: '반영 대상 성취도 평가 점수를 동일 비중으로 전체 평균합니다.',
  },
}

const axisStatusLabel: Record<
  CertificateScoreResult['axes'][number]['status'],
  string
> = {
  READY: '산출 완료',
  NOT_READY: '산출 대기',
  ERROR: '확인 필요',
}

function AxisGaugeList({
  axes,
  selectedAxisKey,
  highlightedByOverall,
  onToggleAxis,
}: {
  axes: CertificateScoreResult['axes']
  selectedAxisKey: AxisKey | null
  highlightedByOverall: boolean
  onToggleAxis: (key: AxisKey) => void
}) {
  const axisByKey = new Map(axes.map((axis) => [axis.key, axis]))

  return (
    <section
      className={cn(
        card,
        'flex min-w-0 flex-1 flex-col gap-4 transition-shadow',
        highlightedByOverall &&
          'ring-brand/50 ring-offset-surface ring-2 ring-offset-2',
      )}
      data-axis-gauge-list
      data-overall-basis-highlighted={highlightedByOverall}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-fg text-[15px] font-bold">6축 역량 점수</span>
          <span className="text-fg-muted text-[11px]">
            학습·성과 지표를 100점 기준으로 환산 · 축을 누르면 관련 지표 강조
          </span>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-1 text-[9px] font-bold transition-colors',
            highlightedByOverall
              ? 'bg-brand/10 text-brand'
              : 'bg-surface-muted text-fg-subtle',
          )}
        >
          종합 점수 산출 기준
        </span>
      </div>

      <div className="grid flex-1 content-center gap-3.5">
        {CERTIFICATE_AXIS_KEYS.map((key) => {
          const axis = axisByKey.get(key)
          const scoreValue = axis?.score ?? null
          const gaugeWidth =
            scoreValue === null ? 0 : Math.min(100, Math.max(0, scoreValue))
          const topPercent =
            axis?.relative.status === 'READY'
              ? formatPercent(axis.relative.topPercent)
              : null
          const scopeLabel = axis?.relative.scope === 'COHORT' ? '기수' : '전체'

          return (
            <button
              key={key}
              type="button"
              aria-pressed={selectedAxisKey === key}
              aria-label={`${key} ${scoreValue === null ? '산출 전' : `${displayNumber(scoreValue)}점`} 관련 지표 ${selectedAxisKey === key ? '강조 해제' : '강조'}`}
              className={cn(
                'focus-visible:ring-ring grid w-full cursor-pointer items-center gap-x-3 gap-y-1 rounded-xl px-2.5 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none sm:grid-cols-[150px_minmax(120px,1fr)_56px_104px]',
                selectedAxisKey === key
                  ? TONE_SOFT[axisTone[key]]
                  : 'hover:bg-surface-muted',
              )}
              data-axis-gauge={key}
              data-axis-tone={axisTone[key]}
              data-axis-selected={selectedAxisKey === key}
              onClick={() => onToggleAxis(key)}
            >
              <span className="text-fg truncate text-[12px] font-bold">
                {key}
              </span>
              <div
                role="img"
                aria-label={`${key} 절대 점수 ${scoreValue === null ? '산출 전' : `${displayNumber(scoreValue)}점`}`}
                className="bg-surface-muted h-2.5 min-w-0 overflow-hidden rounded-full"
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-500',
                    TONE_SOLID[axisTone[key]],
                  )}
                  style={{ width: `${gaugeWidth}%` }}
                  data-axis-gauge-progress={key}
                />
              </div>
              <span className="text-fg text-right text-[12px] font-bold tabular-nums">
                {scoreValue === null ? '-' : displayNumber(scoreValue)}점
              </span>
              <span className="text-info text-right text-[11px] font-semibold tabular-nums">
                {topPercent === null
                  ? '상대 위치 산출 전'
                  : `${scopeLabel} 상위 ${topPercent}%`}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

type AxisEvidence = CertificateScoreResult['axes'][number]['evidence'][number]

function displayNumber(value: number | null, digits = 1) {
  if (value === null) return '-'
  return Number.isInteger(value) ? String(value) : value.toFixed(digits)
}

function evidenceByKey(
  axis: CertificateScoreResult['axes'][number],
  key: string,
) {
  return axis.evidence.find((item) => item.key === key)
}

function EvidenceCard({
  item,
  valueLabel,
}: {
  item: AxisEvidence
  valueLabel?: string
}) {
  return (
    <article className="border-border bg-surface flex min-w-0 flex-col gap-1.5 rounded-xl border p-4">
      <span className="text-fg-muted text-[12px] font-semibold">
        {item.label}
      </span>
      <strong className="text-fg text-[22px] leading-none">
        {valueLabel ?? `${displayNumber(item.value)}${item.unit}`}
      </strong>
      <span className="text-fg-subtle text-[11px] leading-5">
        {item.detail}
      </span>
    </article>
  )
}

function CalculationBox({
  lines,
  result,
  tone,
}: {
  lines: string[]
  result: string
  tone: Tone
}) {
  return (
    <section
      data-axis-calculation
      className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-4"
    >
      <span className={cn('text-[12px] font-bold', TONE_TEXT[tone])}>
        계산 과정
      </span>
      {lines.map((line) => (
        <p key={line} className="text-fg-muted text-[13px] leading-5">
          {line}
        </p>
      ))}
      <p className="border-divider text-fg border-t pt-2 text-[15px] font-bold">
        {result}
      </p>
    </section>
  )
}

function AchievementEvidence({
  axis,
  assessments,
  pending,
}: {
  axis: CertificateScoreResult['axes'][number]
  assessments: CertificateAssessmentPoint[]
  pending: boolean
}) {
  const achievement = evidenceByKey(axis, 'achievementAssessment')

  return (
    <div className="grid gap-4">
      <section className="border-divider grid gap-3 border-t pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-fg text-[15px] font-bold">성취도 평가별 점수</h3>
          <span className="text-fg-subtle text-[11px]">채점 완료 기준</span>
        </div>
        {pending ? (
          <p className="text-fg-muted text-[13px]">평가 결과를 불러오는 중</p>
        ) : assessments.length === 0 ? (
          <p className="text-fg-muted text-[13px]">
            채점이 끝난 평가가 아직 없습니다.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {assessments.map((assessment) => (
              <article
                key={assessment.id}
                data-assessment-evidence={assessment.category}
                className="border-border bg-surface flex min-w-0 flex-col gap-1 rounded-lg border p-3"
              >
                <span className="text-brand text-[10px] font-bold">
                  성취도 평가
                </span>
                <span className="text-fg text-[13px] font-bold">
                  {assessment.category}
                </span>
                <span className="text-fg-subtle line-clamp-2 text-[11px] leading-4">
                  {assessment.title}
                </span>
                <strong className="text-fg mt-1 text-[20px]">
                  {displayNumber(assessment.score)}점
                </strong>
              </article>
            ))}
          </div>
        )}
      </section>

      {achievement && (
        <CalculationBox
          lines={[
            `채점 완료 ${achievement.numerator ?? 0}/${achievement.denominator ?? 0}건의 최신 유효 점수를 동일 비중으로 반영합니다.`,
            `성취도 평가 전체 평균 = ${displayNumber(achievement.value)}점`,
          ]}
          result={`성취도 평가 최종 ${displayNumber(axis.score)}점`}
          tone={axisTone[axis.key]}
        />
      )}
    </div>
  )
}

function EvaluatorEvidence({
  axis,
}: {
  axis: CertificateScoreResult['axes'][number]
}) {
  const evaluations = [
    evidenceByKey(axis, 'peerEvaluation'),
    evidenceByKey(axis, 'mentorEvaluation'),
    evidenceByKey(axis, 'instructorEvaluation'),
    evidenceByKey(axis, 'managerEvaluation'),
  ].filter((item): item is AxisEvidence => item !== undefined)
  if (evaluations.length === 0) return null

  return (
    <div className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {evaluations.map((item) => (
          <EvidenceCard
            key={item.key}
            item={item}
            valueLabel={`${displayNumber(item.value, 2)}/5점`}
          />
        ))}
      </div>
      <CalculationBox
        lines={[
          ...evaluations.map(
            (item) =>
              `${item.label} ${displayNumber(item.value, 2)}/5점 → 100점 환산 후 25% 반영 ${displayNumber(item.appliedScore)}점`,
          ),
          '1점은 0점, 5점은 100점이 되도록 100점 기준으로 환산합니다.',
        ]}
        result={`${axis.key} 최종 ${displayNumber(axis.score)}점`}
        tone={axisTone[axis.key]}
      />
    </div>
  )
}

function LearningEvidence({
  axis,
}: {
  axis: CertificateScoreResult['axes'][number]
}) {
  const items = ['attendance', 'blog', 'assignment', 'mentoring', 'study']
    .map((key) => evidenceByKey(axis, key))
    .filter((item): item is AxisEvidence => item !== undefined)
  const attendance = evidenceByKey(axis, 'attendance')
  const blog = evidenceByKey(axis, 'blog')
  const bonuses = items.filter((item) =>
    ['assignment', 'mentoring', 'study'].includes(item.key),
  )
  if (!attendance || !blog) return null
  const beforeCap = items.reduce(
    (sum, item) => sum + (item.appliedScore ?? 0),
    0,
  )

  return (
    <div className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <EvidenceCard
            key={item.key}
            item={item}
            valueLabel={
              item.denominator
                ? `${item.numerator}/${item.denominator}${item.key === 'attendance' ? '일' : item.key === 'mentoring' ? '회' : item.key === 'blog' ? '주' : '건'} · ${displayNumber(item.value)}%`
                : item.detail
            }
          />
        ))}
      </div>
      <CalculationBox
        lines={[
          `출석률 ${displayNumber(attendance.value)}%의 70% 반영 = ${displayNumber(attendance.appliedScore)}점`,
          `블로그 제출률 ${displayNumber(blog.value)}%의 30% 반영 = ${displayNumber(blog.appliedScore)}점`,
          ...bonuses.map(
            (item) =>
              `${item.label} 가산점 = ${displayNumber(item.appliedScore)}점 (최대 5점)`,
          ),
        ]}
        result={`${items.map((item) => displayNumber(item.appliedScore)).join(' + ')} = ${displayNumber(beforeCap)}점${beforeCap > 100 ? ` → 100점 상한 적용 = ${displayNumber(axis.score)}점` : ''}`}
        tone={axisTone[axis.key]}
      />
    </div>
  )
}

export function ScoreEvidencePanel({
  axes,
  assessments,
  assessmentsPending,
  selectedAxisKey,
  onClose,
}: {
  axes: CertificateScoreResult['axes']
  assessments: CertificateAssessmentPoint[]
  assessmentsPending: boolean
  selectedAxisKey: AxisKey
  onClose: () => void
}) {
  const selectedAxis =
    axes.find((axis) => axis.key === selectedAxisKey) ?? axes[0]
  if (!selectedAxis) return null

  const policy = axisEvidencePolicy[selectedAxis.key]
  const tone = axisTone[selectedAxis.key]

  return (
    <section
      id="score-evidence"
      data-score-evidence={selectedAxis.key}
      className={cn(card, 'flex min-w-0 flex-col gap-4 p-5')}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-fg text-[20px] font-bold">
            {selectedAxis.key} 계산 근거
          </span>
          <span className="text-fg-muted text-[13px] leading-5">
            사용한 항목부터 환산·가중치와 최종 점수까지 순서대로 확인할 수
            있어요.
          </span>
        </div>
        <button
          type="button"
          aria-label={`${selectedAxis.key} 계산 근거 닫기`}
          className="border-border text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:ring-ring grid size-8 shrink-0 place-items-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:outline-none"
          onClick={onClose}
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
        {[
          ['1', '사용한 항목', policy.data],
          ['2', '계산 기준', policy.calculation],
          [
            '3',
            '6축 반영 결과',
            `${selectedAxis.key} ${displayNumber(selectedAxis.score)}점`,
          ],
        ].map(([step, label, description], index) => (
          <div key={step} className="contents">
            {index > 0 && (
              <ArrowRight
                aria-hidden="true"
                className="text-fg-subtle mx-auto hidden size-4 self-center md:block"
              />
            )}
            <div className="border-border bg-surface flex min-w-0 flex-col gap-1.5 rounded-xl border p-3">
              <span
                className={cn(
                  'text-[10px] font-bold tracking-[0.08em]',
                  TONE_TEXT[tone],
                )}
              >
                STEP {step} · {label}
              </span>
              <span className="text-fg-muted text-[12px] leading-5">
                {description}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        role="tabpanel"
        aria-live="polite"
        className={cn(
          'flex flex-col gap-4 rounded-xl border p-4',
          TONE_SOFT[tone],
        )}
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className={cn('text-[11px] font-bold', TONE_TEXT[tone])}>
              {selectedAxis.key} 점수
            </span>
            <span className="text-fg text-[32px] leading-none font-bold">
              {selectedAxis.score?.toFixed(1) ?? '-'}
              <span className="text-fg-muted ml-1 text-[14px] font-medium">
                / 100
              </span>
            </span>
          </div>
          <span className="bg-surface text-fg-muted rounded-md px-2 py-1 text-[10px] font-bold">
            {axisStatusLabel[selectedAxis.status]}
          </span>
        </div>

        <p className="text-fg-muted text-[14px] leading-6">
          {policy.description}
        </p>

        {['기술·기술기여', '소통·협업·팀워크', '문제해결', '책임감'].includes(
          selectedAxis.key,
        ) && <EvaluatorEvidence axis={selectedAxis} />}
        {selectedAxis.key === '성취도 평가' && (
          <AchievementEvidence
            axis={selectedAxis}
            assessments={assessments}
            pending={assessmentsPending}
          />
        )}
        {selectedAxis.key === '학습지속성' && (
          <LearningEvidence axis={selectedAxis} />
        )}

        {selectedAxis.evidence.length === 0 && (
          <dl className="border-divider grid gap-4 border-t pt-4">
            <div className="grid gap-1">
              <dt className="text-fg-subtle text-[11px] font-bold">
                계산 기준
              </dt>
              <dd className="text-fg-muted text-[13px] leading-6">
                {policy.calculation}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-fg-subtle text-[11px] font-bold">
                이번 점수의 실제 근거
              </dt>
              <dd className="text-fg-muted text-[13px] leading-6">
                {selectedAxis.detail}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </section>
  )
}

function ScoreSummary({
  score,
  ontology,
  recommendations = [],
}: {
  score: CertificateScoreResult
  ontology?: Awaited<ReturnType<typeof fetchAiAnalysis>>['ontology']
  recommendations?: CertRecommendation[]
}) {
  const [selectedAxisKey, setSelectedAxisKey] = useState<AxisKey | null>(null)
  const [isOverallBasisHighlighted, setIsOverallBasisHighlighted] =
    useState(false)
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<CertRecommendation | null>(null)
  const visibleRecommendations = (['강사', '멘토'] as const)
    .map((role) => recommendations.find((item) => item.role === role))
    .filter((item): item is CertRecommendation => item !== undefined)
  const domains = score.domainExperience.map((domain, index) => ({
    label: domain.label,
    pct: domain.percentage,
    projectCount: domain.projectCount,
    tone: domainTones[index % domainTones.length],
  }))
  const progressKpis = score.metrics
    .filter(isProgressMetric)
    .sort(
      (a, b) =>
        progressMetricOrder.indexOf(a.key) - progressMetricOrder.indexOf(b.key),
    )
    .map(metricToKpi)
  const attendanceKpi = progressKpis.find((kpi) => kpi.key === 'attendance')
  const assessmentKpi = progressKpis.find((kpi) => kpi.key === 'assessment')
  const evaluatorKpi = progressKpis.find(
    (kpi) => kpi.key === 'evaluatorAverage',
  )
  const learningAxis = score.axes.find((axis) => axis.key === '학습지속성')
  const attendanceEvidence = learningAxis
    ? evidenceByKey(learningAxis, 'attendance')
    : undefined
  const assessmentAxis = score.axes.find((axis) => axis.key === '성취도 평가')
  const overall = score.overallScore ?? 0
  const progressOffset = Number(
    (100 - Math.min(100, Math.max(0, overall))).toFixed(1),
  )
  const overallTopPercent =
    score.overallRelative.status === 'READY' &&
    score.overallRelative.scope === 'ALL_STUDENTS'
      ? formatPercent(score.overallRelative.topPercent)
      : null

  return (
    <div className="flex flex-col gap-4">
      <TabHead
        no={1}
        title="종합 요약 · 핵심 지표"
        sub="산출 흐름 · 학습·성과 지표 → 6축 역량 점수 → 절대 종합 점수"
      >
        <span className="text-fg-subtle text-[11px]">
          산정일 {score.calculatedAt}
        </span>
      </TabHead>

      <div className="grid gap-4 lg:grid-cols-[minmax(300px,35%)_minmax(0,65%)]">
        <div
          className={cn(
            card,
            'flex flex-col gap-4 transition-shadow',
            isOverallBasisHighlighted &&
              'ring-brand/50 ring-offset-surface ring-2 ring-offset-2',
          )}
          data-overall-score-card
          data-overall-selected={isOverallBasisHighlighted}
        >
          <button
            type="button"
            aria-pressed={isOverallBasisHighlighted}
            aria-label={`절대 종합 점수 ${score.overallScore?.toFixed(1) ?? '-'}점 · 6축 역량 점수 산출 기준 ${isOverallBasisHighlighted ? '강조 해제' : '강조'}`}
            className="focus-visible:ring-brand flex flex-1 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl outline-none focus-visible:ring-2"
            onClick={() => {
              setSelectedAxisKey(null)
              setIsOverallBasisHighlighted((current) => !current)
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-fg-subtle text-[10px] font-bold">
                AGGREGATE SCORE
              </span>
              <span className="text-fg text-[15px] font-bold">
                절대 종합 점수
              </span>
              <span className="text-fg-muted text-[11px]">
                6축 역량 점수를 종합한 결과
              </span>
            </div>

            <div
              data-overall-score-gauge
              role="img"
              aria-label={`절대 종합 점수 ${score.overallScore?.toFixed(1) ?? '-'}점`}
              className="relative size-48"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 120 120"
                className="size-full -rotate-90"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  pathLength="100"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-surface-muted"
                />
                <circle
                  data-overall-score-progress
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  pathLength="100"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="100"
                  strokeDashoffset={progressOffset}
                  className="text-brand transition-[stroke-dashoffset] duration-700 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-fg text-[44px] leading-none font-bold tracking-[-0.04em]">
                  {score.overallScore?.toFixed(1) ?? '-'}
                </span>
                <span className="text-fg-muted mt-1.5 text-[12px] font-medium">
                  / 100
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="bg-brand/10 text-brand rounded-full px-3 py-1.5 text-[12px] font-bold">
                Grade {score.grade ?? '-'}
              </span>
              <span className="bg-info-bg text-info rounded-full px-3 py-1.5 text-[12px] font-bold">
                {overallTopPercent === null
                  ? '전체 상위 산출 전'
                  : `전체 상위 ${overallTopPercent}%`}
              </span>
            </div>
          </button>

          {visibleRecommendations.length > 0 && (
            <div className="border-divider flex flex-col items-center gap-2 border-t pt-4">
              <span className="text-fg-subtle text-[10px] font-bold">
                공식 추천
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {visibleRecommendations.map((item) => (
                  <RecommendationBadge
                    key={item.role}
                    item={item}
                    onClick={() => setSelectedRecommendation(item)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <AxisGaugeList
          axes={score.axes}
          selectedAxisKey={selectedAxisKey}
          highlightedByOverall={isOverallBasisHighlighted}
          onToggleAxis={(key) => {
            setIsOverallBasisHighlighted(false)
            setSelectedAxisKey((current) => (current === key ? null : key))
          }}
        />
      </div>

      <section className="flex flex-col gap-3" data-summary-metrics-section>
        <div className="flex flex-col gap-0.5">
          <span className="text-fg text-[15px] font-bold">학습·성과 지표</span>
          <span className="text-fg-muted text-[11px]">
            6축 역량 점수를 산출하는 학습·평가 근거
          </span>
        </div>

        <div data-summary-kpi-grid className="grid gap-4">
          <div className="grid gap-2">
            <span className="text-fg-subtle text-[10px] font-bold">
              학습·평가 구성
            </span>
            <div
              className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
              data-summary-learning-grid
            >
              {attendanceKpi && (
                <ProgressKpiCard
                  kpi={attendanceKpi}
                  route={metricRoute('attendance')}
                  contribution={{
                    axisLabel: '학습지속성',
                    score: attendanceEvidence?.appliedScore ?? null,
                    rule: `출석률 기본점수 ${attendanceEvidence?.weightPercent ?? 70}% 반영`,
                  }}
                  highlighted={selectedAxisKey === '학습지속성'}
                />
              )}
              <LearningPersistenceKpi
                axis={learningAxis}
                highlighted={selectedAxisKey === '학습지속성'}
              />
              {assessmentKpi && (
                <ProgressKpiCard
                  kpi={assessmentKpi}
                  route={metricRoute('assessment')}
                  contribution={{
                    axisLabel: '성취도 평가',
                    score: assessmentAxis?.score ?? null,
                    rule: '채점 완료 평가의 전체 평균을 직접 반영',
                  }}
                  highlighted={selectedAxisKey === '성취도 평가'}
                />
              )}
              {evaluatorKpi && (
                <EvaluatorAverageKpi
                  kpi={evaluatorKpi}
                  axes={score.axes}
                  selectedAxisKey={selectedAxisKey}
                  route={metricRoute('evaluatorAverage')}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3" data-summary-context-section>
        <div className="flex flex-col gap-0.5">
          <span className="text-fg text-[15px] font-bold">경험·역량 맥락</span>
          <span className="text-fg-muted text-[11px]">
            점수가 확인된 프로젝트 도메인과 학습 이력의 연결
          </span>
        </div>
        <div
          data-summary-context-layout
          className={cn(
            'grid min-w-0 gap-4',
            ontology &&
              'xl:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] xl:items-stretch',
          )}
        >
          {CERT_V2 && (
            <DomainDonut domains={domains} compact className="h-full" />
          )}
          {CERT_V2 && ontology && (
            <OntologyMap ontology={ontology} compact className="h-full" />
          )}
        </div>
      </section>

      <Modal
        open={selectedRecommendation !== null}
        onClose={() => setSelectedRecommendation(null)}
        size="lg"
        title={
          selectedRecommendation
            ? `${selectedRecommendation.role} 추천 인증서`
            : undefined
        }
      >
        {selectedRecommendation && (
          <RecommendationCertificate item={selectedRecommendation} />
        )}
      </Modal>
    </div>
  )
}

export function SummaryTab({
  studentId = CERTIFICATE_MOCK_STUDENT_ID,
  recommendations = [],
}: {
  s: CertSummaryTab
  studentId?: string
  recommendations?: CertRecommendation[]
}) {
  const scoreQuery = useQuery({
    queryKey: ['certificateScore', studentId],
    queryFn: () => fetchCertificateScore(studentId),
  })
  const { data: ai } = useQuery({
    queryKey: ['aiAnalysis', studentId],
    queryFn: () => fetchAiAnalysis(studentId),
  })
  return (
    <DataBoundary
      isPending={scoreQuery.isPending}
      isError={scoreQuery.isError || !scoreQuery.data}
      onRetry={scoreQuery.refetch}
      skeleton={<CertificateScoreLoading />}
      errorTitle="수강역량 점수를 불러오지 못했어요"
      errorDescription="LMS-AI 엔진 상태와 수강생 식별자를 확인해 주세요."
    >
      {scoreQuery.data && (
        <ScoreSummary
          score={scoreQuery.data}
          ontology={ai?.ontology}
          recommendations={recommendations}
        />
      )}
    </DataBoundary>
  )
}
