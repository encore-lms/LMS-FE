import { cn } from '@/shared/lib/cn'
import type { MaterialFileType } from '../../types'

// 자료 형식 아이콘 박스 — 형식별 배경/아이콘. (LINK는 링크 아이콘, 그 외는 문서 아이콘)
const BOX: Record<MaterialFileType, string> = {
  PDF: 'bg-danger-bg text-danger',
  DOC: 'bg-info-bg text-info',
  ZIP: 'bg-warning-bg text-warning',
  LINK: 'bg-accent-bg text-accent-strong',
  IMG: 'bg-success-bg text-success',
  VIDEO: 'bg-accent-bg text-accent-strong',
}

const DocGlyph = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="size-5"
  >
    <path
      d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
      strokeLinejoin="round"
    />
    <path d="M14 3v5h5" strokeLinejoin="round" />
  </svg>
)

const LinkGlyph = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="size-5"
  >
    <path
      d="M9 15l6-6M10.5 6.5l1.2-1.2a3.5 3.5 0 0 1 5 5l-1.2 1.2M13.5 17.5l-1.2 1.2a3.5 3.5 0 0 1-5-5l1.2-1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export function FileTypeIcon({ fileType }: { fileType: MaterialFileType }) {
  return (
    <div
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-[10px]',
        BOX[fileType],
      )}
    >
      {fileType === 'LINK' ? LinkGlyph : DocGlyph}
    </div>
  )
}
