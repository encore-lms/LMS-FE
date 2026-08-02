import { Download, ExternalLink, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useToast } from '@/components/ui/use-toast'
import {
  downloadNoticeAttachment,
  type NoticeFile,
  type NoticeLink,
} from '@/shared/api'

// 공지에 붙은 링크·파일 줄 — 수강생 공지 목록과 강사·매니저 공지 관리가 같은 모양을 쓴다.
// 내려받기 경로만 역할에 따라 갈린다(BE 가 /student/** 를 STUDENT 로 잠가 둔다).

function fileSizeLabel(bytes: number | null) {
  if (bytes === null || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export function NoticeAttachmentList({
  links,
  files,
  scope = 'student',
  onRemove,
  className,
}: {
  links: NoticeLink[]
  files: NoticeFile[]
  scope?: 'student' | 'staff'
  /** 주면 각 첨부에 삭제 버튼이 붙는다(글을 지울 수 있는 사람에게만). */
  onRemove?: (attachmentId: string) => void
  className?: string
}) {
  const toast = useToast()

  if (links.length === 0 && files.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {links.map((l) => (
        <span
          key={l.id}
          className="border-border text-info flex min-w-0 max-w-full items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold"
        >
          <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
          <a
            href={l.url}
            target="_blank"
            rel="noreferrer noopener"
            className="truncate hover:underline"
          >
            {l.url}
          </a>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(l.id)}
              aria-label={`${l.url} 첨부 삭제`}
              className="text-fg-subtle hover:text-danger shrink-0"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </span>
      ))}

      {files.map((f) => (
        <span
          key={f.id}
          className="border-border text-fg flex min-w-0 max-w-full items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold"
        >
          <button
            type="button"
            onClick={() =>
              downloadNoticeAttachment(f.id, f.fileName, scope).catch(() =>
                toast.danger('첨부를 내려받지 못했어요'),
              )
            }
            aria-label={`${f.fileName} 내려받기`}
            className="flex min-w-0 items-center gap-1 hover:underline"
          >
            <Download className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{f.fileName}</span>
          </button>
          {fileSizeLabel(f.fileSize) && (
            <span className="text-fg-subtle shrink-0 font-medium">
              {fileSizeLabel(f.fileSize)}
            </span>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(f.id)}
              aria-label={`${f.fileName} 첨부 삭제`}
              className="text-fg-subtle hover:text-danger shrink-0"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </span>
      ))}
    </div>
  )
}
