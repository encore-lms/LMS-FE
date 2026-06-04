import { AttendanceActionButton } from '../components/AttendanceActionButton'

// 폼 하단 — 취소(좌) / 안내 + 제출(우). 제출 중에는 버튼 비활성.
export function AttendanceFormFooter({
  onCancel,
  submitting,
}: {
  onCancel: () => void
  submitting: boolean
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="text-fg-muted hover:text-fg flex items-center gap-1 text-sm"
      >
        ‹ 취소
      </button>
      <div className="flex items-center gap-4">
        <span className="text-fg-subtle hidden text-xs sm:inline">
          제출 전 확인 후 같은 기수의 마지막 제출로 저장됩니다
        </span>
        <AttendanceActionButton type="submit" disabled={submitting}>
          {submitting ? '제출 중…' : '제출'}
        </AttendanceActionButton>
      </div>
    </div>
  )
}
