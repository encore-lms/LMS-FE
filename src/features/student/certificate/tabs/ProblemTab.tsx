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

function formatNumber(value: number | null) {
  if (value === null) return '-'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function summaryFields(item: CertificateProblemDetail['cases'][number]) {
  const summary = item.summary?.generatedBy === 'AI' ? item.summary : null
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

function ProblemTabContent({ problem }: { problem: CertificateProblemDetail }) {
  const [detail, setDetail] = useState<{
    caseTitle: string
    label: string
    content: string
  } | null>(null)
  const representativeCases = problem.cases.slice(0, 3)

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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-fg text-[18px] font-bold">
              대표 트러블슈팅 사례
            </span>
            <span className="text-fg-subtle text-[11px]">
              인증 사례 중 대표 3건 · 상황·해결·결과 핵심 요약
            </span>
          </div>
          <span className="bg-success-bg text-success rounded-full px-2.5 py-1 text-[11px] font-semibold">
            최대 3건
          </span>
        </div>

        {representativeCases.length === 0 ? (
          <EmptyData>인증된 트러블슈팅 사례가 없습니다.</EmptyData>
        ) : (
          <div className="flex flex-col gap-4">
            {representativeCases.map((item, index) => (
              <article
                key={item.id}
                data-troubleshooting-case={item.id}
                className="border-divider flex flex-col gap-4 rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-fg-muted text-[11px] font-bold">
                    대표 {String(index + 1).padStart(2, '0')}
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
                  <span className="bg-surface-muted text-fg-muted ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold">
                    {item.days === null
                      ? '소요 일수 미집계'
                      : `소요 ${item.days}일`}
                  </span>
                </div>

                <dl className="grid gap-3 lg:grid-cols-3">
                  {summaryFields(item).map((field) => (
                    <div
                      key={field.key}
                      className="bg-surface-muted flex min-w-0 flex-col gap-2 rounded-xl p-3.5"
                    >
                      <dt className="flex items-center justify-between gap-2">
                        <span className="text-fg flex items-center gap-2 text-[12px] font-bold">
                          <span
                            className={cn(
                              'size-2 rounded-full',
                              TONE_SOLID[field.tone],
                            )}
                          />
                          {field.label}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDetail({
                              caseTitle: item.title,
                              label: field.label,
                              content: field.original,
                            })
                          }
                          aria-label={`${item.title} ${field.label} 상세보기`}
                          className="text-brand hover:text-brand-deep text-[10px] font-semibold underline-offset-2 hover:underline"
                        >
                          상세보기
                        </button>
                      </dt>
                      <dd className="text-fg-muted m-0 text-[11px] leading-5">
                        {field.summary || 'AI 요약을 생성하지 못했습니다.'}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={cn(card, 'flex flex-col gap-3.5')}>
        <span className="text-fg text-[15px] font-bold">문제 분포</span>
        <span className="text-fg-subtle text-[11px]">
          카테고리별 인증 사례 · {problem.certifiedCount}건 기준
        </span>
        {problem.categories.length === 0 ? (
          <EmptyData>산출 가능한 카테고리 분포가 없습니다.</EmptyData>
        ) : (
          problem.categories.map((category, index) => {
            const tone = tones[index % tones.length]
            return (
              <div key={category.label} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-fg flex items-center gap-1.5 font-medium">
                    <span
                      className={cn('size-2 rounded-full', TONE_SOLID[tone])}
                    />
                    {category.label}
                  </span>
                  <span className="text-fg-muted font-semibold">
                    {category.count}건 · {formatNumber(category.percentage)}%
                  </span>
                </div>
                <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={cn('h-full rounded-full', TONE_SOLID[tone])}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            )
          })
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
