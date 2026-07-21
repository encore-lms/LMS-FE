import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * 클릭 가능한 카드 공용 컴포넌트 — 프로젝트 카드의 인터랙션을 정본으로 통일.
 * 평소엔 flat, 호버 시 배경(surface-muted) 전환 + pointer 커서 + 키보드(Enter/Space)·포커스 링.
 *
 * 내부에 실제 <button>(액션)이 들어갈 수 있어 <div role="button">으로 렌더한다
 * (중첩 button 방지). 내부 액션은 stopPropagation으로 카드 클릭과 분리할 것.
 * radius·패딩·레이아웃은 호출부 className으로 지정한다(cn은 단순 join이라 기본값과 충돌 방지).
 *
 * @example
 * <InteractiveCard onOpen={() => open(item)} ariaLabel={`${item.title} 상세 보기`}
 *   className="flex flex-col gap-3 rounded-2xl p-5">
 *   …
 * </InteractiveCard>
 */
export function InteractiveCard({
  onOpen,
  ariaLabel,
  className,
  children,
}: {
  onOpen: () => void
  ariaLabel?: string
  className?: string
  children: ReactNode
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen()
    }
  }
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      className={cn(
        'hover:bg-surface-muted focus-visible:ring-brand/40 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    >
      {children}
    </div>
  )
}
