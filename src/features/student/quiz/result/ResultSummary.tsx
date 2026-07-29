import { cn } from '@/shared/lib/cn'

// 퀴즈 결과 요약 — 좌측 점수 카드(현재 점수·정답률·문항 구성) + 우측 채점 상태 카드.
export function ResultSummary({
  earned,
  max,
  correct,
  wrong,
  pending,
  notAnswered,
  total,
  autoGradedCount,
  reattemptsLeft,
}: {
  earned: number
  max: number
  correct: number
  wrong: number
  pending: number
  notAnswered: number
  total: number
  autoGradedCount: number
  reattemptsLeft: number
}) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* 점수 카드 */}
      <section className="bg-surface flex flex-1 gap-8 rounded-2xl p-8 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
        <div className="flex flex-col">
          <span className="text-fg-muted text-[12px] font-medium">
            현재 점수 (자동 채점)
          </span>
          <div className="mt-1 flex items-end gap-1">
            <span className="text-fg text-[64px] leading-none font-bold">
              {earned}
            </span>
            <span className="text-fg-subtle pb-2 text-[22px] font-semibold">
              / {max}
            </span>
          </div>
          {pending > 0 && (
            <span className="text-fg-muted mt-3 text-[12px]">
              수동 채점 {pending}문제 반영 시 최종 점수 확정
            </span>
          )}
          <div className="mt-6">
            <p className="text-fg-subtle text-[11px] font-medium">정답률</p>
            <p className="text-fg flex items-baseline gap-2 text-[20px] font-bold">
              {correct} / {total}
              <span className="text-brand text-[13px] font-semibold">
                {accuracy}%
              </span>
            </p>
          </div>
        </div>
        {/* 문항 구성 */}
        <div className="flex w-[280px] flex-col gap-2.5 pt-1">
          <p className="text-fg-subtle text-[11px] font-medium">문항 구성</p>
          <BreakRow color="bg-brand" label="정답" value={correct} />
          <BreakRow color="bg-danger" label="오답" value={wrong} />
          <BreakRow color="bg-warning" label="채점 대기" value={pending} />
          <BreakRow color="bg-fg-subtle" label="미응시" value={notAnswered} />
          <div className="bg-border h-px w-full" />
          <div className="flex items-center justify-between">
            <span className="text-fg-muted text-[12px] font-medium">
              총 문항
            </span>
            <span className="text-fg text-[14px] font-bold">{total}</span>
          </div>
        </div>
      </section>

      {/* 채점 상태 카드 */}
      <section className="bg-surface-muted flex w-full flex-col gap-3 rounded-2xl p-6 lg:w-[384px]">
        <p className="text-fg text-[13px] font-semibold">채점 상태</p>
        <StatusRow
          label="자동 채점"
          value={`완료 (${autoGradedCount}문항)`}
          valueClass="text-brand"
        />
        <StatusRow
          label="수동 채점"
          value={pending > 0 ? `대기 ${pending}문항` : '없음'}
          valueClass={pending > 0 ? 'text-warning' : 'text-fg'}
        />
        <StatusRow label="재채점 이력" value="없음" valueClass="text-fg" />
        <StatusRow
          label="재응시 가능"
          value={`${reattemptsLeft}회 남음`}
          valueClass="text-accent-strong"
        />
      </section>
    </div>
  )
}

function BreakRow({
  color,
  label,
  value,
}: {
  color: string
  label: string
  value: number
}) {
  return (
    <div className="flex items-center">
      <span className={cn('size-2 rounded', color)} />
      <span className="text-fg ml-2 text-[12px]">{label}</span>
      <span className="text-fg ml-auto text-[12px] font-semibold">
        {value}문항
      </span>
    </div>
  )
}

function StatusRow({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-fg-muted text-[12px]">{label}</span>
      <span className={cn('text-[12px] font-semibold', valueClass)}>
        {value}
      </span>
    </div>
  )
}
