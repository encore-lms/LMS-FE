import { cn } from '@/shared/lib/cn'

// 공통 페이지네이션 — "N건 중 M건 표시" + 이전/페이지/다음 버튼.
// 표가 길어지지 않도록 목록/이력 테이블에서 재사용한다.
// (student MaterialPagination과 동일 UX — 추후 통합 검토)
export function Pagination({
  page,
  pageCount,
  totalCount,
  shownCount,
  onPage,
  className,
}: {
  /** 현재 페이지 (1-base) */
  page: number
  /** 전체 페이지 수 */
  pageCount: number
  /** 전체 건수 */
  totalCount: number
  /** 현재 페이지에 표시된 건수 */
  shownCount: number
  onPage: (p: number) => void
  className?: string
}) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1)
  const btn =
    'flex size-9 items-center justify-center rounded-lg text-[12px] font-medium disabled:opacity-40'
  return (
    <div
      className={cn(
        'flex w-full items-center justify-between gap-2',
        className,
      )}
    >
      <p className="text-fg-muted text-[12px] font-medium">
        {totalCount}건 중 {shownCount}건 표시
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="이전"
            disabled={page <= 1}
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
            disabled={page >= pageCount}
            onClick={() => onPage(Math.min(pageCount, page + 1))}
            className={cn(btn, 'border-border text-fg-muted border')}
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
