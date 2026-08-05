import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { cn } from '@/shared/lib/cn'
import { TONE_SOLID } from '@/shared/lib/tone'
import {
  CERTIFICATE_MOCK_STUDENT_ID,
  CERTIFICATE_AXIS_KEYS,
  fetchAiAnalysis,
  fetchCertificateScore,
  type CertificateAssessmentPoint,
  type CertificateScoreMetric,
  type CertificateScoreResult,
} from '../ai'
import { SkillRadar, SkillRadarLoading } from '../components/SkillRadar'
import { CERT_V2 } from '../config'
import type {
  CertKpi,
  CertRecommendation,
  CertSummaryTab,
  Tone,
} from '../types'
import { DomainDonut } from '../v2/DomainDonut'
import { OntologyMap } from '../v2/OntologyMap'

const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

const metricTone: Record<CertificateScoreMetric['key'], Tone> = {
  attendance: 'success',
  assessment: 'info',
  blog: 'accent',
  certifiedProject: 'brand',
  certifiedTroubleshooting: 'warning',
  certifiedCertificate: 'accent',
  evaluatorAverage: 'success',
}

const metricOrder: CertificateScoreMetric['key'][] = [
  'assessment',
  'attendance',
  'certifiedProject',
  'certifiedTroubleshooting',
  'certifiedCertificate',
  'evaluatorAverage',
]

function metricRoute(
  key: CertificateScoreMetric['key'],
  projectNavigation: CertificateScoreResult['projectNavigation'],
) {
  if (key === 'assessment') return '/student/quizzes'
  if (key === 'attendance') return '/student/attendance'
  if (key === 'blog') return '/student/records'
  if (key === 'certifiedProject') return '/student/projects'
  if (key === 'certifiedCertificate') return '/student/records'
  if (key === 'evaluatorAverage') {
    return '/student/certificate?tab=growth-reputation'
  }
  return projectNavigation.issuesProjectId
    ? `/student/projects/${encodeURIComponent(projectNavigation.issuesProjectId)}?tab=issues`
    : '/student/projects'
}

const domainTones: Tone[] = [
  'info',
  'success',
  'warning',
  'accent',
  'brand',
  'danger',
]

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

function metricToKpi(metric: CertificateScoreMetric): CertKpi {
  const bar =
    metric.value !== null && metric.maximum !== null && metric.maximum > 0
      ? Math.min(100, (metric.value / metric.maximum) * 100)
      : 0

  return {
    key: metric.key,
    label: metric.label,
    value: formatValue(metric.value),
    unit: metric.unit,
    tone: metricTone[metric.key],
    bar,
    sub: metric.detail,
  }
}

const evaluatorAxisDefinitions = [
  { key: '기술·기술기여', label: '기술·기술기여', tone: 'brand' },
  { key: '소통·협업·팀워크', label: '소통·협업·팀워크', tone: 'info' },
  { key: '문제해결', label: '문제해결', tone: 'warning' },
  { key: '책임감', label: '책임감', tone: 'success' },
] as const satisfies ReadonlyArray<{
  key: CertificateScoreResult['axes'][number]['key']
  label: string
  tone: Tone
}>

function EvaluatorAverageKpi({
  kpi,
  axes,
}: {
  kpi: CertKpi
  axes: CertificateScoreResult['axes']
}) {
  const competencyAxes = evaluatorAxisDefinitions.map((definition) => {
    const axis = axes.find((item) => item.key === definition.key)
    const fivePointAverage =
      axis?.score === null || axis?.score === undefined
        ? null
        : 1 + axis.score / 25

    return { ...definition, score: fivePointAverage }
  })

  return (
    <Link
      to="/student/certificate?tab=growth-reputation"
      aria-label="다면역량 평가 상세 화면으로 이동"
      data-summary-kpi="evaluatorAverage"
      data-summary-kpi-route="/student/certificate?tab=growth-reputation"
      className={cn(
        card,
        'focus-visible:ring-ring group flex min-w-0 flex-col gap-2 p-4 transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-fg-muted truncate text-[11px] font-medium">
            {kpi.label}
          </span>
          <span className="text-fg-subtle truncate text-[9px]">
            동료·멘토·강사·매니저 전체 평균 · 5점 만점
          </span>
        </div>
        <ArrowRight
          aria-hidden="true"
          className="text-fg-subtle size-3 shrink-0 transition-transform group-hover:translate-x-0.5"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-1">
        {competencyAxes.map((axis) => (
          <div
            key={axis.key}
            className="grid grid-cols-[90px_minmax(0,1fr)_42px] items-center gap-1.5"
          >
            <span className="text-fg-subtle text-[9px] leading-3 font-medium">
              {axis.label}
            </span>
            <div className="bg-surface-muted h-1.5 min-w-0 overflow-hidden rounded-full">
              <div
                data-evaluator-axis-bar={axis.key}
                className={cn('h-full rounded-full', TONE_SOLID[axis.tone])}
                style={{
                  width: `${axis.score === null ? 0 : Math.min(100, (axis.score / 5) * 100)}%`,
                }}
              />
            </div>
            <span className="text-fg text-right text-[9px] font-bold">
              {axis.score?.toFixed(1) ?? '-'} / 5
            </span>
          </div>
        ))}
      </div>
    </Link>
  )
}

function CertificateScoreLoading() {
  return (
    <section className="border-border bg-surface flex w-full flex-col items-center overflow-hidden rounded-lg border shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]">
      <div className="flex w-full flex-col gap-0.5 px-6 pt-6 pb-3">
        <span className="text-fg text-[15px] font-bold">역량 비교 레이더</span>
        <span className="text-fg-muted text-[11px]">
          원천 평가 데이터를 6축 점수와 기수 상대 위치로 변환 중
        </span>
      </div>
      <SkillRadarLoading />
    </section>
  )
}

type AxisKey = CertificateScoreResult['axes'][number]['key']

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
}: {
  lines: string[]
  result: string
}) {
  return (
    <section
      data-axis-calculation
      className="border-brand/20 bg-surface flex flex-col gap-2 rounded-xl border p-4"
    >
      <span className="text-brand text-[12px] font-bold">계산 과정</span>
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
      />
    </div>
  )
}

export function ScoreEvidencePanel({
  axes,
  assessments,
  assessmentsPending,
  selectedAxisKey,
  onSelectAxis,
}: {
  axes: CertificateScoreResult['axes']
  assessments: CertificateAssessmentPoint[]
  assessmentsPending: boolean
  selectedAxisKey: AxisKey
  onSelectAxis: (key: AxisKey) => void
}) {
  const selectedAxis =
    axes.find((axis) => axis.key === selectedAxisKey) ?? axes[0]
  if (!selectedAxis) return null

  const policy = axisEvidencePolicy[selectedAxis.key]

  return (
    <section
      id="score-evidence"
      data-score-evidence={selectedAxis.key}
      className={cn(card, 'flex min-w-0 flex-col gap-4 p-5')}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-fg text-[20px] font-bold">6축 점수 근거</span>
        <span className="text-fg-muted text-[13px] leading-5">
          항목을 선택하면 점수에 사용한 평가와 계산 기준을 확인할 수 있어요.
        </span>
      </div>

      <div
        role="tablist"
        aria-label="점수 근거 항목"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        {CERTIFICATE_AXIS_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={selectedAxis.key === key}
            className={cn(
              'min-h-9 rounded-lg border px-3 py-2 text-[12px] font-bold transition-colors',
              selectedAxis.key === key
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-border text-fg-muted hover:bg-surface-muted hover:text-fg',
            )}
            onClick={() => onSelectAxis(key)}
          >
            {key}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        aria-live="polite"
        className="border-brand/20 bg-brand/5 flex flex-col gap-4 rounded-xl border p-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-brand text-[11px] font-bold">
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
}: {
  score: CertificateScoreResult
  ontology?: Awaited<ReturnType<typeof fetchAiAnalysis>>['ontology']
}) {
  const [selectedAxisKey, setSelectedAxisKey] =
    useState<AxisKey>('기술·기술기여')
  const axisByKey = new Map(score.axes.map((axis) => [axis.key, axis]))
  const radarAxes = CERTIFICATE_AXIS_KEYS.map((key) => {
    const axis = axisByKey.get(key)
    return {
      key,
      score: axis?.score ?? null,
      relativePercentile:
        axis?.relative.status === 'READY' ? axis.relative.percentile : null,
      relativeTopPercent:
        axis?.relative.status === 'READY' ? axis.relative.topPercent : null,
      detail: axis?.detail ?? '평가 근거를 확인할 수 없습니다.',
      source: axis?.source ?? '계산식을 확인할 수 없습니다.',
      status: axis?.status ?? ('ERROR' as const),
      relativeStatus: axis?.relative.status ?? ('NOT_READY' as const),
      relativeScope: axis?.relative.scope ?? ('COHORT' as const),
      relativePopulationSize: axis?.relative.populationSize ?? 0,
      relativeDetail:
        axis?.relative.detail ?? '상대 위치 근거를 확인할 수 없습니다.',
    }
  })
  const domains = score.domainExperience.map((domain, index) => ({
    label: domain.label,
    pct: domain.percentage,
    projectCount: domain.projectCount,
    tone: domainTones[index % domainTones.length],
  }))
  const kpis = score.metrics
    .filter((metric) => metricOrder.includes(metric.key))
    .sort((a, b) => metricOrder.indexOf(a.key) - metricOrder.indexOf(b.key))
    .map(metricToKpi)
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-fg text-[16px] font-bold">
            핵심 지표 · 종합 요약
          </span>
          <span className="text-fg-subtle text-[11px]">
            학습·프로젝트·평가 데이터를 바탕으로 한 6축 절대·상대 산정
          </span>
        </div>
        <span className="text-fg-subtle text-[11px]">
          산정일 {score.calculatedAt}
        </span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <section
          className={cn(
            card,
            'flex flex-col items-center justify-center gap-4 lg:w-[46%]',
          )}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-fg-subtle text-[10px] font-bold">
              AGGREGATE SCORE
            </span>
            <span className="text-fg text-[15px] font-bold">
              절대 종합 점수
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
        </section>

        <div
          data-summary-kpi-grid
          className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2"
        >
          {kpis.map((kpi) => {
            if (kpi.key === 'evaluatorAverage') {
              return (
                <EvaluatorAverageKpi
                  key={kpi.key}
                  kpi={kpi}
                  axes={score.axes}
                />
              )
            }
            const route = metricRoute(
              kpi.key as CertificateScoreMetric['key'],
              score.projectNavigation,
            )
            return (
              <Link
                key={kpi.key}
                to={route}
                aria-label={`${kpi.label} 상세 화면으로 이동`}
                data-summary-kpi={kpi.key}
                data-summary-kpi-route={route}
                className={cn(
                  card,
                  'focus-visible:ring-ring group flex min-w-0 flex-col gap-2.5 p-4 transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-fg-muted truncate text-[11px] font-medium">
                    {kpi.label}
                  </span>
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      TONE_SOLID[kpi.tone ?? 'brand'],
                    )}
                  />
                </div>
                <span className="text-fg text-[24px] leading-none font-bold">
                  {kpi.value}
                  {kpi.unit && (
                    <span className="text-fg-muted ml-0.5 text-[14px] font-medium">
                      {kpi.unit}
                    </span>
                  )}
                </span>
                <div className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      TONE_SOLID[kpi.tone ?? 'brand'],
                    )}
                    style={{ width: `${kpi.bar ?? 0}%` }}
                  />
                </div>
                {kpi.sub && (
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-fg-subtle truncate text-[9px]"
                      title={kpi.sub}
                    >
                      {kpi.sub}
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="text-fg-subtle size-3 shrink-0 transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      <div
        data-summary-competency-layout
        className="grid gap-4 xl:grid-cols-[46%_minmax(0,54%)] xl:items-start"
      >
        <section className="border-border bg-surface flex flex-col items-center overflow-hidden rounded-lg border shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]">
          <div className="flex w-full flex-col gap-0.5 px-5 pt-5 pb-2">
            <span className="text-fg text-[15px] font-bold">
              역량 비교 레이더
            </span>
            <span className="text-fg-muted text-[11px]">
              6축 절대·상대 위치 · 축을 선택해 상세 위치 확인
            </span>
          </div>
          <SkillRadar
            axes={radarAxes}
            selectedAxisKey={selectedAxisKey}
            onSelectAxis={(key) => setSelectedAxisKey(key as AxisKey)}
          />
        </section>

        <div data-summary-visual-stack className="grid min-w-0 gap-4">
          {CERT_V2 && <DomainDonut domains={domains} compact />}
          {CERT_V2 && ontology && <OntologyMap ontology={ontology} compact />}
        </div>
      </div>
    </div>
  )
}

export function SummaryTab({
  studentId = CERTIFICATE_MOCK_STUDENT_ID,
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
        <ScoreSummary score={scoreQuery.data} ontology={ai?.ontology} />
      )}
    </DataBoundary>
  )
}
