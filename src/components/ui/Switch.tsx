import { cn } from '@/shared/lib/cn'

/**
 * 토글 스위치.
 *
 * <p>운영 설정의 교육 과정 설정 화면 안에만 있던 것을 공용으로 올렸다 — 그 화면이 기수 허브로
 * 흡수되면서 사라지는데, 스위치는 다른 자리에서도 쓰인다.</p>
 */
export function Switch({
  checked,
  label,
  onChange,
  disabled = false,
}: {
  checked: boolean
  /** 스크린리더용 이름 — 스위치 옆 글자는 별도 요소라 여기에도 준다. */
  label: string
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors',
        checked ? 'bg-brand' : 'bg-border',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <span
        className={cn(
          'bg-surface block h-5 w-5 rounded-full transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}
