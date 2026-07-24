import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Sparkles } from 'lucide-react'
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
  type CertificateExternalCertification,
  type CertificatePeerEvaluationAxis,
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
import { useCertificateDetailTabs } from '../useCertificateDetailTabs'
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
}

const metricOrder: CertificateScoreMetric['key'][] = [
  'assessment',
  'attendance',
  'blog',
  'certifiedProject',
  'certifiedTroubleshooting',
]

function metricRoute(
  key: CertificateScoreMetric['key'],
  projectNavigation: CertificateScoreResult['projectNavigation'],
) {
  if (key === 'assessment') return '/student/quizzes'
  if (key === 'attendance') return '/student/attendance'
  if (key === 'blog') return '/student/records'
  if (key === 'certifiedProject') return '/student/projects'
  return projectNavigation.issuesProjectId
    ? `/student/projects/${encodeURIComponent(projectNavigation.issuesProjectId)}?tab=issues`
    : '/student/projects'
}

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
  projectId,
}: {
  axes: CertificatePeerEvaluationAxis[]
  projectId: string | null
}) {
  const readyCount = axes.filter(
    (axis) => axis.status === 'READY' && axis.score !== null,
  ).length

  return (
    <Link
      to={
        projectId
          ? `/student/projects/${encodeURIComponent(projectId)}?tab=peer-evaluation`
          : '/student/projects'
      }
      aria-label="동료 5축 평가 상세 보기"
      data-summary-kpi="peerEvaluation"
      data-summary-kpi-route={
        projectId
          ? `/student/projects/${encodeURIComponent(projectId)}?tab=peer-evaluation`
          : '/student/projects'
      }
      className={cn(
        card,
        'focus-visible:ring-ring group flex min-w-0 flex-col gap-2 p-4 transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-fg-muted truncate text-[11px] font-medium">
          동료 5축 평가
        </span>
        <ArrowRight
          aria-hidden="true"
          className="text-fg-subtle size-3 shrink-0 transition-transform group-hover:translate-x-0.5"
        />
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

function RecommendationMark({ role }: { role: '강사' | '멘토' }) {
  const isInstructor = role === '강사'

  return (
    <a
      href="/student/certificate?tab=growth-reputation"
      aria-label={`${role} 추천서 보기`}
      className={cn(
        'group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors',
        isInstructor
          ? 'border-warning/30 bg-warning-bg/45 text-warning hover:bg-warning-bg/70'
          : 'border-border bg-surface-muted/65 text-fg-muted hover:bg-surface-muted',
      )}
    >
      <span
        className={cn(
          'flex size-5 items-center justify-center rounded-md',
          isInstructor ? 'bg-warning/10' : 'bg-surface',
        )}
      >
        <Sparkles aria-hidden="true" className="size-3" strokeWidth={1.8} />
      </span>
      <span className="text-[11px] font-bold tracking-[-0.01em]">
        {role} 추천
      </span>
    </a>
  )
}

type AxisKey = CertificateScoreResult['axes'][number]['key']

const axisEvidencePolicy: Record<
  AxisKey,
  { description: string; data: string; calculation: string }
> = {
  기술: {
    description:
      '과정에서 확인한 기술 지식과 외부 코딩 역량을 함께 보여주는 점수입니다.',
    data: '채점이 끝난 성취도 평가·CS 과목 평가, 승인된 외부 코딩테스트',
    calculation:
      '성취도·CS 평가 평균 80%와 외부 코딩테스트 환산점수 최대 20점을 합산합니다.',
  },
  학습지속성: {
    description:
      '수업 참여와 학습 기록을 얼마나 꾸준히 이어 갔는지 보여주는 점수입니다.',
    data: '출결 기록, 블로그 제출, 과제 제출, 스터디 활동, 멘토링 참석',
    calculation:
      '출석률 70%와 블로그 제출률 30%를 기본으로 하고, 과제·스터디·멘토링 참여는 가산점으로 반영합니다.',
  },
  소통: {
    description:
      '프로젝트에서 의견을 전달하고 피드백을 주고받은 정도를 보여주는 점수입니다.',
    data: '완료 프로젝트의 동료 소통 평가, 최종 멘토 소통 평가',
    calculation:
      '프로젝트 동료평가 80%와 최종 멘토평가 20%를 합산해 100점으로 환산합니다.',
  },
  문제해결: {
    description:
      '문제를 기록하고 검증 가능한 해결 사례로 완성한 정도를 보여주는 점수입니다.',
    data: '인증된 트러블슈팅 사례, 완료 프로젝트의 동료 문제해결 평가',
    calculation:
      '인증 사례 6건을 100점 기준으로 환산합니다. 50점 미만일 때만 동료평가를 최대 50점 범위의 보조 근거로 비교합니다.',
  },
  책임감: {
    description:
      '맡은 역할과 약속을 프로젝트 안에서 꾸준히 지킨 정도를 보여주는 점수입니다.',
    data: '완료 프로젝트의 동료 책임감 평가, 최종 멘토 책임감 평가',
    calculation:
      '프로젝트 동료평가 80%와 최종 멘토평가 20%를 합산해 100점으로 환산합니다.',
  },
  팀워크: {
    description:
      '공동 목표를 위해 역할을 나누고 팀에 기여한 정도를 보여주는 점수입니다.',
    data: '완료 프로젝트의 동료 협업 평가, 최종 멘토 팀워크 평가',
    calculation:
      '프로젝트 동료평가 80%와 최종 멘토평가 20%를 합산해 100점으로 환산합니다.',
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

function TechnicalEvidence({
  axis,
  assessments,
  certifications,
  pending,
}: {
  axis: CertificateScoreResult['axes'][number]
  assessments: CertificateAssessmentPoint[]
  certifications: CertificateExternalCertification[]
  pending: boolean
}) {
  const internal = evidenceByKey(axis, 'internalAssessment')
  const coding = evidenceByKey(axis, 'codingTest')
  const approvedCertifications = certifications.filter(
    (item) => item.status === 'APPROVED',
  )

  return (
    <div className="grid gap-4">
      <section className="border-divider grid gap-3 border-t pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-fg text-[15px] font-bold">
            성취도·CS 평가별 점수
          </h3>
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
            {assessments.map((assessment) => {
              const kind = /(?:\bCS\b|네트워크|운영체제|자료구조)/u.test(
                assessment.title,
              )
                ? 'CS 평가'
                : '성취도 평가'
              return (
                <article
                  key={assessment.id}
                  data-assessment-evidence={assessment.category}
                  className="border-border bg-surface flex min-w-0 flex-col gap-1 rounded-lg border p-3"
                >
                  <span className="text-brand text-[10px] font-bold">
                    {kind}
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
              )
            })}
          </div>
        )}
      </section>

      <section className="border-divider grid gap-3 border-t pt-4">
        <h3 className="text-fg text-[15px] font-bold">코딩테스트 인증</h3>
        {approvedCertifications.length === 0 ? (
          <p className="text-fg-muted text-[13px]">
            승인된 코딩테스트 인증이 없습니다.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {approvedCertifications.map((certification, index) => (
              <article
                key={`${certification.name}-${index}`}
                className="border-border bg-surface flex flex-col gap-1 rounded-lg border p-3"
              >
                <span className="text-fg text-[13px] font-bold">
                  {certification.name}
                </span>
                <strong className="text-brand text-[20px]">
                  {certification.score === null
                    ? '원점수 없음'
                    : `${certification.score.toLocaleString('ko-KR')}/1,000점`}
                </strong>
                <span className="text-fg-muted text-[12px] font-semibold">
                  {certification.grade ?? '등급 없음'} · 승인
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      {internal && coding && (
        <CalculationBox
          lines={[
            `성취도·CS 평가 전체 평균 ${displayNumber(internal.value)}점의 80% = ${displayNumber(internal.appliedScore)}점`,
            `${coding.detail}을 코딩테스트 20% 영역에 반영 = ${displayNumber(coding.appliedScore)}점`,
          ]}
          result={`${displayNumber(internal.appliedScore)} + ${displayNumber(coding.appliedScore)} = 기술 ${displayNumber(axis.score)}점`}
        />
      )}
    </div>
  )
}

function SocialEvidence({
  axis,
}: {
  axis: CertificateScoreResult['axes'][number]
}) {
  const projects = evidenceByKey(axis, 'completedProjects')
  const peer = evidenceByKey(axis, 'peerEvaluation')
  const mentor = evidenceByKey(axis, 'mentorEvaluation')
  if (!projects || !peer || !mentor) return null
  const weighted = (peer.value ?? 0) * 0.8 + (mentor.value ?? 0) * 0.2

  return (
    <div className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <EvidenceCard item={projects} />
        <EvidenceCard
          item={peer}
          valueLabel={`${displayNumber(peer.value, 2)}/5점`}
        />
        <EvidenceCard
          item={mentor}
          valueLabel={`${displayNumber(mentor.value, 2)}/5점`}
        />
      </div>
      <CalculationBox
        lines={[
          `동료 상호평가 ${displayNumber(peer.value, 2)}점의 80% + 멘토평가 ${displayNumber(mentor.value, 2)}점의 20% = ${displayNumber(weighted, 2)}/5점`,
          '1점은 0점, 5점은 100점이 되도록 100점 기준으로 환산합니다.',
        ]}
        result={`${axis.key} 최종 ${displayNumber(axis.score)}점`}
      />
    </div>
  )
}

function ProblemEvidence({
  axis,
}: {
  axis: CertificateScoreResult['axes'][number]
}) {
  const troubleshooting = evidenceByKey(axis, 'certifiedTroubleshooting')
  const peer = evidenceByKey(axis, 'peerProblemSolving')
  if (!troubleshooting || !peer) return null
  const troubleshootingScore = troubleshooting.appliedScore ?? 0
  const usePeerSupport = troubleshootingScore < 50

  return (
    <div className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <EvidenceCard
          item={troubleshooting}
          valueLabel={`${troubleshooting.numerator ?? 0}/${troubleshooting.denominator ?? 6}건`}
        />
        <EvidenceCard
          item={peer}
          valueLabel={`${displayNumber(peer.value, 2)}/5점`}
        />
      </div>
      <CalculationBox
        lines={[
          `인증 사례 ${troubleshooting.numerator ?? 0}건 ÷ 기준 ${troubleshooting.denominator ?? 6}건 × 100 = ${displayNumber(troubleshootingScore)}점`,
          `프로젝트 상호평가 문제해결 ${displayNumber(peer.value, 2)}/5점은 최대 50점으로 환산하면 ${displayNumber(peer.appliedScore)}/50점입니다.`,
          usePeerSupport
            ? '트러블슈팅 점수가 50점 미만이므로 두 점수 중 높은 보조점수를 적용했습니다.'
            : '트러블슈팅 점수가 50점 이상이므로 상호평가 보조점수는 적용하지 않았습니다.',
        ]}
        result={`문제해결 최종 ${displayNumber(axis.score)}점`}
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

function ScoreEvidencePanel({
  axes,
  assessments,
  certifications,
  assessmentsPending,
  selectedAxisKey,
  onSelectAxis,
}: {
  axes: CertificateScoreResult['axes']
  assessments: CertificateAssessmentPoint[]
  certifications: CertificateExternalCertification[]
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
      className={cn(
        card,
        'flex min-w-0 flex-1 flex-col gap-4 p-5 xl:w-[54%] xl:flex-none',
      )}
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

        {selectedAxis.key === '기술' && (
          <TechnicalEvidence
            axis={selectedAxis}
            assessments={assessments}
            certifications={certifications}
            pending={assessmentsPending}
          />
        )}
        {['소통', '팀워크', '책임감'].includes(selectedAxis.key) && (
          <SocialEvidence axis={selectedAxis} />
        )}
        {selectedAxis.key === '문제해결' && (
          <ProblemEvidence axis={selectedAxis} />
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
  recommendations,
  assessments,
  certifications,
  assessmentsPending,
}: {
  score: CertificateScoreResult
  ontology?: Awaited<ReturnType<typeof fetchAiAnalysis>>['ontology']
  recommendations: CertRecommendation[]
  assessments: CertificateAssessmentPoint[]
  certifications: CertificateExternalCertification[]
  assessmentsPending: boolean
}) {
  const [selectedAxisKey, setSelectedAxisKey] = useState<AxisKey>('기술')
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
    { value: scoreStatusLabel[score.status], label: '산출 상태' },
    { value: '균등 평균', label: '종합 방식' },
  ]
  const recommendationRoles = new Set(
    recommendations.map((recommendation) => recommendation.role),
  )
  const hasInstructorRecommendation = recommendationRoles.has('강사')
  const hasMentorRecommendation = recommendationRoles.has('멘토')
  const hasRecommendation =
    hasInstructorRecommendation || hasMentorRecommendation

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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-fg-subtle text-[10px] font-bold">
                AGGREGATE SCORE
              </span>
              <span className="text-fg text-[15px] font-bold">
                절대 종합 점수
              </span>
            </div>

            {hasRecommendation && (
              <div
                aria-label="추천 현황"
                className="flex flex-wrap items-center justify-end gap-1.5"
              >
                {hasInstructorRecommendation && (
                  <RecommendationMark role="강사" />
                )}
                {hasMentorRecommendation && <RecommendationMark role="멘토" />}
              </div>
            )}
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

          <div className="border-divider grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-3">
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
          {kpis.map((kpi) => {
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
          <PeerEvaluationKpi
            axes={score.peerEvaluation}
            projectId={score.projectNavigation.peerEvaluationProjectId}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <section className="border-border bg-surface flex flex-col items-center overflow-hidden rounded-lg border shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)] xl:w-[46%] xl:flex-none">
          <div className="flex w-full flex-col gap-0.5 px-5 pt-5 pb-2">
            <span className="text-fg text-[15px] font-bold">
              역량 비교 레이더
            </span>
            <span className="text-fg-muted text-[11px]">
              6축 절대·상대 위치 · 축을 선택하면 오른쪽에서 점수 근거 확인
            </span>
          </div>
          <SkillRadar
            axes={radarAxes}
            selectedAxisKey={selectedAxisKey}
            onSelectAxis={(key) => setSelectedAxisKey(key as AxisKey)}
          />
        </section>

        <ScoreEvidencePanel
          axes={score.axes}
          assessments={assessments}
          certifications={certifications}
          assessmentsPending={assessmentsPending}
          selectedAxisKey={selectedAxisKey}
          onSelectAxis={setSelectedAxisKey}
        />
      </div>

      {CERT_V2 && <DomainDonut domains={domains} />}
      {CERT_V2 && ontology && <OntologyMap ontology={ontology} />}
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
  const detailTabsQuery = useCertificateDetailTabs(studentId)

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
          assessments={detailTabsQuery.data?.tech.assessments ?? []}
          certifications={detailTabsQuery.data?.tech.certifications ?? []}
          assessmentsPending={detailTabsQuery.isPending}
        />
      )}
    </DataBoundary>
  )
}
