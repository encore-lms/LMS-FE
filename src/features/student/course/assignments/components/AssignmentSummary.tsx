import { Download, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { apiClient } from '@/shared/api'
import { useToast } from '@/components/ui/use-toast'
import type {
  AssignmentDetail,
  AssignmentFileRef,
  AssignmentStatus,
  DueTone,
} from '../types'
import { STATUS_BADGE } from '../meta'

// 과제 상세 요약 — 제목·설명 / 마감·제출 상태 / 마감·평가방식 배지.
// 카드 박스 없이 문서처럼 흐르는 플랫 레이아웃(2026-08-11 참조 이미지 정본).
const DUE_BADGE: Record<DueTone, string> = {
  soon: 'bg-warning-bg text-warning',
  normal: 'bg-warning-bg text-warning',
  ended: 'bg-surface-muted text-fg-subtle',
}

// 우측 '제출 상태' 텍스트 색 — 배지와 같은 톤을 글자에만 입힌다.
const STATUS_TEXT: Record<AssignmentStatus, string> = {
  not_submitted: 'text-warning',
  submitted: 'text-brand',
  supplement_requested: 'text-danger',
  reviewed: 'text-info',
}

export function AssignmentSummary({
  detail,
  status,
}: {
  detail: AssignmentDetail
  status?: AssignmentStatus // 제출 후 갱신된 유효 상태(미지정 시 detail.status)
}) {
  const effectiveStatus = status ?? detail.status
  const toast = useToast()
  const urls = detail.urls ?? []
  const files = detail.files ?? []
  const hasAttachments = urls.length > 0 || files.length > 0

  // 강사 첨부 파일 다운로드(인증 blob).
  const downloadFile = async (f: AssignmentFileRef) => {
    try {
      const blob = await apiClient.getBlob(f.downloadUrl)
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = f.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(href)
    } catch {
      toast.danger('파일을 내려받지 못했어요')
    }
  }

  return (
    // 옅은 brand 틴트 배경 — 테두리 없이 배경으로만 구분한다(참조 이미지 정본).
    <section className="bg-brand/[0.04] flex items-start justify-between gap-6 rounded-2xl p-7">
      <div className="flex min-w-0 flex-1 flex-col gap-3.5">
        <h2 className="text-fg text-[22px] font-bold">{detail.title}</h2>
        <p className="text-fg text-[14px] leading-6">{detail.description}</p>
        {hasAttachments && (
          <div className="flex flex-col gap-1.5">
            <span className="text-fg text-[12px] font-bold">첨부 자료</span>
            <div className="flex flex-wrap gap-2">
              {urls.map((url, i) => (
                <a
                  key={`u-${i}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-surface-muted text-brand inline-flex max-w-[280px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:underline"
                >
                  <LinkIcon className="size-3.5 shrink-0" />
                  <span className="truncate">{url}</span>
                </a>
              ))}
              {files.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => downloadFile(f)}
                  className="bg-surface-muted text-fg-muted hover:text-brand inline-flex max-w-[280px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                >
                  <Download className="size-3.5 shrink-0" />
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={cn(
              'rounded-md px-2 py-[3px] text-[11px] font-semibold',
              DUE_BADGE[detail.dueTone],
            )}
          >
            {detail.dueBadge}
          </span>
          <span className="bg-surface-muted text-fg-muted rounded-md px-2 py-[3px] text-[11px] font-semibold">
            {detail.evaluationType}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
        <span className="text-fg text-[14px] font-bold">
          마감 {detail.dueAtLabel}
        </span>
        <span
          className={cn(
            'text-[13px] font-medium',
            STATUS_TEXT[effectiveStatus],
          )}
        >
          제출 상태: {STATUS_BADGE[effectiveStatus].label}
        </span>
      </div>
    </section>
  )
}
