import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'
import {
  buttonBase,
  buttonSizes,
  buttonVariants,
  type ButtonSize,
  type ButtonVariant,
} from './buttonClass'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary=주요 CTA(딥 브랜드) · secondary=보조(테두리) · danger=파괴적 · ghost=3차(배경 없음) */
  variant?: ButtonVariant
  /** sm=조밀한 인라인 액션 · md=기본(목록 헤더·모달 등) · lg=히어로 CTA(로그인 등) */
  size?: ButtonSize
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
        className={cn(
          'flex',
          buttonBase,
          buttonSizes[size],
          buttonVariants[variant],
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    )
  },
)
