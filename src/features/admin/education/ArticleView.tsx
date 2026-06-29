import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'

export interface ArticleBadge {
  label: string
  className: string
}

// 블로그 포스트형 상세 뷰 — 모달 대신 본문을 넓게 읽도록. 자료실·과제 상세 공용.
export function ArticleView({
  onBack,
  badges,
  title,
  metaItems,
  body,
  bodyEmptyText = '본문이 없습니다.',
  footer,
}: {
  onBack: () => void
  badges?: ArticleBadge[]
  title: string
  /** 작성자 · 날짜 등 헤더 메타(점으로 구분) */
  metaItems: string[]
  body: string | null
  bodyEmptyText?: string
  /** 첨부 파일·링크·마감 등 본문 하단 영역 */
  footer?: ReactNode
}) {
  return (
    <article className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={onBack}
        className="text-fg-muted hover:text-fg mb-4 inline-flex items-center gap-1 text-sm font-medium"
      >
        <ChevronLeft className="h-4 w-4" /> 목록으로
      </button>

      <header className="border-divider border-b pb-5">
        {badges && badges.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <span
                key={b.label}
                className={
                  'rounded-[4px] px-2 py-0.5 text-[11px] font-bold ' +
                  b.className
                }
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
        <h1 className="text-fg text-[26px] leading-snug font-bold tracking-tight">
          {title}
        </h1>
        <div className="text-fg-muted mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
          {metaItems.map((m, i) => (
            <span key={m} className="flex items-center gap-2">
              {i > 0 && <span className="bg-border h-3 w-px" />}
              <span>{m}</span>
            </span>
          ))}
        </div>
      </header>

      <div className="text-fg py-6 text-[15px] leading-7 break-words whitespace-pre-wrap">
        {body && body.trim() ? (
          body
        ) : (
          <span className="text-fg-subtle italic">{bodyEmptyText}</span>
        )}
      </div>

      {footer && <div className="border-divider border-t pt-5">{footer}</div>}
    </article>
  )
}
