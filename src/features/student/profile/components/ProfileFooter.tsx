import { cn } from '@/shared/lib/cn'
import { ProfileActionButton } from './ProfileActionButton'

// 하단 sticky 액션 바 — 변경 있으면 다크 바(저장 유도), 변경 없으면 흰 바(맨 밑 대기).
export function ProfileFooter({
  dirty,
  dirtyCount,
  saving,
  onCertificate,
}: {
  dirty: boolean
  dirtyCount: number
  saving: boolean
  onCertificate: () => void
}) {
  return (
    <div
      className={cn(
        'sticky bottom-6 z-10 mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-6 py-4',
        dirty
          ? 'bg-brand-deep text-white shadow-lg'
          : 'border-border bg-surface border',
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            'text-sm font-bold',
            dirty ? 'text-white' : 'text-fg-muted',
          )}
        >
          {dirty
            ? `변경된 항목 ${dirtyCount}건 — 저장이 필요합니다`
            : '변경되지 않은 항목 — 저장할 변경 없음'}
        </span>
        <span
          className={cn('text-xs', dirty ? 'text-white/60' : 'text-fg-subtle')}
        >
          저장 시 헤더 아바타·대시보드·증명서 미리보기에 즉시 반영됩니다
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCertificate}
          className={cn(
            'inline-flex h-10 items-center rounded-[10px] border px-4 text-[14px] font-semibold',
            dirty
              ? 'border-white/30 text-white hover:bg-white/10'
              : 'border-border text-fg hover:bg-surface-muted',
          )}
        >
          증명서 확인
        </button>
        <ProfileActionButton type="submit" disabled={!dirty || saving}>
          {saving ? '저장 중…' : '변경사항 저장'}
        </ProfileActionButton>
      </div>
    </div>
  )
}
