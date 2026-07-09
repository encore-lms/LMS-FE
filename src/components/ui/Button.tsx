import { forwardRef, type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary=주요 CTA(딥 브랜드) · secondary=보조(테두리) · danger=파괴적 · ghost=3차(배경 없음) */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  /** sm=조밀한 인라인 액션 · md=기본(목록 헤더·모달 등) · lg=히어로 CTA(로그인 등) */
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-brand-deep text-white hover:bg-brand-deep/90',
  secondary: 'bg-white text-fg border border-border hover:bg-surface-muted',
  danger: 'bg-danger text-on-color hover:bg-danger/90',
  ghost: 'text-fg hover:bg-surface-muted',
}

// 크기 표준 — 화면마다 className으로 h-*를 덮어쓰며 파편화되던 것을 size로 통일.
// 기본(md)은 기존에 가장 널리 쓰이던 h-10·text-sm 조합이다(레이아웃 회귀 최소).
const sizes = {
  sm: 'h-9 rounded-lg px-3 text-[13px] font-semibold',
  md: 'h-10 rounded-[10px] px-4 text-sm font-semibold',
  lg: 'h-14 rounded-[11px] px-5 text-[15px] font-bold',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      className = '',
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
        className={`focus-visible:ring-brand flex items-center justify-center gap-2 transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
        {...rest}
      >
        {children}
      </button>
    )
  },
)
