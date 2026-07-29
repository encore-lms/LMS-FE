import type { MentoringRequestPolicy } from '../types'

const STATUS_ITEMS = [
  {
    key: 'requestedCount',
    label: '요청 대기',
    className: 'bg-info-bg text-info',
  },
  {
    key: 'proposedCount',
    label: '조정 제안',
    className: 'bg-warning-bg text-warning',
  },
  {
    key: 'reservedCount',
    label: '확정 예약',
    className: 'bg-success-bg text-success',
  },
] as const

export function MentoringProgressSummary({
  policy,
  awaitingCompletionCount,
}: {
  policy: MentoringRequestPolicy
  awaitingCompletionCount: number
}) {
  const remaining = Math.max(0, policy.limit - policy.inUse)

  return (
    <section
      aria-label="멘토링 진행 현황"
      className="bg-surface flex flex-col gap-3 rounded-2xl px-5 py-4 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.04)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-fg text-[14px] font-bold">진행 중 멘토링</h2>
          <span className="text-fg-muted text-[12px] font-semibold">
            {policy.inUse} / {policy.limit}건
          </span>
        </div>
        <span className="text-fg-subtle text-[11.5px] font-medium">
          {policy.canRequest
            ? `${remaining}건 더 요청할 수 있어요`
            : '팀당 진행 한도를 모두 사용 중이에요'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_ITEMS.map((item) => (
          <span
            key={item.key}
            className={`${item.className} rounded-full px-2.5 py-1 text-[11.5px] font-bold`}
          >
            {item.label} {policy[item.key]}건
          </span>
        ))}
        {awaitingCompletionCount > 0 && (
          <span className="bg-surface-muted text-fg-muted rounded-full px-2.5 py-1 text-[11.5px] font-bold">
            일정 종료 · 완료 처리 대기 {awaitingCompletionCount}건
          </span>
        )}
      </div>
    </section>
  )
}
