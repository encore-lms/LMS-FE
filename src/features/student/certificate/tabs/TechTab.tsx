import { useRef, useState } from 'react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { cn } from '@/shared/lib/cn'
import { TONE_SOFT, TONE_SOLID } from '@/shared/lib/tone'
import type { CertificateTechDetail } from '../ai'
import type { Tone } from '../types'
import { useCertificateDetailTabs } from '../useCertificateDetailTabs'

const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

const certificationStatus: Record<string, { label: string; tone: Tone }> = {
  APPROVED: { label: '승인', tone: 'success' },
  PENDING: { label: '검토 중', tone: 'warning' },
  SCHEDULED: { label: '응시 예정', tone: 'info' },
  REJECTED: { label: '반려', tone: 'danger' },
}

const categoryTones: Tone[] = [
  'brand',
  'info',
  'accent',
  'warning',
  'brand',
  'danger',
]
const INITIAL_VISIBLE_CATEGORY_COUNT = 5

const officialCertificationScoreBands: Record<
  'PCCE' | 'PCCP' | 'PCSQL',
  Record<string, string>
> = {
  PCCE: {
    'LV.1': '400–599점',
    'LV.2': '600–749점',
    'LV.3': '750–899점',
    'LV.4': '900–1,000점',
  },
  PCCP: {
    'LV.1': '400–499점',
    'LV.2': '500–599점',
    'LV.3': '600–749점',
    'LV.4': '750–899점',
    'LV.5': '900–1,000점',
  },
  PCSQL: {
    'LV.1': '200–449점',
    'LV.2': '450–699점',
    'LV.3': '700–899점',
    'LV.4': '900–1,000점',
  },
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return '-'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function officialCertificationName(name: string) {
  const normalizedName = name.trim().toUpperCase()
  return (['PCCE', 'PCCP', 'PCSQL'] as const).find((certificationName) =>
    normalizedName.startsWith(certificationName),
  )
}

function officialCertificationScoreLabel(
  certification: CertificateTechDetail['certifications'][number],
) {
  const certificationName = officialCertificationName(certification.name)
  if (!certificationName || certification.score === null) return null

  return `${new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: 1,
  }).format(certification.score)}/1,000점`
}

function officialCertificationGradeLabel(
  certification: CertificateTechDetail['certifications'][number],
) {
  if (!certification.grade) return null
  const certificationName = officialCertificationName(certification.name)
  if (!certificationName) return certification.grade

  const grade = certification.grade.trim().toUpperCase()
  const scoreBand = officialCertificationScoreBands[certificationName][grade]
  return scoreBand ? `${grade} (${scoreBand})` : certification.grade
}

function formatCertificationDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : value
}

function certificationDateLabel(
  certification: CertificateTechDetail['certifications'][number],
) {
  if (certification.status === 'APPROVED') {
    return certification.issuedAt
      ? `발급 ${formatCertificationDate(certification.issuedAt)}`
      : '발급일 정보 없음'
  }
  if (certification.status === 'PENDING') {
    return certification.submittedAt
      ? `제출 ${formatCertificationDate(certification.submittedAt)}`
      : '제출일 정보 없음'
  }
  if (certification.status === 'SCHEDULED') {
    return certification.scheduledAt
      ? `${formatCertificationDate(certification.scheduledAt)} 응시 예정`
      : '응시 예정일 정보 없음'
  }
  return certification.submittedAt
    ? `제출 ${formatCertificationDate(certification.submittedAt)}`
    : '일자 정보 없음'
}

function certificationDetailLabel(
  certification: CertificateTechDetail['certifications'][number],
) {
  const details: string[] = []
  if (certification.status === 'APPROVED') {
    const gradeLabel = officialCertificationGradeLabel(certification)
    const scoreLabel = officialCertificationScoreLabel(certification)
    if (gradeLabel) details.push(gradeLabel)
    if (scoreLabel) details.push(scoreLabel)
    else if (certification.score !== null)
      details.push(`${formatNumber(certification.score)}점`)
  }
  details.push(certificationDateLabel(certification))
  details.push(certification.registrationSource || '외부 인증 입력')
  return details.join(' · ')
}

function certificationCountLabel(
  certifications: CertificateTechDetail['certifications'],
) {
  const labels = [
    ['APPROVED', '승인'],
    ['PENDING', '검토 중'],
    ['SCHEDULED', '응시 예정'],
  ] as const
  return labels
    .map(([status, label]) => ({
      label,
      count: certifications.filter((item) => item.status === status).length,
    }))
    .filter((item) => item.count > 0)
    .map((item) => `${item.label} ${item.count}건`)
    .join(' · ')
}

function EmptyData({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-muted text-fg-subtle rounded-xl px-4 py-8 text-center text-[12px]">
      {children}
    </div>
  )
}

const trendTicks = [100, 75, 50, 25, 0]

function clampScore(score: number) {
  return Math.min(Math.max(score, 0), 100)
}

function assessmentSubject(title: string) {
  return (
    title
      .replace(/^SKN\s+\d+기\s*/u, '')
      .replace(/\s*(?:성취도|CS)\s*평가$/u, '')
      .trim() || title
  )
}

function buildAssessmentTrendPath(
  assessments: CertificateTechDetail['assessments'],
) {
  const points = assessments.map((assessment, index) => ({
    x: ((index + 0.5) / assessments.length) * 1000,
    y: 100 - clampScore(assessment.score),
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

export function AssessmentTrendChart({
  assessments,
  averageTopPercent,
  averagePopulationSize,
  title = '시험 추세',
  emptyMessage = '표시할 시험 이력이 없습니다.',
  showAverageRank = true,
  tone = 'achievement',
}: {
  assessments: CertificateTechDetail['assessments']
  averageTopPercent: number | null
  averagePopulationSize: number
  title?: string
  emptyMessage?: string
  showAverageRank?: boolean
  tone?: 'achievement' | 'cs'
}) {
  const assessmentChartRef = useRef<HTMLDivElement>(null)
  const [focusedAssessmentIndex, setFocusedAssessmentIndex] = useState<
    number | null
  >(null)
  const [focusedAverageIndex, setFocusedAverageIndex] = useState<number | null>(
    null,
  )
  const [subjectHover, setSubjectHover] = useState<{
    index: number
    x: number
    y: number
    placeBelow: boolean
  } | null>(null)
  const absoluteAverage =
    assessments.length === 0
      ? null
      : assessments.reduce((sum, assessment) => sum + assessment.score, 0) /
        assessments.length
  const trendPath = buildAssessmentTrendPath(assessments)
  const toneStyle =
    tone === 'cs'
      ? {
          label: 'CS 평가',
          line: 'stroke-info',
          pointHalo: 'bg-info/15 group-hover:bg-info/25',
          point: 'border-info',
          aboveBar: 'bg-gradient-to-t from-info to-info/65',
          belowBar: 'border border-info/30 bg-info-bg',
          text: 'text-info',
          legend: 'border-info',
        }
      : {
          label: '성취도 평가',
          line: 'stroke-accent-strong',
          pointHalo: 'bg-accent-strong/15 group-hover:bg-accent-strong/25',
          point: 'border-accent-strong',
          aboveBar: 'bg-gradient-to-t from-accent-strong to-brand',
          belowBar: 'border border-accent-strong/30 bg-accent-bg',
          text: 'text-accent-strong',
          legend: 'border-accent-strong',
        }
  const hoveredAssessmentSubject =
    subjectHover === null ? null : assessments[subjectHover.index]

  const updateSubjectHover = (
    event: React.MouseEvent<HTMLDivElement>,
    index: number,
  ) => {
    const chartBounds = assessmentChartRef.current?.getBoundingClientRect()
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

  return (
    <section
      data-assessment-trend-tone={tone}
      className={cn(card, 'flex flex-col gap-5')}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-fg text-[15px] font-bold">{title}</h3>
        <span
          className="text-fg-subtle text-[11px]"
          title={
            showAverageRank && averagePopulationSize > 0
              ? `기수 평균 순위 비교 표본 ${averagePopulationSize}명`
              : undefined
          }
        >
          {assessments.length}회 평가 기록 · 평균{' '}
          {formatNumber(absoluteAverage)}점
          {showAverageRank && (
            <>
              {' · '}
              {averageTopPercent === null
                ? '상위 비율 산출 전'
                : `상위 ${formatNumber(averageTopPercent)}%`}
            </>
          )}
        </span>
      </div>

      {assessments.length === 0 ? (
        <EmptyData>{emptyMessage}</EmptyData>
      ) : (
        <>
          <div className="w-full min-w-0 pb-1">
            <div className="w-full min-w-0">
              <div className="relative ml-8 h-[220px] overflow-visible pt-5 pr-1">
                {trendTicks.map((tick) => (
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
                    className={cn(toneStyle.line, 'opacity-20')}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    data-assessment-trend-line
                    d={trendPath}
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                    className={toneStyle.line}
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <div
                  ref={assessmentChartRef}
                  data-assessment-chart-area
                  className="absolute inset-x-0 bottom-0 z-auto grid h-[91%] items-end gap-1 px-2 sm:gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${assessments.length}, minmax(0, 1fr))`,
                  }}
                >
                  {assessments.map((assessment, index) => {
                    const allStudentAverage =
                      assessment.cohortAverageScore ?? null
                    const isAboveAverage =
                      allStudentAverage === null
                        ? null
                        : assessment.score >= allStudentAverage
                    const previousAssessment =
                      index > 0 ? assessments[index - 1] : null
                    const scoreDifference = previousAssessment
                      ? assessment.score - previousAssessment.score
                      : null
                    const trendDirection =
                      scoreDifference === null
                        ? 'unavailable'
                        : scoreDifference > 0
                          ? 'up'
                          : scoreDifference < 0
                            ? 'down'
                            : 'same'
                    return (
                      <div
                        key={assessment.id}
                        className="relative flex h-full min-w-0 items-end justify-center"
                      >
                        {allStudentAverage !== null && (
                          <button
                            type="button"
                            data-assessment-average-marker={assessment.id}
                            aria-label={`${assessment.title} 기수 평균 ${formatNumber(allStudentAverage)}점`}
                            className="group focus-visible:ring-ring absolute left-1/2 z-[45] flex h-5 w-14 max-w-full -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
                            style={{
                              bottom: `${clampScore(allStudentAverage)}%`,
                            }}
                            onMouseEnter={() => setFocusedAverageIndex(index)}
                            onMouseLeave={() => setFocusedAverageIndex(null)}
                            onFocus={() => setFocusedAverageIndex(index)}
                            onBlur={() => setFocusedAverageIndex(null)}
                          >
                            <span
                              data-assessment-average-stroke={assessment.id}
                              className="border-danger w-10 max-w-full border-t-2 border-dashed transition-[border-width] group-hover:border-t-[3px]"
                            />
                          </button>
                        )}
                        {allStudentAverage !== null &&
                          focusedAverageIndex === index && (
                            <aside
                              role="tooltip"
                              aria-live="polite"
                              data-assessment-average-tooltip={assessment.id}
                              className={cn(
                                'bg-surface-inverse border-surface/15 text-surface pointer-events-none absolute z-[70] w-[188px] rounded-lg border p-2.5 shadow-lg',
                                index === 0
                                  ? 'left-0'
                                  : index === assessments.length - 1
                                    ? 'right-0'
                                    : 'left-1/2 -translate-x-1/2',
                              )}
                              style={
                                allStudentAverage >= 70
                                  ? {
                                      top: `calc(${100 - clampScore(allStudentAverage)}% + 10px)`,
                                    }
                                  : {
                                      bottom: `calc(${clampScore(allStudentAverage)}% + 10px)`,
                                    }
                              }
                            >
                              <p className="text-[11px] leading-4 font-bold">
                                {assessment.title}
                              </p>
                              <p className="text-surface/60 mt-0.5 text-[9px] font-medium">
                                {assessment.category} · Q{index + 1} 기수 평균
                              </p>
                              <div className="border-surface/15 mt-2 flex items-end justify-between gap-3 border-t pt-2">
                                <span className="text-surface/65 text-[10px] font-semibold">
                                  평균 점수
                                </span>
                                <strong className="text-danger text-[17px] leading-none">
                                  {formatNumber(allStudentAverage)}점
                                </strong>
                              </div>
                              <p className="text-surface/50 mt-1.5 text-[9px] font-medium">
                                비교 표본 {assessment.comparisonCount}명
                              </p>
                            </aside>
                          )}
                        <button
                          type="button"
                          data-assessment-trend-point={assessment.id}
                          aria-label={`Q${index + 1} ${assessment.title} ${formatNumber(assessment.score)}점 추세 비교`}
                          className="group focus-visible:ring-ring absolute left-1/2 z-50 flex size-7 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
                          style={{
                            bottom: `${clampScore(assessment.score)}%`,
                          }}
                          onMouseEnter={() => setFocusedAssessmentIndex(index)}
                          onMouseLeave={() => setFocusedAssessmentIndex(null)}
                          onFocus={() => setFocusedAssessmentIndex(index)}
                          onBlur={() => setFocusedAssessmentIndex(null)}
                        >
                          <span
                            className={cn(
                              'flex size-5 items-center justify-center rounded-full transition-colors',
                              toneStyle.pointHalo,
                            )}
                          >
                            <span
                              className={cn(
                                'bg-surface pointer-events-none size-2.5 rounded-full border-2 shadow-sm transition-transform group-hover:scale-110',
                                toneStyle.point,
                              )}
                            />
                          </span>
                        </button>
                        {focusedAssessmentIndex === index && (
                          <aside
                            role="tooltip"
                            aria-live="polite"
                            data-assessment-trend-comparison={assessment.id}
                            data-comparison-direction={trendDirection}
                            className={cn(
                              'bg-surface-inverse border-surface/15 text-surface pointer-events-none absolute z-[60] w-[208px] rounded-lg border p-3 shadow-lg',
                              index === 0
                                ? 'left-0'
                                : index === assessments.length - 1
                                  ? 'right-0'
                                  : 'left-1/2 -translate-x-1/2',
                            )}
                            style={
                              assessment.score >= 70
                                ? {
                                    top: `calc(${100 - clampScore(assessment.score)}% + 10px)`,
                                  }
                                : {
                                    bottom: `calc(${clampScore(assessment.score)}% + 10px)`,
                                  }
                            }
                          >
                            <p className="text-[11px] leading-4 font-bold">
                              {assessment.title}
                            </p>
                            <p className="text-surface/60 mt-0.5 text-[9px] font-medium">
                              {assessment.category} · Q{index + 1} 시험 추세
                            </p>
                            <div className="border-surface/15 mt-2.5 grid grid-cols-2 gap-2 border-t pt-2.5">
                              <div className="border-info border-l-2 pl-2">
                                <p className="text-surface/65 text-[9px] font-semibold">
                                  직전 시험
                                </p>
                                <p className="mt-0.5 text-[16px] font-bold">
                                  {previousAssessment
                                    ? formatNumber(previousAssessment.score)
                                    : '-'}
                                  <span className="text-surface/55 ml-0.5 text-[10px] font-medium">
                                    /100
                                  </span>
                                </p>
                              </div>
                              <div
                                className={cn(
                                  'border-l-2 pl-2',
                                  toneStyle.point,
                                )}
                              >
                                <p className="text-surface/65 text-[9px] font-semibold">
                                  현재 시험
                                </p>
                                <p className="mt-0.5 text-[16px] font-bold">
                                  {formatNumber(assessment.score)}
                                  <span className="text-surface/55 ml-0.5 text-[10px] font-medium">
                                    /100
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div
                              className={cn(
                                'mt-2.5 flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-bold',
                                trendDirection === 'up' &&
                                  'bg-success/15 text-success',
                                trendDirection === 'down' &&
                                  'bg-danger/15 text-danger',
                                (trendDirection === 'same' ||
                                  trendDirection === 'unavailable') &&
                                  'bg-surface/10 text-surface/70',
                              )}
                            >
                              {trendDirection === 'up' && (
                                <span aria-hidden="true">▲</span>
                              )}
                              {trendDirection === 'down' && (
                                <span aria-hidden="true">▼</span>
                              )}
                              {trendDirection === 'same' && (
                                <span aria-hidden="true">―</span>
                              )}
                              <span>
                                {scoreDifference === null
                                  ? '첫 시험 · 비교 기준 없음'
                                  : `${formatNumber(Math.abs(scoreDifference))}점`}
                              </span>
                            </div>
                            <p className="text-surface/50 mt-1 text-center text-[8px] font-medium">
                              직전 시험 대비 실제 점수 변화
                            </p>
                          </aside>
                        )}
                        <div
                          data-assessment-bar={assessment.id}
                          data-average-position={
                            isAboveAverage === null
                              ? 'unavailable'
                              : isAboveAverage
                                ? 'above'
                                : 'below'
                          }
                          className={cn(
                            'relative w-full max-w-7 rounded-t-md',
                            isAboveAverage === null
                              ? 'bg-fg-muted'
                              : isAboveAverage
                                ? toneStyle.aboveBar
                                : toneStyle.belowBar,
                          )}
                          style={{
                            height: `${clampScore(assessment.score)}%`,
                          }}
                          onMouseMove={(event) =>
                            updateSubjectHover(event, index)
                          }
                          onMouseLeave={() => setSubjectHover(null)}
                        >
                          <span
                            className={cn(
                              'absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold tabular-nums',
                              toneStyle.text,
                            )}
                          >
                            {formatNumber(assessment.score)}
                          </span>
                        </div>
                        <span className="sr-only">
                          평가 {index + 1}, {formatNumber(assessment.score)}점
                        </span>
                      </div>
                    )
                  })}

                  {subjectHover && hoveredAssessmentSubject && (
                    <aside
                      role="tooltip"
                      data-assessment-subject-tooltip={
                        hoveredAssessmentSubject.id
                      }
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
                          {assessmentSubject(hoveredAssessmentSubject.title)}
                        </p>
                        <span
                          className={cn(
                            'shrink-0 text-[11px] font-bold tabular-nums',
                            toneStyle.text,
                          )}
                        >
                          {formatNumber(hoveredAssessmentSubject.score)}점
                        </span>
                      </div>
                    </aside>
                  )}
                </div>
              </div>

              <div
                className="ml-8 grid gap-1 px-2 pt-2 sm:gap-2"
                style={{
                  gridTemplateColumns: `repeat(${assessments.length}, minmax(0, 1fr))`,
                }}
              >
                {assessments.map((assessment, index) => (
                  <div
                    key={assessment.id}
                    className="flex min-w-0 items-center justify-center text-center"
                    title={assessment.title}
                  >
                    <span className="text-fg text-[10px] font-semibold">
                      Q{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-fg-muted flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className={cn('size-2.5 rounded-sm', toneStyle.aboveBar)} />
              {toneStyle.label} · 평균 이상
            </span>
            <span className="flex items-center gap-1.5">
              <span className={cn('size-2.5 rounded-sm', toneStyle.belowBar)} />
              {toneStyle.label} · 평균 미만
            </span>
            <span className="flex items-center gap-1.5">
              <span className="border-danger w-5 border-t-2 border-dashed" />
              시험별 기수 평균
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  'relative w-5 border-t-2 border-solid',
                  toneStyle.legend,
                )}
              >
                <span
                  className={cn(
                    'bg-surface absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2',
                    toneStyle.point,
                  )}
                />
              </span>
              실제 점수 추세
            </span>
            <RecentFiveAverage
              assessments={assessments}
              overallAverage={absoluteAverage}
            />
          </div>
        </>
      )}
    </section>
  )
}

function RecentFiveAverage({
  assessments,
  overallAverage,
}: {
  assessments: CertificateTechDetail['assessments']
  overallAverage: number | null
}) {
  const recent = assessments.slice(-5)
  if (recent.length === 0 || overallAverage === null) return null

  const recentAverage =
    recent.reduce((sum, assessment) => sum + assessment.score, 0) /
    recent.length
  const delta = recentAverage - overallAverage

  return (
    <span
      className={cn('font-semibold', delta >= 0 ? 'text-brand' : 'text-danger')}
    >
      최근 5회 절대 평균 {recentAverage.toFixed(1)}점 (
      {recent.length < 5 && `유효 ${recent.length}회 · `}
      {delta >= 0 ? '+' : ''}
      {delta.toFixed(1)}점)
    </span>
  )
}

function TechCategoryGroup({
  title,
  description,
  categories,
  emptyMessage,
  toneOffset = 0,
}: {
  title: string
  description: string
  categories: CertificateTechDetail['categories']
  emptyMessage: string
  toneOffset?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = categories.length > INITIAL_VISIBLE_CATEGORY_COUNT
  const visibleCategories = expanded
    ? categories
    : categories.slice(0, INITIAL_VISIBLE_CATEGORY_COUNT)

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <span className="text-fg text-[13px] font-bold">{title}</span>
        <span className="text-fg-subtle text-[11px]">{description}</span>
      </div>
      {categories.length === 0 ? (
        <EmptyData>{emptyMessage}</EmptyData>
      ) : (
        visibleCategories.map((category, index) => (
          <div key={category.label} className="flex flex-col gap-1.5">
            <div className="flex items-end justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-fg text-[13px] font-semibold">
                  {category.label}
                </span>
                <span className="text-fg-subtle text-[11px]">
                  {category.attemptCount}회 평가 · 비교 표본{' '}
                  {category.populationSize}명
                </span>
              </div>
              <div className="flex items-center gap-2">
                {category.topPercent !== null && (
                  <span className="bg-brand/10 text-brand rounded px-1.5 py-0.5 text-[10px] font-bold">
                    상위 {formatNumber(category.topPercent)}%
                  </span>
                )}
                <span className="text-fg text-[16px] font-bold">
                  {formatNumber(category.score)}점
                </span>
              </div>
            </div>
            <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  'h-full rounded-full',
                  TONE_SOLID[
                    categoryTones[(index + toneOffset) % categoryTones.length]
                  ],
                )}
                style={{ width: `${category.score}%` }}
              />
            </div>
          </div>
        ))
      )}
      {hasMore && (
        <button
          type="button"
          aria-expanded={expanded}
          className="border-divider text-brand focus-visible:ring-ring w-full border-t pt-3 text-[11px] font-bold focus-visible:ring-2 focus-visible:outline-none"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? '접기' : `전체 ${categories.length}개 보기`}
        </button>
      )}
    </div>
  )
}

function TechTabContent({ tech }: { tech: CertificateTechDetail }) {
  const approvedCount = tech.certifications.filter(
    (certification) => certification.status === 'APPROVED',
  ).length
  const chronologicalAssessments = [...tech.assessments].sort(
    (left, right) =>
      left.submittedAt.localeCompare(right.submittedAt) ||
      left.id.localeCompare(right.id),
  )
  const achievementAssessments = chronologicalAssessments.filter(
    (assessment) => assessment.assessmentType === 'ACHIEVEMENT',
  )
  const csAssessments = chronologicalAssessments.filter(
    (assessment) => assessment.assessmentType === 'CS',
  )
  const achievementCategories = tech.categories.filter(
    (category) => category.assessmentType !== 'CS',
  )
  const csCategories = tech.categories.filter(
    (category) => category.assessmentType === 'CS',
  )

  return (
    <div className="flex flex-col gap-4">
      <TabHead
        no={2}
        title="기술·검증"
        sub="퀴즈 카테고리 점수·평가 추세·자격증·과제 제출 근거"
      >
        <span className="text-fg-muted text-[11px] font-semibold">
          ● 기술 평균 {formatNumber(tech.averageScore)}
        </span>
        <span className="text-fg-muted text-[11px] font-semibold">
          ● 전체 시험 평균{' '}
          {tech.assessmentAverageTopPercent === null
            ? '상위 비율 산출 전'
            : `상위 ${formatNumber(tech.assessmentAverageTopPercent)}%`}
          {tech.assessmentAveragePopulationSize > 0 &&
            ` · ${tech.assessmentAveragePopulationSize}명`}
        </span>
        <span className="text-fg-muted text-[11px] font-semibold">
          ● 인증 완료 {approvedCount}건
        </span>
      </TabHead>

      <section
        data-tech-category-card
        className={cn(card, 'flex flex-col gap-4')}
      >
        <span className="text-fg text-[15px] font-bold">
          카테고리별 기술 점수
        </span>
        <div data-tech-category-split className="grid grid-cols-2 items-start">
          <div className="min-w-0 pr-4">
            <TechCategoryGroup
              title="성취도 평가"
              description="카테고리별 최신 유효 평가"
              categories={achievementCategories}
              emptyMessage="산정 가능한 성취도 평가 결과가 없습니다."
            />
          </div>
          <div className="border-divider min-w-0 border-l pl-4">
            <TechCategoryGroup
              title="CS 평가"
              description="시행된 카테고리를 동적으로 표시"
              categories={csCategories}
              emptyMessage="아직 시행된 CS 평가가 없습니다."
              toneOffset={achievementCategories.length}
            />
          </div>
        </div>
      </section>

      <div
        data-tech-following-content
        data-assessment-trend-split
        className="grid grid-cols-1 gap-4 xl:grid-cols-2"
      >
        <div className="min-w-0">
          <AssessmentTrendChart
            assessments={achievementAssessments}
            averageTopPercent={tech.assessmentAverageTopPercent}
            averagePopulationSize={tech.assessmentAveragePopulationSize}
            title="성취도 평가 시험 추세"
            emptyMessage="표시할 성취도 평가 이력이 없습니다."
            tone="achievement"
            showAverageRank={false}
          />
        </div>
        <div className="min-w-0">
          <AssessmentTrendChart
            assessments={csAssessments}
            averageTopPercent={tech.assessmentAverageTopPercent}
            averagePopulationSize={tech.assessmentAveragePopulationSize}
            title="CS 평가 시험 추세"
            emptyMessage="표시할 CS 평가 이력이 없습니다."
            tone="cs"
            showAverageRank={false}
          />
        </div>
      </div>

      <section className={cn(card, 'flex flex-col gap-4')}>
        <div className="flex flex-col gap-1">
          <span className="text-fg text-[15px] font-bold">
            자격증 · 외부 인증
          </span>
          {tech.certifications.length > 0 && (
            <span className="text-fg-subtle text-[11px]">
              {certificationCountLabel(tech.certifications)}
            </span>
          )}
        </div>
        {tech.certifications.length === 0 ? (
          <EmptyData>등록된 외부 인증이 없습니다.</EmptyData>
        ) : (
          tech.certifications.map((certification) => {
            const status = certificationStatus[certification.status] ?? {
              label: certification.status,
              tone: 'info' as const,
            }
            return (
              <div
                key={certification.name}
                className="flex min-w-0 items-start gap-3"
              >
                <span
                  className={cn(
                    'min-w-12 shrink-0 rounded-md px-2 py-1 text-center text-[10px] font-bold',
                    TONE_SOFT[status.tone],
                  )}
                >
                  {status.label}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-fg text-[13px] font-semibold">
                    {certification.name}
                  </span>
                  <span className="text-fg-subtle text-[11px]">
                    {certificationDetailLabel(certification)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}

export function TechTab({ studentId }: { studentId?: string }) {
  const query = useCertificateDetailTabs(studentId)

  return (
    <DataBoundary
      isPending={query.isPending}
      isError={query.isError || !query.data}
      onRetry={query.refetch}
      errorTitle="기술·검증 데이터를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요."
    >
      {query.data && <TechTabContent tech={query.data.tech} />}
    </DataBoundary>
  )
}

export function TabHead({
  no,
  title,
  sub,
  children,
}: {
  no: number
  title: string
  sub: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="bg-brand-deep flex size-6 items-center justify-center rounded-md text-[12px] font-bold text-white">
          {no}
        </span>
        <div className="flex flex-col">
          <h2 className="text-fg text-[18px] font-bold">{title}</h2>
          <span className="text-fg-subtle text-[11px]">{sub}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  )
}
