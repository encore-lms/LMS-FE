import { useState } from 'react'
import { Download, Info } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useToast } from '@/components/ui/use-toast'
import { downloadAttendanceAttachment } from '@/features/student/api/attendance'
import type { AttendanceIssue } from '@/shared/types'

// 출결 이슈 칸 — 유형은 바로 보이고, 사유·증빙은 아이콘에 마우스를 올리면 편다.
// 그동안 운영 화면에는 수강생이 낸 출결 폼과 증빙을 볼 자리가 아예 없었다.
const TONE: Record<string, string> = {
  late: 'bg-warning-bg text-warning',
  early_leave: 'bg-info-bg text-info',
  outing: 'bg-info-bg text-info',
  absent: 'bg-danger-bg text-danger',
}

export function AttendanceIssueCell({
  issue,
}: {
  issue?: AttendanceIssue | null
}) {
  const toast = useToast()
  const [open, setOpen] = useState(false)

  if (!issue) return <span className="text-fg-subtle">-</span>

  const files = issue.attachments ?? []
  return (
    <span className="relative flex items-center gap-1.5">
      <span
        className={cn(
          'rounded-md px-2 py-0.5 text-[11px] font-bold',
          TONE[issue.type] ?? 'bg-surface-muted text-fg-muted',
        )}
      >
        {issue.typeLabel}
      </span>
      {issue.officialLeaveUsed && (
        <span className="bg-success-bg text-success rounded-md px-1.5 py-0.5 text-[10px] font-bold">
          공가
        </span>
      )}

      <button
        type="button"
        aria-label="출결 폼 상세"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="text-fg-subtle hover:text-fg"
      >
        <Info className="size-3.5" />
      </button>

      {open && (
        <span
          role="tooltip"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="border-border bg-surface absolute top-6 left-0 z-20 flex w-72 flex-col gap-2 rounded-[10px] border p-3 text-left shadow-[0px_8px_24px_0px_rgba(18,23,38,0.14)]"
        >
          <span className="text-fg-subtle text-[11px]">
            제출 {issue.submittedAt.slice(0, 16).replace('T', ' ')}
          </span>
          <span className="text-fg text-[12px] leading-5 whitespace-pre-wrap">
            {issue.reason?.trim() || '사유 없음'}
          </span>

          <span className="border-divider flex flex-col gap-1 border-t pt-2">
            <span className="text-fg-subtle text-[11px] font-semibold">
              증빙 {files.length}개
            </span>
            {files.length === 0 ? (
              <span className="text-fg-subtle text-[11px]">첨부 없음</span>
            ) : (
              files.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    downloadAttendanceAttachment(f.id, f.fileName).catch(() =>
                      toast.danger('증빙을 내려받지 못했어요'),
                    )
                  }}
                  className="text-info flex items-center gap-1 text-left text-[11px] font-semibold hover:underline"
                >
                  <Download className="size-3 shrink-0" />
                  <span className="truncate">{f.fileName}</span>
                </button>
              ))
            )}
          </span>
        </span>
      )}
    </span>
  )
}
