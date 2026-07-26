import { useEffect, useRef, useState } from 'react'

/**
 * 숫자 입력 — 편집 중 빈 값을 허용해 직접 타이핑이 되게 한다.
 *
 * controlled input에 `Number(e.target.value)`를 그대로 넣으면 값을 지울 때
 * `''` → `0`으로 강제돼 필드에 "0"이 남고, 이어 타이핑하면 "010"처럼 앞자리 0이 붙는다.
 * (사실상 스피너 클릭으로만 조정하게 되는 원인.)
 * 입력 중에는 문자열을 그대로 두고, blur 시 min 이상으로 정규화한다.
 */
export function NumberInput({
  value,
  onChange,
  min = 0,
  className,
  'aria-label': ariaLabel,
}: {
  value: number
  onChange: (next: number) => void
  min?: number
  className?: string
  'aria-label'?: string
}) {
  const [text, setText] = useState(String(value))
  // 편집 중에는 외부 값 동기화를 건너뛴다(사용자가 친 값을 덮어쓰지 않도록).
  const editing = useRef(false)

  useEffect(() => {
    if (!editing.current) setText(String(value))
  }, [value])

  return (
    <input
      type="number"
      min={min}
      aria-label={ariaLabel}
      className={className}
      value={text}
      onFocus={() => {
        editing.current = true
      }}
      onChange={(e) => {
        const raw = e.target.value
        setText(raw) // 빈 값도 그대로 — 지우고 새로 입력할 수 있어야 한다
        if (raw === '') return
        const next = Number(raw)
        if (Number.isFinite(next)) onChange(next)
      }}
      onBlur={() => {
        editing.current = false
        const parsed = Number(text)
        const next =
          text === '' || !Number.isFinite(parsed) || parsed < min ? min : parsed
        setText(String(next))
        if (next !== value) onChange(next)
      }}
    />
  )
}
