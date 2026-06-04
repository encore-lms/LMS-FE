import type { ProfileCompletion as ProfileCompletionData } from '../types'
import { ProfileActionButton } from './ProfileActionButton'

// 프로필 완성도 배너 — 원형 진행률 + 미입력 배지 + 안내 + [미입력 항목 보기].
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

  return (
    <section className="border-border bg-surface flex flex-wrap items-center justify-between gap-4 rounded-xl border p-6">
      <div className="flex items-center gap-4">
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
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-fg font-bold">프로필 완성도</span>
            {missingCount > 0 && (
              <span className="bg-danger-bg text-danger rounded-full px-2 py-0.5 text-xs font-semibold">
                증명서 필수 {missingCount}건 누락
              </span>
            )}
          </div>
          <p className="text-fg-muted text-sm">
            증명서와 외부 공개에 사용될 기본 정보·URL·스킬을 채워주세요. 입력 후
            저장하면 즉시 반영됩니다.
          </p>
          <span className="text-fg-subtle text-xs">
            필수 항목 {requiredDone}/{requiredTotal} · 마지막 수정 {updated}
          </span>
        </div>
      </div>
      <ProfileActionButton onClick={onViewMissing}>
        미입력 항목 보기
      </ProfileActionButton>
    </section>
  )
}
