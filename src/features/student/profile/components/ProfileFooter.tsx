import { ProfileActionButton } from './ProfileActionButton'

// 하단 sticky 액션 바 — 변경 상태 안내 + [증명서 확인] + [변경사항 저장](submit).
export function ProfileFooter({
  dirty,
  saving,
  onCertificate,
}: {
  dirty: boolean
  saving: boolean
  onCertificate: () => void
}) {
  return (
    <div className="border-border bg-surface sticky bottom-0 -mx-8 flex flex-wrap items-center justify-between gap-3 border-t px-8 py-4">
      <span className="text-fg-subtle text-sm">
        {dirty
          ? '저장하지 않은 변경 사항이 있습니다'
          : '저장할 변경이 없습니다'}{' '}
        · 저장 시 헤더 아바타·대시보드·증명서에 즉시 반영
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCertificate}
          className="border-border text-fg hover:bg-surface-muted inline-flex h-10 items-center rounded-[10px] border px-4 text-[14px] font-semibold"
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
