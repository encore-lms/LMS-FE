import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { cn } from '@/shared/lib/cn'
import { TONE_SOLID } from '@/shared/lib/tone'
import {
  CERTIFICATE_MOCK_STUDENT_ID,
  CERTIFICATE_360_AXIS_KEYS,
  CERTIFICATE_AXIS_KEYS,
  fetchCertificateScore,
  type CertificatePeerEvaluationAxis,
  type CertificateScoreMetric,
  type CertificateScoreResult,
} from '../ai'
import { SkillRadar, SkillRadarLoading } from '../components/SkillRadar'
import { CERT_V2 } from '../config'
import { certKeys } from '../queryKeys'
import type { CertKpi, CertSummaryTab, Tone } from '../types'
import { DomainDonut } from '../v2/DomainDonut'

const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

const metricTone: Record<CertificateScoreMetric['key'], Tone> = {
  attendance: 'success',
  assessment: 'info',
  blog: 'accent',
  certifiedProject: 'brand',
  certifiedTroubleshooting: 'warning',
}

const metricOrder: CertificateScoreMetric['key'][] = [
  'assessment',
  'attendance',
  'blog',
  'certifiedProject',
  'certifiedTroubleshooting',
]

const peerAxisTone: Record<CertificatePeerEvaluationAxis['key'], Tone> = {
  협업: 'brand',
  소통: 'info',
  책임감: 'success',
  문제해결: 'accent',
  기술기여: 'warning',
}

const domainTones: Tone[] = [
  'info',
  'success',
  'warning',
  'accent',
  'brand',
  'danger',
]

const scoreStatusLabel: Record<CertificateScoreResult['status'], string> = {
  READY: '산출 완료',
  NOT_READY: '산출 대기',
  ERROR: '산출 오류',
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

function formatFivePoint(value: number | null) {
  return value === null ? '-' : `${(value / 20).toFixed(1)}/5.0`
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

function PeerEvaluationKpi({
  axes,
}: {
  axes: CertificatePeerEvaluationAxis[]
}) {
  const readyCount = axes.filter(
    (axis) => axis.status === 'READY' && axis.score !== null,
  ).length

  return (
    <div
      data-summary-kpi="peerEvaluation"
      className={cn(card, 'flex min-w-0 flex-col gap-2 p-4')}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-fg-muted truncate text-[11px] font-medium">
          동료 5축 평가
        </span>
        <span className="bg-brand size-2 shrink-0 rounded-full" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-1">
        {axes.map((axis) => {
          const bar =
            axis.score === null ? 0 : Math.min(100, (axis.score / 5) * 100)
          return (
            <div
              key={axis.key}
              className="grid grid-cols-[42px_minmax(0,1fr)_26px] items-center gap-1.5"
            >
              <span className="text-fg-subtle truncate text-[9px] font-medium">
                {axis.key}
              </span>
              <div className="bg-surface-muted h-1.5 min-w-0 overflow-hidden rounded-full">
                <div
                  data-peer-axis-bar={axis.key}
                  className={cn(
                    'h-full rounded-full',
                    TONE_SOLID[peerAxisTone[axis.key]],
                  )}
                  style={{ width: `${bar}%` }}
                />
              </div>
              <span className="text-fg text-right text-[9px] font-bold">
                {axis.score?.toFixed(1) ?? '-'}
              </span>
            </div>
          )
        })}
      </div>

      <span className="text-fg-subtle truncate text-[9px]">
        유효 {readyCount}/5축 · 5점 기준
      </span>
    </div>
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

function ThreeSixtyComparisonPanel({
  axes,
}: {
  axes: CertificateScoreResult['axes']
}) {
  return (
    <section
      data-three-sixty-comparison
      className={cn(card, 'flex flex-1 flex-col gap-4')}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-fg text-[18px] font-bold">
          동료 5축 평가 비교
        </span>
        <span className="text-fg-muted text-[12px]">
          종합 절대점수 · 프로젝트 동료 상호평가
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_72px_88px] items-center gap-x-4">
        <span className="text-fg-subtle pb-2 text-[10px] font-semibold">
          축
        </span>
        <span className="text-fg-subtle pb-2 text-right text-[10px] font-semibold">
          절대
        </span>
        <span className="text-fg-subtle pb-2 text-right text-[10px] font-semibold">
          동료
        </span>

        {axes.map((axis) => (
          <div
            key={axis.key}
            data-three-sixty-axis={axis.key}
            className="border-divider col-span-3 grid grid-cols-[minmax(0,1fr)_72px_88px] items-center gap-x-4 border-t py-3"
          >
            <span className="text-fg text-[12px] font-bold">{axis.key}</span>
            <span className="text-brand text-right text-[13px] font-bold">
              {formatValue(axis.score)}
            </span>
            <span className="text-fg-muted text-right text-[12px] font-semibold">
              {formatFivePoint(axis.comparison.peerScore)}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function ScoreWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null

  return (
    <section className="border-warning/20 bg-warning-bg/45 flex items-start gap-2 rounded-xl border px-4 py-3">
      <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" />
      <div className="flex flex-col gap-1">
        <span className="text-fg-muted text-[11px] font-bold">데이터 안내</span>
        {warnings.map((warning) => (
          <span key={warning} className="text-fg-subtle text-[10px] leading-4">
            {warning}
          </span>
        ))}
      </div>
    </section>
  )
}

function ScoreSummary({ score }: { score: CertificateScoreResult }) {
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
  const comparisonAxes = CERTIFICATE_360_AXIS_KEYS.map((key) =>
    axisByKey.get(key),
  ).filter(
    (axis): axis is CertificateScoreResult['axes'][number] =>
      axis !== undefined,
  )
  const threeSixtyRadarAxes = comparisonAxes.map((axis) => ({
    key: axis.key,
    score: axis.score,
    peerScore: axis.comparison.peerScore,
  }))
  const domains = score.domainExperience.map((domain, index) => ({
    label: domain.label,
    pct: domain.percentage,
    projectCount: domain.projectCount,
    tone: domainTones[index % domainTones.length],
  }))
  const kpis = [...score.metrics]
    .sort((a, b) => metricOrder.indexOf(a.key) - metricOrder.indexOf(b.key))
    .map(metricToKpi)
  const highlights = score.axes
    .filter(
      (axis): axis is typeof axis & { score: number } => axis.score !== null,
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((axis) => `${axis.key} ${axis.score}`)
    .join(' · ')
  const overall = score.overallScore ?? 0
  const overallTopPercent =
    score.overallRelative.status === 'READY'
      ? formatPercent(score.overallRelative.topPercent)
      : null
  const overallPopulationLabel =
    score.overallRelative.scope === 'ALL_STUDENTS' ? '전체' : '기수'
  const miniStats = [
    { value: `${score.axes.length}개`, label: '종합 산정 축' },
    { value: `${score.warnings.length}건`, label: '데이터 안내' },
    { value: scoreStatusLabel[score.status], label: '산출 상태' },
    { value: '균등 평균', label: '종합 방식' },
  ]
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
        <section className={cn(card, 'flex flex-col gap-5 lg:w-[46%]')}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-fg-subtle text-[10px] font-bold">
                AGGREGATE SCORE
              </span>
              <span className="text-fg text-[15px] font-bold">
                절대 종합 점수
              </span>
            </div>
          </div>

          <div className="flex items-end gap-3">
            <span className="text-fg text-[56px] leading-none font-bold">
              {score.overallScore?.toFixed(1) ?? '-'}
            </span>
            <div className="flex flex-col gap-1.5 pb-1">
              <span className="text-fg-muted text-[14px] font-medium">
                / 100
              </span>
              <span className="bg-brand/10 text-brand w-fit rounded-md px-2 py-0.5 text-[12px] font-bold">
                Grade {score.grade ?? '-'}
              </span>
              <span className="bg-info-bg text-info w-fit rounded-md px-2 py-0.5 text-[12px] font-bold">
                {overallTopPercent === null
                  ? `${overallPopulationLabel} 상대 위치 산출 전`
                  : `${overallPopulationLabel} 상위 ${overallTopPercent}%`}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-fg-muted font-semibold">
                6축 균등 평균 · {scoreStatusLabel[score.status]}
              </span>
              <span className="text-fg-subtle text-right">{highlights}</span>
            </div>
            <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-brand h-full rounded-full"
                style={{ width: `${overall}%` }}
              />
            </div>
          </div>

          <div className="border-divider grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4">
            {miniStats.map((item) => (
              <div key={item.label} className="flex flex-col gap-0.5">
                <span className="text-fg text-[15px] font-bold">
                  {item.value}
                </span>
                <span className="text-fg-subtle text-[10px]">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <div
          data-summary-kpi-grid
          className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2"
        >
          {kpis.map((kpi) => (
            <div
              key={kpi.key}
              data-summary-kpi={kpi.key}
              className={cn(card, 'flex min-w-0 flex-col gap-2.5 p-4')}
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
                <span
                  className="text-fg-subtle truncate text-[9px]"
                  title={kpi.sub}
                >
                  {kpi.sub}
                </span>
              )}
            </div>
          ))}
          <PeerEvaluationKpi axes={score.peerEvaluation} />
        </div>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <section className="border-border bg-surface flex flex-1 flex-col items-center overflow-hidden rounded-lg border shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]">
          <div className="flex w-full flex-col gap-0.5 px-6 pt-6 pb-3">
            <span className="text-fg text-[15px] font-bold">
              역량 비교 레이더
            </span>
            <span className="text-fg-muted text-[11px]">
              6축 절대·상대 위치 · 축 이름을 선택하면 평가 기준 확인
            </span>
          </div>
          <SkillRadar axes={radarAxes} threeSixtyAxes={threeSixtyRadarAxes} />
        </section>

        <ThreeSixtyComparisonPanel axes={comparisonAxes} />
      </div>

      <ScoreWarnings warnings={score.warnings} />

      {CERT_V2 && <DomainDonut domains={domains} />}
    </div>
  )
}

export function SummaryTab({
  studentId = CERTIFICATE_MOCK_STUDENT_ID,
}: {
  s: CertSummaryTab
  studentId?: string
}) {
  const scoreQuery = useQuery({
    queryKey: certKeys.score(studentId),
    queryFn: () => fetchCertificateScore(studentId),
  })

  return (
    <DataBoundary
      isPending={scoreQuery.isPending}
      isError={scoreQuery.isError || !scoreQuery.data}
      onRetry={scoreQuery.refetch}
      skeleton={<CertificateScoreLoading />}
      errorTitle="수강역량 점수를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요."
    >
      {scoreQuery.data && <ScoreSummary score={scoreQuery.data} />}
    </DataBoundary>
  )
}
