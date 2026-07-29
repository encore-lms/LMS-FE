import { cn } from '@/shared/lib/cn'

export type InputSize = 'sm' | 'md'

// 크기 표준 — sm은 모달·폼 필드(h-10), md는 페이지 폼(마법사·설정)의 큰 필드.
const inputSizes: Record<InputSize, string> = {
  sm: 'h-10 rounded-lg px-3 text-[13px]',
  md: 'rounded-[10px] px-4 py-3 text-[14px]',
}

// display·크기·테두리 색 제외 공통 스타일. box-shadow 는 inputBorders 가 담당한다
// (전역 base 의 링을 끄면서 동시에 포커스 강조 inset 을 그린다 — 같은 속성이라 한 곳에서 관리).
export const inputBase =
  'bg-surface text-fg placeholder:text-fg-subtle w-full border outline-none'

// 테두리 색은 invalid 상태와 상호배타로 합성한다 — cn이 단순 join이라 색 클래스가 공존하면 CSS 순서에 좌우됨.
//
// 포커스 시 테두리 안쪽에 같은 색 1px 을 inset 그림자로 덧그려
// 1px 테두리를 시각적으로 2px 로 키운다. WCAG 2.4.11(Focus Appearance)의 최소 두께 권고 대응.
// inset 그림자라 박스 크기·내용 위치가 전혀 움직이지 않는다(focus:border-2 는 콘텐츠가 밀린다).
// 이 값이 전역 base 의 포커스 링도 함께 덮어쓴다(같은 box-shadow 속성, utilities 레이어가 base 를 이긴다).
// Tailwind v4 는 shadow-[inset_…] 대신 inset-shadow-* 를 쓰므로 임의 속성 문법으로 직접 지정한다.
const inputBorders = {
  normal:
    'border-border focus:border-brand focus-visible:[box-shadow:inset_0_0_0_1px_var(--color-brand)]',
  invalid:
    'border-danger focus:border-danger focus-visible:[box-shadow:inset_0_0_0_1px_var(--color-danger)]',
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
