import { cn } from '@/shared/lib/cn'

// 자료실 페이지네이션 — "N건 중 M건 표시" + 페이지 버튼. (mock은 1페이지라 표시 위주)
export function MaterialPagination({
  shownCount,
  totalCount,
  pageCount,
  page,
  onPage,
}: {
  shownCount: number
  totalCount: number
  pageCount: number
  page: number
  onPage: (p: number) => void
}) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1)
  const btn =
    'flex size-9 items-center justify-center rounded-lg text-[12px] font-medium'
  return (
    <div className="flex w-full items-center justify-between">
      <p className="text-fg-muted text-[12px] font-medium">
        {totalCount}건 중 {shownCount}건 표시
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="이전"
          onClick={() => onPage(Math.max(1, page - 1))}
          className={cn(btn, 'border-border text-fg-muted border')}
        >
          ‹
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              btn,
              p === page
                ? 'bg-brand-deep text-white'
                : 'border-border text-fg-muted border',
            )}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          aria-label="다음"
          onClick={() => onPage(Math.min(pageCount, page + 1))}
          className={cn(btn, 'border-border text-fg-muted border')}
        >
          ›
        </button>
      </div>
    </div>
  )
}
