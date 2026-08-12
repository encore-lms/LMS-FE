import { useCallback, useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { AttendanceIssue } from '@/shared/types'
import { AttendanceAttachmentLinks } from './AttendanceAttachmentLinks'

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
  const [open, setOpen] = useState(false)
  /**
   * 닫기를 잠깐 미룬다.
   *
   * <p>아이콘과 말풍선 사이에는 빈 공간이 있어서, 증빙을 내려받으려고 마우스를 내리는 순간
   * 아이콘을 벗어나며 말풍선이 닫혀 버렸다. 그 사이를 지나갈 시간을 준다.</p>
   */
  const closeTimer = useRef<number | null>(null)
  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])
  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null
      setOpen(false)
    }, 220)
  }, [cancelClose])
  useEffect(() => cancelClose, [cancelClose])

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
        onMouseEnter={() => {
          cancelClose()
          setOpen(true)
        }}
        onMouseLeave={scheduleClose}
        onFocus={() => {
          cancelClose()
          setOpen(true)
        }}
        onBlur={scheduleClose}
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
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          // 아이콘 바로 아래에 붙이고 위쪽에 투명 여백을 둬, 마우스가 빈 공간을 지나지 않게 한다.
          className="border-border bg-surface absolute top-full left-0 z-20 mt-1 flex w-72 flex-col gap-2 rounded-[10px] border p-3 text-left shadow-[0px_8px_24px_0px_rgba(18,23,38,0.14)] before:absolute before:-top-2 before:left-0 before:h-2 before:w-full before:content-['']"
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
            <AttendanceAttachmentLinks files={files} emptyText="첨부 없음" />
          </span>
        </span>
      )}
    </span>
  )
}
