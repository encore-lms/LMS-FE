import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

// 테스트/데모 전용 네비게이션 바 (FE 목) — BE 연동 시 사용처와 함께 제거한다.
// 보라(accent) 테스트 색 + "🧪 테스트 버전" 배지로 정식 UI와 명확히 구분한다.
// 데모 시뮬레이션 컨트롤(멘토 배정 전/후, 증명서 인증 요청 흐름 등)을 children 으로 받는다.
export function TestModeBar({
  note,
  children,
  className,
}: {
  /** 배지 옆 보조 설명(무엇을 시뮬레이션하는지) */
  note?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'border-accent-strong/40 bg-accent-bg flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed px-3 py-2',
        className,
      )}
    >
      <span className="bg-accent-strong inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-white">
        🧪 테스트 버전
      </span>
      {note && (
        <span className="text-accent-strong text-[11px] font-semibold">
          {note}
        </span>
      )}
      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  )
}
