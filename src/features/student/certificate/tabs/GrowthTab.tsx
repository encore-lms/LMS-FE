import { DataBoundary } from '@/components/ui/DataBoundary'
import { cn } from '@/shared/lib/cn'
import type { CertificateGrowthDetail } from '../ai'
import type { CertGrowthTab } from '../types'
import { useCertificateDetailTabs } from '../useCertificateDetailTabs'
import { TabHead } from './TechTab'

const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

function formatScore(value: number | null) {
  if (value === null) return '-'
  return value.toFixed(1)
}

function formatDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : value
}

function EmptyData({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-muted text-fg-subtle rounded-xl px-4 py-8 text-center text-[12px]">
      {children}
    </div>
  )
}

function GrowthTabContent({ growth }: { growth: CertificateGrowthDetail }) {
  const scoredAxes = growth.peerReputation.filter(
    (axis): axis is typeof axis & { score: number } => axis.score !== null,
  )
  const peerAverage =
    scoredAxes.length === 0
      ? null
      : scoredAxes.reduce((sum, axis) => sum + axis.score, 0) /
        scoredAxes.length
  const recentComments = [...growth.peerComments]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-4">
      <TabHead
        no={5}
        title="성장·평판"
        sub="동료 5축 평판 · 익명 코멘트 · 멘토 평가 요약"
      >
        <span className="bg-accent-bg text-accent rounded-full px-2.5 py-1 text-[11px] font-semibold">
          동료 평가자 {growth.peerEvaluationCount}명
        </span>
        {peerAverage !== null && (
          <span className="bg-brand/10 text-brand rounded-full px-2.5 py-1 text-[11px] font-semibold">
            동료 평균 {formatScore(peerAverage)}
          </span>
        )}
        {growth.mentorEvaluation && (
          <span className="bg-info-bg text-info rounded-full px-2.5 py-1 text-[11px] font-semibold">
            멘토 평균 {formatScore(growth.mentorEvaluation.averageScore)}
          </span>
        )}
      </TabHead>

      <section
        data-growth-timeline-status={growth.growthTimelineStatus}
        className={cn(card, 'flex flex-col gap-4')}
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-fg text-[15px] font-bold">6개월 성장 궤적</h3>
          <span className="text-fg-subtle text-[11px]">
            월별 역량 변화 추이
          </span>
        </div>
        <EmptyData>
          월별 성장 기록이 쌓이면 역량 변화 추이를 확인할 수 있습니다.
        </EmptyData>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cn(card, 'flex flex-col gap-4')}>
          <div className="flex flex-col gap-1">
            <h3 className="text-fg text-[15px] font-bold">동료 5축 평판</h3>
            <span className="text-fg-subtle text-[11px]">
              완료 프로젝트의 유효 동료 평가 기준
            </span>
          </div>
          {growth.peerReputation.length === 0 ? (
            <EmptyData>산정 가능한 동료 평판이 없습니다.</EmptyData>
          ) : (
            growth.peerReputation.map((axis) => (
              <div key={axis.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-fg font-medium">{axis.key}</span>
                  <span className="text-fg font-bold">
                    {axis.score === null ? (
                      <span className="text-fg-subtle text-[11px]">
                        산정 대기
                      </span>
                    ) : (
                      <>
                        {formatScore(axis.score)}{' '}
                        <span className="text-fg-subtle text-[11px]">
                          / 5.0
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
                  {axis.score !== null && (
                    <div
                      className="bg-brand h-full rounded-full"
                      style={{
                        width: `${Math.min(Math.max(axis.score, 0), 5) * 20}%`,
                      }}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </section>

        <section className={cn(card, 'flex flex-col gap-4')}>
          <div className="flex flex-col gap-1">
            <h3 className="text-fg text-[15px] font-bold">동료 코멘트</h3>
            <span className="text-fg-subtle text-[11px]">
              최근 익명 코멘트 최대 5건
            </span>
          </div>
          {recentComments.length === 0 ? (
            <EmptyData>공유할 수 있는 동료 코멘트가 없습니다.</EmptyData>
          ) : (
            recentComments.map((item, index) => (
              <article
                key={`${item.submittedAt}-${index}`}
                className="bg-surface-muted flex flex-col gap-2 rounded-xl p-4"
              >
                <p className="text-fg m-0 text-[13px] leading-5">
                  {item.comment}
                </p>
                <span className="text-fg-subtle text-[11px]">
                  동기수 동료 수강생 · {formatDate(item.submittedAt)}
                </span>
              </article>
            ))
          )}
        </section>
      </div>

      <section className={cn(card, 'flex flex-col gap-4')}>
        <div className="flex flex-col gap-1">
          <h3 className="text-fg text-[15px] font-bold">멘토 평가 요약</h3>
          <span className="text-fg-subtle text-[11px]">
            최신 멘토 평가의 전체 평균만 표시합니다.
          </span>
        </div>
        {growth.mentorEvaluation ? (
          <div className="border-divider flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
            <div className="flex flex-col gap-1">
              <span className="text-fg text-[13px] font-bold">
                멘토 종합 평가
              </span>
              <span className="text-fg-subtle text-[11px]">
                평가일 {formatDate(growth.mentorEvaluation.submittedAt)}
              </span>
            </div>
            <span className="text-brand text-[22px] font-bold">
              {formatScore(growth.mentorEvaluation.averageScore)}
              <span className="text-fg-subtle ml-1 text-[11px]">/ 5.0</span>
            </span>
          </div>
        ) : (
          <EmptyData>등록된 멘토 평가 요약이 없습니다.</EmptyData>
        )}
      </section>
    </div>
  )
}

export function GrowthTab({
  studentId,
}: {
  /** 기존 CertificatePage 호출 호환용이며 실제 화면 데이터로 사용하지 않는다. */
  g?: CertGrowthTab
  studentId?: string
}) {
  const query = useCertificateDetailTabs(studentId)

  return (
    <DataBoundary
      isPending={query.isPending}
      isError={query.isError || !query.data}
      onRetry={query.refetch}
      errorTitle="성장·평판 데이터를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요."
    >
      {query.data && <GrowthTabContent growth={query.data.growth} />}
    </DataBoundary>
  )
}
