import { cn } from '@/shared/lib/cn'

export type InputSize = 'sm' | 'md'

// 크기 표준 — sm은 모달·폼 필드(h-10), md는 페이지 폼(마법사·설정)의 큰 필드.
const inputSizes: Record<InputSize, string> = {
  sm: 'h-10 rounded-lg px-3 text-[13px]',
  md: 'rounded-[10px] px-4 py-3 text-[14px]',
}

// display·크기·테두리 색 제외 공통 스타일. focus-visible:shadow-none — 전역 base의 input 포커스 링을
// 끄고 테두리 색 변화 하나만 남긴다(링+테두리 2겹 방지, DateTimePicker 트리거와 동일한 포커스 표현).
export const inputBase =
  'bg-surface text-fg placeholder:text-fg-subtle focus-visible:shadow-none w-full border outline-none'

// 테두리 색은 invalid 상태와 상호배타로 합성한다 — cn이 단순 join이라 색 클래스가 공존하면 CSS 순서에 좌우됨.
const inputBorders = {
  normal: 'border-border focus:border-brand',
  invalid: 'border-danger focus:border-danger',
}

/**
 * 입력 필드 스타일 클래스 — 화면마다 복붙되던 인라인 input/textarea 문자열의 정본(buttonClass와 동일 패턴).
 * textarea는 className으로 min-h·resize-none·leading 등을 덧붙여 쓴다. 검증 오류는 invalid로.
 *
 * @example <input className={inputClass()} />
 * @example <textarea className={inputClass({ size: 'md', className: 'min-h-[100px] resize-none leading-6' })} />
 * @example <input className={inputClass({ invalid: hasError })} aria-invalid={hasError} />
 */
export function inputClass({
  size = 'sm',
  invalid = false,
  className,
}: {
  size?: InputSize
  invalid?: boolean
  className?: string
} = {}): string {
  return cn(
    inputBase,
    inputBorders[invalid ? 'invalid' : 'normal'],
    inputSizes[size],
    className,
  )
}
