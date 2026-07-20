import type { ProfileCompletion as ProfileCompletionData } from '../types'
import { ProfileActionButton } from './ProfileActionButton'

// 프로필 완성도 배너 — 원형 진행률 + 미입력 배지 + 안내 + 필수 항목 진행 바 + [미입력 항목 보기].
const R = 26
const C = 2 * Math.PI * R

export function ProfileCompletion({
  completion,
  onViewMissing,
}: {
  completion: ProfileCompletionData
  onViewMissing: () => void
}) {
  const { pct, requiredDone, requiredTotal, missingCount, updatedAt } =
    completion
  const updated = `${updatedAt.slice(0, 10)} ${updatedAt.slice(11, 16)}`
  const requiredPct = Math.round((requiredDone / requiredTotal) * 100)

  return (
    <section className="bg-surface flex flex-wrap items-center justify-between gap-4 rounded-xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              strokeWidth="6"
              className="stroke-divider"
            />
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className="stroke-brand"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct / 100)}
            />
          </svg>
          <span className="text-fg absolute inset-0 flex items-center justify-center text-sm font-bold">
            {pct}%
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-fg font-bold">프로필 완성도</span>
            {missingCount > 0 && (
              <span className="bg-danger-bg text-danger rounded-full px-2 py-0.5 text-xs font-semibold">
                증명서 필수 — {missingCount}건 누락
              </span>
            )}
          </div>
          <p className="text-fg-muted text-sm">
            증명서·외부 공개에 사용할 외부 URL {missingCount}건(GitHub·블로그)이
            비어 있습니다. 입력 후 저장하면 즉시 반영됩니다.
          </p>
          <div className="mt-1 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-fg-subtle text-xs">
                필수 항목 {requiredDone} / {requiredTotal} 완료
              </span>
              <span className="text-fg-subtle text-xs">
                마지막 수정 {updated}
              </span>
            </div>
            <div className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="bg-brand h-full rounded-full"
                style={{ width: `${requiredPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <ProfileActionButton onClick={onViewMissing}>
        미입력 항목 보기
      </ProfileActionButton>
    </section>
  )
}
