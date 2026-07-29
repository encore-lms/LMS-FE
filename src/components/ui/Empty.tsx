import { type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface EmptyProps {
  /** 상단 아이콘/일러스트 슬롯 (svg 권장, 자동으로 40px·fg-subtle 색 적용) */
  icon?: ReactNode
  title: string
  description?: ReactNode
  /** 하단 액션 슬롯 (재시도 버튼, 문의 링크 등) */
  action?: ReactNode
  className?: string
}

/**
 * 빈 목록·검색 결과 없음·오류 후 재시도 등 "데이터 없음" 상태 공통 표시.
 * 화면이 깨지지 않도록(화면 구현 목록 §완료 기준 "상태") 모든 목록/테이블의 fallback 으로 쓴다.
 */
export function Empty({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <div className="text-fg-subtle [&>svg]:h-10 [&>svg]:w-10">{icon}</div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-fg text-[15px] font-bold">{title}</p>
        {description && <p className="text-fg-muted text-sm">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
