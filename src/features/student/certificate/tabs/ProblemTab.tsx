import { useState } from 'react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import { TONE_SOFT, TONE_SOLID } from '@/shared/lib/tone'
import type { CertificateProblemDetail } from '../ai'
import type { CertProblemTab, Tone } from '../types'
import { useCertificateDetailTabs } from '../useCertificateDetailTabs'
import { TabHead } from './TechTab'

const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

const tones: Tone[] = [
  'info',
  'accent',
  'warning',
  'brand',
  'success',
  'danger',
]

type CaseFilter = 'all' | 'independent' | 'supported'

function formatNumber(value: number | null) {
  if (value === null) return '-'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function summaryFields(item: CertificateProblemDetail['cases'][number]) {
  const summary = item.summary ?? null
  return [
    {
      key: 'situation',
      label: '상황',
      summary: summary?.situation,
      original: item.situation,
      tone: 'info' as const,
    },
    {
      key: 'resolution',
      label: '해결',
      summary: summary?.resolution,
      original: item.resolution,
      tone: 'brand' as const,
    },
    {
      key: 'result',
      label: '결과',
      summary: summary?.result,
      original: item.result,
      tone: 'success' as const,
    },
  ]
}

function EmptyData({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-muted text-fg-subtle rounded-xl px-4 py-8 text-center text-[12px]">
      {children}
    </div>
  )
}

function CaseSummaryBlock({
  field,
  displayLabel,
  caseTitle,
  emphasis = false,
  onOpen,
}: {
  field: ReturnType<typeof summaryFields>[number]
  displayLabel: string
  caseTitle: string
  emphasis?: boolean
  onOpen: () => void
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-2 rounded-xl border p-4',
        emphasis
          ? 'border-success/30 bg-success-bg/40'
          : 'border-divider bg-surface-muted',
      )}
    >
      <dt className="flex items-center justify-between gap-2">
        <span className="text-fg flex items-center gap-2 text-[12px] font-bold">
          <span className={cn('size-2 rounded-full', TONE_SOLID[field.tone])} />
          {displayLabel}
        </span>
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${caseTitle} ${field.label} 상세보기`}
          className="text-brand hover:text-brand-deep text-[10px] font-semibold underline-offset-2 hover:underline"
        >
          원문 보기
        </button>
      </dt>
      <dd
        className={cn(
          'm-0 leading-5',
          emphasis
            ? 'text-fg text-[12px] font-semibold'
            : 'text-fg-muted text-[11px]',
        )}
      >
        {field.summary || 'AI 요약을 생성하지 못했습니다.'}
      </dd>
    </div>
  )
}

function ProblemTabContent({ problem }: { problem: CertificateProblemDetail }) {
  const [detail, setDetail] = useState<{
    caseTitle: string
    label: string
    content: string
  } | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [caseFilter, setCaseFilter] = useState<CaseFilter>('all')
  const categoryCases = problem.cases.filter(
    (item) => selectedCategory === null || item.category === selectedCategory,
  )
  const independentCount = categoryCases.filter(
    (item) => item.independent,
  ).length
  const supportedCount = categoryCases.length - independentCount
  const caseFilters: Array<{
    value: CaseFilter
    label: string
    count: number
  }> = [
    { value: 'all', label: '전체', count: categoryCases.length },
    { value: 'independent', label: '독립 해결', count: independentCount },
    { value: 'supported', label: '지원 활용', count: supportedCount },
  ]
  const visibleCases = categoryCases.filter((item) => {
    if (caseFilter === 'independent') return item.independent
    if (caseFilter === 'supported') return !item.independent
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      <TabHead
        no={4}
        title="문제해결·협업"
        sub="트러블슈팅 사례 · 문제 분포 · 자동 산정 기반"
      >
        <span className="bg-success-bg text-success rounded-full px-2.5 py-1 text-[11px] font-semibold">
          인증 사례 {problem.certifiedCount}건
        </span>
        <span className="bg-info-bg text-info rounded-full px-2.5 py-1 text-[11px] font-semibold">
          평균 {formatNumber(problem.averageDays)}일
        </span>
      </TabHead>

      <section className={cn(card, 'flex flex-col gap-4')}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-fg text-[18px] font-bold">문제 분포</span>
            <span className="text-fg-subtle text-[11px]">
              문제 유형을 선택하면 해당 인증 사례를 바로 확인할 수 있습니다.
            </span>
          </div>
          <span className="text-fg-muted text-[11px] font-semibold">
            전체 인증 {problem.certifiedCount}건
          </span>
        </div>

        {problem.categories.length === 0 ? (
          <EmptyData>산출 가능한 카테고리 분포가 없습니다.</EmptyData>
        ) : (
          <div
            className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
            role="group"
            aria-label="트러블슈팅 문제 카테고리"
          >
            <button
              type="button"
              aria-label={`전체 카테고리 ${problem.cases.length}건`}
              aria-pressed={selectedCategory === null}
              aria-controls="certificate-troubleshooting-cases"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'focus-visible:ring-brand flex min-h-20 flex-col justify-between gap-2 rounded-xl border p-3.5 text-left transition-colors outline-none focus-visible:ring-2',
                selectedCategory === null
                  ? 'border-brand bg-brand/5'
                  : 'border-divider bg-surface hover:border-brand/50',
              )}
            >
              <span className="text-fg flex items-center gap-2 text-[12px] font-bold">
                <span className="bg-brand size-2 rounded-full" />
                전체 카테고리
              </span>
              <span className="text-brand text-[18px] font-bold">
                {problem.cases.length}건
              </span>
              <span className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full">
                <span className="bg-brand block h-full w-full rounded-full" />
              </span>
            </button>

            {problem.categories.map((category, index) => {
              const selected = selectedCategory === category.label
              const tone = tones[index % tones.length]
              return (
                <button
                  key={category.label}
                  type="button"
                  aria-label={`${category.label} 카테고리 ${category.count}건`}
                  aria-pressed={selected}
                  aria-controls="certificate-troubleshooting-cases"
                  onClick={() => setSelectedCategory(category.label)}
                  className={cn(
                    'focus-visible:ring-brand flex min-h-20 flex-col justify-between gap-2 rounded-xl border p-3.5 text-left transition-colors outline-none focus-visible:ring-2',
                    selected
                      ? 'border-brand bg-brand/5'
                      : 'border-divider bg-surface hover:border-brand/50',
                  )}
                >
                  <span className="text-fg flex items-center gap-2 text-[12px] font-bold">
                    <span
                      className={cn('size-2 rounded-full', TONE_SOLID[tone])}
                    />
                    {category.label}
                  </span>
                  <span className="flex items-end justify-between gap-2">
                    <span className="text-fg text-[18px] font-bold">
                      {category.count}건
                    </span>
                    <span className="text-fg-muted text-[10px] font-semibold">
                      {formatNumber(category.percentage)}%
                    </span>
                  </span>
                  <span className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full">
                    <span
                      className={cn(
                        'block h-full rounded-full',
                        TONE_SOLID[tone],
                      )}
                      style={{ width: `${category.percentage}%` }}
                    />
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section
        id="certificate-troubleshooting-cases"
        className={cn(card, 'flex flex-col gap-4')}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-fg text-[18px] font-bold">
              {selectedCategory === null
                ? '인증 트러블슈팅 사례'
                : `${selectedCategory} 트러블슈팅`}
            </span>
            <span className="text-fg-subtle text-[11px]">
              문제 상황과 해결 접근을 살펴보고 검증 결과를 한눈에 비교합니다.
            </span>
          </div>
          <span className="bg-success-bg text-success rounded-full px-2.5 py-1 text-[11px] font-semibold">
            선택 결과 {categoryCases.length}건
          </span>
        </div>

        {problem.cases.length === 0 ? (
          <EmptyData>인증된 트러블슈팅 사례가 없습니다.</EmptyData>
        ) : (
          <div className="flex flex-col gap-4">
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="트러블슈팅 해결 방식 필터"
            >
              {caseFilters.map((filter) => {
                const selected = caseFilter === filter.value
                return (
                  <button
                    key={filter.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setCaseFilter(filter.value)}
                    className={cn(
                      'focus-visible:ring-brand rounded-lg border px-3 py-2 text-[11px] font-bold transition-colors outline-none focus-visible:ring-2',
                      selected
                        ? 'border-brand bg-brand text-on-color'
                        : 'border-divider bg-surface-muted text-fg-muted hover:text-fg',
                    )}
                  >
                    {filter.label} {filter.count}건
                  </button>
                )
              })}
            </div>

            {visibleCases.length === 0 ? (
              <EmptyData>
                {caseFilter === 'all'
                  ? '선택한 카테고리의 인증 사례가 없습니다.'
                  : caseFilter === 'independent'
                    ? '독립 해결로 분류된 인증 사례가 없습니다.'
                    : '지원을 활용해 해결한 인증 사례가 없습니다.'}
              </EmptyData>
            ) : null}

            {visibleCases.map((item, index) => {
              const [situation, resolution, result] = summaryFields(item)
              return (
                <article
                  key={item.id}
                  data-troubleshooting-case={item.id}
                  className="border-divider flex flex-col gap-4 rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-fg-muted text-[11px] font-bold">
                      사례 {String(index + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-bold',
                        TONE_SOFT[tones[index % tones.length]],
                      )}
                    >
                      {item.category}
                    </span>
                    <span className="text-fg text-[14px] font-bold">
                      {item.title}
                    </span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-bold',
                        item.independent
                          ? 'bg-brand/10 text-brand'
                          : 'bg-info-bg text-info',
                      )}
                    >
                      {item.independent ? '독립 해결' : '지원 활용'}
                    </span>
                    <span className="bg-surface-muted text-fg-muted ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold">
                      {item.days === null
                        ? '소요 일수 미집계'
                        : `소요 ${item.days}일`}
                    </span>
                  </div>

                  <dl className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.65fr)]">
                    <div className="flex min-w-0 flex-col gap-3">
                      <CaseSummaryBlock
                        field={situation}
                        displayLabel="문제 상황"
                        caseTitle={item.title}
                        onOpen={() =>
                          setDetail({
                            caseTitle: item.title,
                            label: situation.label,
                            content: situation.original,
                          })
                        }
                      />
                      <CaseSummaryBlock
                        field={resolution}
                        displayLabel="해결 접근"
                        caseTitle={item.title}
                        onOpen={() =>
                          setDetail({
                            caseTitle: item.title,
                            label: resolution.label,
                            content: resolution.original,
                          })
                        }
                      />
                    </div>
                    <CaseSummaryBlock
                      field={result}
                      displayLabel="검증 결과"
                      caseTitle={item.title}
                      emphasis
                      onOpen={() =>
                        setDetail({
                          caseTitle: item.title,
                          label: result.label,
                          content: result.original,
                        })
                      }
                    />
                  </dl>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        size="md"
        title={detail ? `${detail.caseTitle} · ${detail.label}` : undefined}
      >
        {detail && (
          <div className="flex flex-col gap-3">
            <span className="text-fg-subtle text-[11px] font-semibold">
              수강생 작성 원문
            </span>
            <p className="bg-surface-muted text-fg-muted m-0 rounded-xl p-4 text-[13px] leading-6 whitespace-pre-wrap">
              {detail.content.trim() || '작성된 내용이 없습니다.'}
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export function ProblemTab({
  studentId,
}: {
  /** 기존 CertificatePage 호출 호환용이며 실제 화면 데이터로 사용하지 않는다. */
  p?: CertProblemTab
  studentId?: string
}) {
  const query = useCertificateDetailTabs(studentId)

  return (
    <DataBoundary
      isPending={query.isPending}
      isError={query.isError || !query.data}
      onRetry={query.refetch}
      errorTitle="문제해결·협업 데이터를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요."
    >
      {query.data && <ProblemTabContent problem={query.data.problem} />}
    </DataBoundary>
  )
}
