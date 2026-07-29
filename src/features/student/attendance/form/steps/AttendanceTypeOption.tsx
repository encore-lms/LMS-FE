import { cn } from '@/shared/lib/cn'

// 출결 유형 단일 라디오 카드 — 라벨 + 조건부 입력 안내(hint). 선택 시 brand 강조.
export function AttendanceTypeOption({
  label,
  hint,
  selected,
  onSelect,
}: {
  label: string
  hint: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex flex-1 basis-40 flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left transition-colors',
        selected
          ? 'border-brand bg-brand/5'
          : 'border-border hover:border-fg-subtle bg-white',
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            'flex h-4 w-4 items-center justify-center rounded-full border-2',
            selected ? 'border-brand' : 'border-fg-subtle',
          )}
        >
          {selected && <span className="bg-brand h-2 w-2 rounded-full" />}
        </span>
        <span className="text-fg text-sm font-bold">{label}</span>
      </span>
      <span className="text-fg-subtle pl-6 text-xs">{hint}</span>
    </button>
  )
}
