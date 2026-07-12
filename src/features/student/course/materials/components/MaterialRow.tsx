import { cn } from '@/shared/lib/cn'
import { useToast } from '@/components/ui/use-toast'
import { buttonClass } from '@/components/ui/buttonClass'
import { downloadCourseMaterialFile } from '../../../api/course'
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

// 다운로드 파일명 확장자 — 제목 + 형식으로 저장 파일명을 만든다.
const FILE_EXT: Record<MaterialFileType, string> = {
  PDF: 'pdf',
  DOC: 'docx',
  ZIP: 'zip',
  IMG: 'png',
  VIDEO: 'mp4',
  LINK: '',
}

function openInNewTab(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

// 같은 출처(public/materials/*) 파일은 download 속성으로 저장된다.
function downloadFile(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
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
  onDelete,
}: {
  item: MaterialItem
  onToggleFavorite: (id: string) => void
  /** 본인이 올린 학생 공유 자료에만 삭제 노출(없으면 버튼 숨김) */
  onDelete?: (item: MaterialItem) => void
}) {
  const toast = useToast()
  const cat = CATEGORY_PILL[item.category]
  // 업로드 파일(hasFile)은 다운로드 엔드포인트로, 외부 링크/public 파일은 fileUrl로 동작.
  const hasFile = !!item.hasFile || !!item.fileUrl

  const handlePreview = () => {
    if (item.fileUrl) openInNewTab(item.fileUrl)
  }
  const handleDownloadOrOpen = async () => {
    if (item.hasFile) {
      try {
        await downloadCourseMaterialFile(
          item.id,
          item.fileName ?? `${item.title}.${FILE_EXT[item.fileType] || 'dat'}`,
        )
      } catch {
        toast.danger('파일 다운로드에 실패했어요')
      }
      return
    }
    if (!item.fileUrl) return
    if (item.isExternalLink) {
      openInNewTab(item.fileUrl)
    } else {
      downloadFile(item.fileUrl, `${item.title}.${FILE_EXT[item.fileType]}`)
    }
  }

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
            onClick={handlePreview}
            disabled={!hasFile}
            className="border-border text-fg-muted rounded-lg border px-3.5 py-[7px] text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            미리보기
          </button>
        )}
        <button
          type="button"
          onClick={handleDownloadOrOpen}
          disabled={!hasFile}
          className={buttonClass({ size: 'sm' })}
        >
          {item.isExternalLink ? '링크 열기' : '다운로드'}
        </button>
        {item.ownedByMe && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="border-border text-danger hover:bg-danger-bg rounded-lg border px-3.5 py-[7px] text-[12px] font-medium"
          >
            삭제
          </button>
        )}
      </div>
    </div>
  )
}
