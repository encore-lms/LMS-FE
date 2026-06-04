import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

// 프로필 teal 액션 버튼 — Figma 기준(brand · 14px SemiBold). 공유 Button(navy)과 색이 달라 기능 로컬로 둠.
export function ProfileActionButton({
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        'bg-brand hover:bg-brand/90 inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-[14px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
