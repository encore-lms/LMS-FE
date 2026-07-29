import { cn } from '@/shared/lib/cn'
import type { MaterialFileType, MaterialItem } from '../../types'
import { FileTypeIcon } from './FileTypeIcon'

// 자료 한 줄 — 형식 아이콘 · 제목/형식·분류 배지 · 메타(작성자·시각·다운로드·용량) · 즐겨찾기.
// 행 전체가 상세를 여는 버튼이다. 다운로드·링크 열기·미리보기·삭제는 상세 모달로 모았다 —
// 목록에 버튼이 늘어서 있으면 내용을 보기도 전에 무엇을 누를지 골라야 했다.
const TYPE_PILL: Record<MaterialFileType, string> = {
  PDF: 'bg-danger-bg text-danger',
  DOC: 'bg-info-bg text-info',
  ZIP: 'bg-warning-bg text-warning',
  LINK: 'bg-accent-bg text-accent-strong',
  IMG: 'bg-success-bg text-success',
  VIDEO: 'bg-accent-bg text-accent-strong',
}

function Sep() {
  return <span className="bg-border h-3 w-px shrink-0" />
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6L12 16.8 6.6 19.6l1-6L3.3 9.4l6-.9L12 3Z"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MaterialRow({
  item,
  onToggleFavorite,
  onOpen,
}: {
  item: MaterialItem
  onToggleFavorite: (id: string) => void
  /** 행 클릭 — 상세 모달을 연다. */
  onOpen: (item: MaterialItem) => void
}) {

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(item)
        }
      }}
      className="hover:bg-surface-muted flex w-full cursor-pointer items-center gap-3.5 px-6 py-3.5 text-left transition-colors">
      <FileTypeIcon fileType={item.fileType} />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-fg text-[14px] font-semibold">
            {item.title}
          </span>
          <span
            className={cn(
              'rounded-[4px] px-1.5 py-px text-[10px] font-bold tracking-[0.04em]',
              TYPE_PILL[item.fileType],
            )}
          >
            {item.fileType}
          </span>
        </div>
        {item.body && (
          <p className="text-fg-muted text-[12px] leading-relaxed whitespace-pre-wrap">
            {item.body}
          </p>
        )}
        <div className="text-fg-subtle flex items-center gap-3 text-[11px]">
          <span className="text-fg-muted font-medium">{item.author}</span>
          <Sep />
          <span>{item.timeAgo}</span>
          {item.downloadCount != null && (
            <>
              <Sep />
              <span className="flex items-center gap-0.5">
                <svg
                  viewBox="0 0 24 24"
                  className="size-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M12 4v12m0 0 4-4m-4 4-4-4M5 20h14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {item.downloadCount}
              </span>
            </>
          )}
          {item.sizeLabel && (
            <>
              <Sep />
              <span>{item.sizeLabel}</span>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          // 행 클릭(상세 열기)과 겹치지 않게 막는다.
          e.stopPropagation()
          onToggleFavorite(item.id)
        }}
        aria-label={item.favorited ? '즐겨찾기 해제' : '즐겨찾기'}
        aria-pressed={item.favorited}
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          item.favorited
            ? 'bg-warning-bg text-warning'
            : 'border-border text-fg-subtle border',
        )}
      >
        <StarIcon filled={item.favorited} />
      </button>

    </div>
  )
}
