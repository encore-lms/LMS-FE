import { useState } from 'react'
import { CheckCircle2, FileText } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { ProblemTabSkeleton } from './TabSkeletons'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import type { CertificateProblemDetail } from '../ai'
import type { CertProblemTab } from '../types'
import { useCertificateDetailTabs } from '../useCertificateDetailTabs'
import { TabHead } from './TechTab'

const card = 'border-divider bg-surface rounded-2xl border p-5 sm:p-6'

type ProblemCase = CertificateProblemDetail['cases'][number]

function formatNumber(value: number | null) {
  if (value === null) return '-'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function summaryFields(item: ProblemCase) {
  const summary = item.summary ?? null
  return [
    {
      key: 'situation',
      step: '01',
      label: '문제 상황',
      summary: summary?.situation,
      original: item.situation,
      numberClassName: 'bg-info-bg text-info',
    },
    {
      key: 'resolution',
      step: '02',
      label: '해결 과정',
      summary: summary?.resolution,
      original: item.resolution,
      numberClassName: 'bg-brand/10 text-brand',
    },
    {
      key: 'result',
      step: '03',
      label: '결과',
      summary: summary?.result,
      original: item.result,
      numberClassName: 'bg-success-bg text-success',
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

function CategoryButton({
  label,
  count,
  percentage,
  selected,
  onClick,
}: {
  label: string
  count: number
  percentage: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={`${label} 카테고리 ${count}건`}
      aria-pressed={selected}
      aria-controls="certificate-troubleshooting-cases"
      onClick={onClick}
      className={cn(
        'focus-visible:ring-brand group grid w-full grid-cols-[minmax(100px,0.75fr)_minmax(120px,1fr)_88px] items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2',
        selected ? 'bg-brand/10' : 'hover:bg-surface-muted bg-surface',
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            'min-w-0 truncate text-[12px] font-bold',
            selected ? 'text-brand' : 'text-fg',
          )}
        >
          {label}
        </span>
      </span>
      <span className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
        <span
          className={cn(
            'block h-full rounded-full transition-[width]',
            selected ? 'bg-brand' : 'bg-fg-subtle/60',
          )}
          style={{ width: `${percentage}%` }}
        />
      </span>
      <span className="text-fg-muted text-right text-[11px] font-bold">
        {count}건 · {formatNumber(percentage)}%
      </span>
    </button>
  )
}

function CaseFlow({ item }: { item: ProblemCase }) {
  const fields = summaryFields(item)
  const [situation, resolution, result] = fields

  return (
    <dl className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.85fr)] lg:gap-7">
      <div className="flex min-w-0 flex-col">
        {[situation, resolution].map((field, index) => (
          <div key={field.key} className="relative flex gap-3 pb-5 last:pb-0">
            <div className="flex w-7 shrink-0 flex-col items-center">
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-[10px] font-bold',
                  field.numberClassName,
                )}
              >
                {field.step}
              </span>
              {index === 0 && (
                <span className="bg-divider mt-1 block h-full w-px" />
              )}
            </div>
            <div className="min-w-0 pt-1">
              <dt className="text-fg text-[12px] font-bold">{field.label}</dt>
              <dd className="text-fg-muted mt-1.5 line-clamp-3 min-h-12 max-w-[34rem] text-[13px] leading-6">
                {field.summary || '요약을 준비 중입니다.'}
              </dd>
            </div>
          </div>
        ))}
      </div>

      <div className="border-success/25 bg-success-bg/55 flex min-w-0 flex-col justify-between gap-4 rounded-xl border p-5">
        <div>
          <dt className="text-success flex items-center gap-2 text-[12px] font-bold">
            <CheckCircle2 className="size-4" strokeWidth={2} />
            {result.label}
          </dt>
          <dd className="text-fg mt-3 line-clamp-3 min-h-12 text-[14px] leading-6 font-semibold">
            {result.summary || '요약을 준비 중입니다.'}
          </dd>
        </div>
        <span className="text-success text-[10px] font-semibold">
          강사 인증으로 확인된 결과
        </span>
      </div>
    </dl>
  )
}

function OriginalDetail({ item }: { item: ProblemCase }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-fg-subtle m-0 text-[11px] leading-5">
        수강생이 작성하고 강사가 인증한 내용을 그대로 보여줍니다.
      </p>
      <dl className="divide-divider border-divider divide-y overflow-hidden rounded-xl border">
        {summaryFields(item).map((field) => (
          <div
            key={field.key}
            className="grid gap-2 p-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-4"
          >
            <dt className="text-fg flex items-center gap-2 text-[12px] font-bold">
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full text-[10px] font-bold',
                  field.numberClassName,
                )}
              >
                {field.step}
              </span>
              {field.label}
            </dt>
            <dd className="text-fg-muted m-0 text-[13px] leading-6 whitespace-pre-wrap">
              {field.original.trim() || '작성된 내용이 없습니다.'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function ProblemTabContent({ problem }: { problem: CertificateProblemDetail }) {
  const sortedCategories = [...problem.categories].sort(
    (a, b) => b.count - a.count,
  )
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    () => sortedCategories[0]?.label ?? null,
  )
  const [detail, setDetail] = useState<ProblemCase | null>(null)
  const visibleCases = problem.cases.filter(
    (item) => selectedCategory === null || item.category === selectedCategory,
  )
  const independentCount = visibleCases.filter(
    (item) => item.independent,
  ).length
  const supportedCount = visibleCases.length - independentCount
  return (
    <div className="flex flex-col gap-4">
      <TabHead
        no={4}
        title="문제해결"
        sub="인증된 경험을 문제 유형과 해결 흐름으로 확인합니다."
      />

      <section className={cn(card, 'overflow-hidden p-0')}>
        {problem.cases.length === 0 ? (
          <div className="p-6">
            <EmptyData>인증된 트러블슈팅 사례가 없습니다.</EmptyData>
          </div>
        ) : (
          <>
            <div
              data-troubleshooting-distribution
              className="flex flex-col gap-3 p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-3 px-3">
                <div>
                  <h2 className="text-fg m-0 text-[16px] font-bold">
                    전체 트러블슈팅 카테고리
                  </h2>
                  <p className="text-fg-subtle m-0 mt-1 text-[10px]">
                    카테고리를 선택하면 아래 인증 사례가 바뀌니다.
                  </p>
                </div>
                <span className="text-fg-muted text-[11px] font-bold">
                  총 {problem.certifiedCount}건
                </span>
              </div>

              <div
                className="flex flex-col"
                aria-label="문제 카테고리"
                aria-live="polite"
              >
                <CategoryButton
                  label="전체"
                  count={problem.cases.length}
                  percentage={100}
                  selected={selectedCategory === null}
                  onClick={() => setSelectedCategory(null)}
                />
                {sortedCategories.map((category) => (
                  <CategoryButton
                    key={category.label}
                    label={category.label}
                    count={category.count}
                    percentage={category.percentage}
                    selected={selectedCategory === category.label}
                    onClick={() => setSelectedCategory(category.label)}
                  />
                ))}
              </div>
            </div>

            <div
              id="certificate-troubleshooting-cases"
              className="border-divider border-t px-5 py-6 sm:px-7"
            >
              <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-brand text-[10px] font-bold">
                    선택한 문제 유형
                  </span>
                  <h3 className="text-fg m-0 text-[20px] font-bold">
                    {selectedCategory ?? '전체 카테고리'} 해결 사례
                  </h3>
                </div>
                <div className="text-fg-muted flex flex-wrap items-center gap-2 text-[10px] font-semibold">
                  <span>{visibleCases.length}개 사례</span>
                  <span aria-hidden="true">·</span>
                  <span>독립 해결 {independentCount}</span>
                  <span aria-hidden="true">·</span>
                  <span>지원 활용 {supportedCount}</span>
                </div>
              </div>

              {visibleCases.length === 0 ? (
                <div className="mt-5">
                  <EmptyData>선택한 카테고리의 인증 사례가 없습니다.</EmptyData>
                </div>
              ) : (
                <div className="divide-divider divide-y">
                  {visibleCases.map((item, index) => (
                    <article
                      key={item.id}
                      data-troubleshooting-case={item.id}
                      className="flex flex-col gap-5 py-6 first:pt-5 last:pb-0"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-fg-subtle text-[10px] font-bold">
                              인증 사례 {String(index + 1).padStart(2, '0')}
                            </span>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-bold',
                                item.independent
                                  ? 'bg-brand/10 text-brand'
                                  : 'bg-info-bg text-info',
                              )}
                            >
                              {item.independent ? '독립 해결' : '지원 활용'}
                            </span>
                            <span className="bg-surface-muted text-fg-muted rounded-full px-2 py-0.5 text-[10px] font-bold">
                              {item.days === null
                                ? '소요 일수 미집계'
                                : `소요 ${item.days}일`}
                            </span>
                          </div>
                          <h4 className="text-fg m-0 text-[15px] leading-6 font-bold">
                            {item.title}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDetail(item)}
                          className="border-divider text-fg-muted hover:border-brand/40 hover:text-brand focus-visible:ring-brand flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold transition-colors outline-none focus-visible:ring-2"
                        >
                          <FileText className="size-3.5" strokeWidth={1.75} />
                          작성 원문 보기
                        </button>
                      </div>

                      <CaseFlow item={item} />
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        size="lg"
        title={detail ? `${detail.title} · 작성 원문` : undefined}
      >
        {detail && <OriginalDetail item={detail} />}
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
      skeleton={<ProblemTabSkeleton />}
      errorTitle="문제해결 데이터를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요."
    >
      {query.data && <ProblemTabContent problem={query.data.problem} />}
    </DataBoundary>
  )
}
