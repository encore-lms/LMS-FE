import { forwardRef, type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

const variants = {
  primary: 'bg-brand-deep text-white hover:bg-brand-deep/90',
  secondary: 'bg-white text-fg border border-border hover:bg-surface-muted',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', className = '', children, type = 'button', ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={`flex h-14 items-center justify-center gap-2 rounded-[11px] px-5 py-4 text-[15px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
        {...rest}
      >
        {children}
      </button>
    )
  },
)
