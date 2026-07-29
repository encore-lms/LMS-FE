import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

// 출결 화면 기본 액션 버튼 — navy 정본(bg-brand-deep · h-42 · rounded-10 · 14px SemiBold).
// 색은 공통 Button primary(navy)와 통일(사용자 결정 2026-07-09). h-42 사이즈만 도메인 전용이라 래퍼 유지.
// (색은 raw hex 금지 → bg-brand-deep 토큰.)
export function AttendanceActionButton({
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        'bg-brand-deep hover:bg-brand-deep/90 inline-flex h-[42px] items-center justify-center gap-2 rounded-[10px] px-[18px] text-[14px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
