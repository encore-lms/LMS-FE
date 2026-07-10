import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary=주요 CTA(딥 브랜드) · secondary=보조(테두리) · danger=파괴적 · ghost=3차(배경 없음) */
  variant?: ButtonVariant
  /** sm=조밀한 인라인 액션 · md=기본(목록 헤더·모달 등) · lg=히어로 CTA(로그인 등) */
  size?: ButtonSize
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-deep text-white hover:bg-brand-deep/90',
  secondary: 'bg-white text-fg border border-border hover:bg-surface-muted',
  danger: 'bg-danger text-on-color hover:bg-danger/90',
  ghost: 'text-fg hover:bg-surface-muted',
}

// 크기 표준 — 화면마다 className으로 h-*를 덮어쓰며 파편화되던 것을 size로 통일.
// 기본(md)은 기존에 가장 널리 쓰이던 h-10·text-sm 조합이다(레이아웃 회귀 최소).
const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-lg px-3 text-[13px] font-semibold',
  md: 'h-10 rounded-[10px] px-4 text-sm font-semibold',
  lg: 'h-14 rounded-[11px] px-5 text-[15px] font-bold',
}

// display 제외 공통 스타일 — <Button>은 flex, buttonClass(비-button 요소)는 inline-flex로 합성.
const base =
  'focus-visible:ring-brand items-center justify-center gap-2 transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50'

interface ButtonClassOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/**
 * 버튼 스타일 클래스 — <button>이 아닌 요소(내비게이션용 <Link> 등)에 동일한 버튼 룩을 입힐 때 사용.
 * <Button>과 같은 정본 스타일을 공유해 "버튼처럼 생긴 링크"의 파편화를 막는다.
 * inline-flex라 인라인 흐름(검색바 우측 등)에서 가로로 늘어나지 않는다.
 *
 * @example <Link to="/x" className={buttonClass()}>새 항목</Link>
 */
export function buttonClass({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonClassOptions = {}): string {
  return cn('inline-flex', base, sizes[size], variants[variant], className)
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      className,
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn('flex', base, sizes[size], variants[variant], className)}
        {...rest}
      >
        {children}
      </button>
    )
  },
)
