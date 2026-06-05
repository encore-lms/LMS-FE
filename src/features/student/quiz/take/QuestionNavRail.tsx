import { cn } from '@/shared/lib/cn'

// 퀴즈 응시 좌측 문제 네비 레일 — 번호 그리드(답변완료/현재/미답변) + 범례 + 미답변 수.
export function QuestionNavRail({
  total,
  currentIdx,
  answeredIdx,
  onJump,
}: {
  total: number
  currentIdx: number
  answeredIdx: Set<number>
  onJump: (idx: number) => void
}) {
  const nums = Array.from({ length: total }, (_, i) => i)
  const unanswered = total - answeredIdx.size
  return (
    <aside className="bg-surface-muted border-border flex h-full w-[240px] shrink-0 flex-col gap-4 border-r px-5 py-6">
      <div className="flex flex-col gap-1">
        <p className="text-fg text-[13px] font-semibold">문제 목록</p>
        <p className="text-fg-subtle text-[11px]">총 {total}문항</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {nums.map((i) => {
          const isCurrent = i === currentIdx
          const isAnswered = answeredIdx.has(i)
          return (
            <button
              key={i}
              type="button"
              onClick={() => onJump(i)}
              className={cn(
                'flex size-8 items-center justify-center rounded-lg text-[12px] font-semibold',
                isCurrent
                  ? 'bg-accent-bg text-accent-strong border-accent-strong border-2'
                  : isAnswered
                    ? 'bg-brand text-white'
                    : 'border-border text-fg-muted border bg-white font-medium',
              )}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
      <div className="flex flex-col gap-2 pt-3">
        <Legend className="bg-brand" label="답변 완료" />
        <Legend
          className="bg-accent-bg border-accent-strong border-2"
          label="현재 문제"
        />
        <Legend className="border-border border bg-white" label="미답변" />
        <div className="bg-warning-bg border-warning-bg text-warning flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-[11px]">
          <span className="font-medium">미답변</span>
          <span className="font-semibold">{unanswered}문항</span>
        </div>
      </div>
    </aside>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('size-3.5 rounded', className)} />
      <span className="text-fg-muted text-[11px]">{label}</span>
    </div>
  )
}
