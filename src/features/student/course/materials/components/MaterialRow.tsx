import { cn } from '@/shared/lib/cn'
import type {
  MaterialCategory,
  MaterialFileType,
  MaterialItem,
} from '../../types'
import { FileTypeIcon } from './FileTypeIcon'

// 자료 한 줄 — 형식 아이콘 · 제목/형식·분류 배지 · 메타(작성자·시각·다운로드·용량) · 즐겨찾기 · 액션.
const TYPE_PILL: Record<MaterialFileType, string> = {
  PDF: 'bg-danger-bg text-danger',
  DOC: 'bg-info-bg text-info',
  ZIP: 'bg-warning-bg text-warning',
  LINK: 'bg-accent-bg text-accent-strong',
  IMG: 'bg-success-bg text-success',
  VIDEO: 'bg-accent-bg text-accent-strong',
}

const CATEGORY_PILL: Record<MaterialCategory, { cls: string; label: string }> =
  {
    lecture: { cls: 'bg-brand/10 text-brand', label: '강의 자료' },
    practice: { cls: 'bg-success-bg text-success', label: '실습' },
    reference: { cls: 'bg-info-bg text-info', label: '참고' },
    shared: { cls: 'bg-accent-bg text-accent-strong', label: '학생 공유' },
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
}: {
  item: MaterialItem
  onToggleFavorite: (id: string) => void
}) {
  const cat = CATEGORY_PILL[item.category]
  return (
    <div className="flex w-full items-center gap-3.5 px-6 py-3.5">
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
          <span
            className={cn(
              'rounded-[4px] px-1.5 py-px text-[10px] font-bold',
              cat.cls,
            )}
          >
            {cat.label}
          </span>
        </div>
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
        onClick={() => onToggleFavorite(item.id)}
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

      <div className="flex shrink-0 items-center gap-1.5">
        {item.canPreview && (
          <button
            type="button"
            className="border-border text-fg-muted rounded-lg border px-3.5 py-[7px] text-[12px] font-medium"
          >
            미리보기
          </button>
        )}
        <button
          type="button"
          className="bg-brand rounded-lg px-3.5 py-[7px] text-[12px] font-bold text-white"
        >
          {item.isExternalLink ? '링크 열기' : '다운로드'}
        </button>
      </div>
    </div>
  )
}
