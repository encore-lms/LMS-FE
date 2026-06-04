import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

// 출결 화면 기본 액션 버튼 — Figma '공통 Button' teal 변형 기준(teal · h-42 · rounded-10 · 14px SemiBold).
// 공유 Button(primary=brand-deep navy)과 색·크기가 달라 도메인 전용으로 둔다.
// (공유 Button 변경은 앱 전역 영향 + 페어 합의 영역이라 건드리지 않음. 색은 raw hex 금지 → bg-brand 토큰.)
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
        'bg-brand hover:bg-brand/90 inline-flex h-[42px] items-center justify-center gap-2 rounded-[10px] px-[18px] text-[14px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
