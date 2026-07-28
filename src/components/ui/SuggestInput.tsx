import { useId } from 'react'
import { cn } from '@/shared/lib/cn'
import { inputClass } from './inputClass'

interface Props {
  value: string
  onChange: (value: string) => void
  /** 이미 쓰인 값 제안 — 자유 입력이라 표기가 갈라지는 걸 줄인다. */
  suggestions?: string[]
  placeholder?: string
  'aria-label'?: string
  className?: string
  maxLength?: number
  disabled?: boolean
}

/**
 * 자유 입력 + 기존값 추천(datalist) — 고정 카탈로그를 둘 수 없지만 표기 흔들림은 막고 싶은 값에 쓴다.
 * 퀴즈·문항 카테고리가 첫 사용처: 과정마다 값이 달라 목록으로 고정할 수 없는데,
 * 'Spark'와 'spark'가 갈라지면 결과 화면의 카테고리별 정답률 집계가 쪼개진다.
 */
export function SuggestInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  className,
  maxLength,
  disabled,
  'aria-label': ariaLabel,
}: Props) {
  const listId = useId()
  const unique = [...new Set(suggestions.filter(Boolean))]
  return (
    <>
      <input
        type="text"
        list={unique.length > 0 ? listId : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(inputClass(), className)}
      />
      {unique.length > 0 && (
        <datalist id={listId}>
          {unique.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </>
  )
}
