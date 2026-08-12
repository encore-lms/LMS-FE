import { Download } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useToast } from '@/components/ui/use-toast'
import { downloadAttendanceAttachment } from '@/shared/api/attendance'
import type { AttendanceIssueAttachment } from '@/shared/types'

// 출결 증빙 내려받기 줄 — 출결 탭(이슈 말풍선)과 출결 폼 탭(증빙 칸)이 같은 모양을 쓴다.
// 운영 경로로 받는다(수강생 경로는 BE 가 STUDENT 로 잠가 두어 매니저는 403).

export function AttendanceAttachmentLinks({
  files,
  className,
  emptyText = '없음',
}: {
  files: AttendanceIssueAttachment[]
  className?: string
  emptyText?: string
}) {
  const toast = useToast()

  if (files.length === 0) {
    return <span className="text-fg-subtle text-xs">{emptyText}</span>
  }

  return (
    <span className={cn('flex min-w-0 flex-col gap-1', className)}>
      {files.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            downloadAttendanceAttachment(f.id, f.fileName, 'admin').catch(() =>
              toast.danger('증빙을 내려받지 못했어요'),
            )
          }}
          aria-label={`${f.fileName} 내려받기`}
          className="text-info flex min-w-0 items-center gap-1 text-left text-xs font-semibold hover:underline"
        >
          <Download className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{f.fileName}</span>
        </button>
      ))}
    </span>
  )
}
