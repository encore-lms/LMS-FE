import {
  AlertCircle,
  Check,
  Coins,
  ExternalLink,
  MessageSquare,
  Paperclip,
  XCircle,
} from 'lucide-react'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import type {
  RecordCategory,
  RecordDecision,
  RecordReviewItem,
  RecordReviewStatus,
} from '@/shared/types'

// 큐·상세 공용 메타 — RecordReviewQueuePage에서 기계적 추출(렌더 결과 불변).
export const CATEGORY_META: Record<
  RecordCategory,
  { label: string; record: string }
> = {
  blog: { label: '블로그', record: 'BlogRecord' },
  study: { label: '스터디', record: 'StudyRecord' },
  certificate: { label: '자격증', record: 'CertificateRecord' },
}

export const STATUS_META: Record<
  RecordReviewStatus,
  { label: string; tone: BadgeTone }
> = {
  pending: { label: '대기', tone: 'neutral' },
  changes_requested: { label: '보완 요청', tone: 'warning' },
}

// 선택 행 인라인 미리보기 — Record·BlogRecord/StudyRecord/CertificateRecord 적응형.
// 승인 시 사유 선택, 반려·보완 요청 시 사유 필수(§22). (Figma 1507:10816 "pv" 패널)
export function PreviewPane({
  item,
  reason,
  onReason,
  onDecide,
}: {
  item: RecordReviewItem | null
  reason: string
  onReason: (v: string) => void
  onDecide: (d: RecordDecision) => void
}) {
  if (!item) {
    return (
      <div className="border-border bg-surface rounded-xl border">
        <Empty
          title="검토할 행을 선택하세요"
          description="좌측 큐에서 행을 클릭하면 제출 내용과 결정 영역이 표시됩니다."
        />
      </div>
    )
  }

  const meta = CATEGORY_META[item.category]
  const hasReason = reason.trim().length > 0

  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border">
      <div className="border-divider flex items-start justify-between border-b p-4">
        <div>
          <p className="text-fg font-bold">선택 행 미리보기</p>
          <p className="text-fg-subtle text-xs">
            Record · {meta.record} · 강사 코멘트 표시
          </p>
        </div>
        <StatusBadge label={meta.label} tone="neutral" />
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={item.student.name} />
          <div className="flex flex-col">
            <span className="text-fg text-sm font-medium">
              {item.student.name} · {item.student.cohort}
            </span>
            <span className="text-fg-subtle text-xs">
              submittedAt {item.submittedAt}
            </span>
          </div>
        </div>

        <p className="text-fg text-base font-bold">{item.title}</p>

        {item.externalUrl && (
          <a
            href={`https://${item.externalUrl}`}
            target="_blank"
            rel="noreferrer"
            className="text-brand flex items-center gap-1.5 text-xs break-all hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            {item.externalUrl}
          </a>
        )}

        <div className="bg-surface-muted flex flex-col gap-2 rounded-lg p-3">
          {item.body.map((p) => (
            <p key={p} className="text-fg-muted text-xs leading-relaxed">
              {p}
            </p>
          ))}
        </div>

        {item.mileageCandidate && (
          <p className="text-success flex items-center gap-1.5 text-xs font-medium">
            <Coins className="h-3.5 w-3.5" />
            {item.mileageCandidate}
          </p>
        )}

        {item.attachments.length > 0 && (
          <div>
            <p className="text-fg-subtle mb-1.5 flex items-center gap-1.5 text-xs">
              <Paperclip className="h-3.5 w-3.5" />
              RecordAttachment {item.attachments.length}건
            </p>
            <ul className="flex flex-col gap-1.5">
              {item.attachments.map((a) => (
                <li
                  key={a.name}
                  className="border-border flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <span className="text-fg text-xs">{a.name}</span>
                  <span className="text-fg-subtle text-xs">{a.meta}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {item.instructorNote && (
          <div className="bg-info-bg rounded-lg p-3">
            <p className="text-fg flex items-center gap-1.5 text-xs font-medium">
              <MessageSquare className="h-3.5 w-3.5" />
              강사 관찰 코멘트
              <StatusBadge label="조회 전용" tone="neutral" />
            </p>
            <p className="text-fg-muted mt-1 text-xs leading-relaxed">
              “{item.instructorNote.body}”
            </p>
            <p className="text-fg-subtle mt-1 text-xs">
              {item.instructorNote.instructor} · {item.instructorNote.at}
            </p>
          </div>
        )}
      </div>

      <div className="border-divider mt-auto border-t p-4">
        <p className="text-fg text-xs font-medium">
          결정 사유{' '}
          <span className="text-fg-subtle">— 반려·보완 요청 시 필수</span>{' '}
          <span className="text-danger">*</span>
        </p>
        <textarea
          value={reason}
          onChange={(e) => onReason(e.target.value)}
          rows={3}
          aria-label="결정 사유"
          placeholder="승인 시 코멘트 선택 / 반려·보완 요청 시 필수 — 학생에게 알림 발송"
          className="border-border focus:border-brand text-fg placeholder:text-fg-subtle bg-surface mt-2 w-full rounded-lg border p-2.5 text-xs outline-none"
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={!hasReason}
            onClick={() => onDecide('reject')}
            className="bg-danger-bg text-danger hover:bg-danger-bg/70 flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
          >
            <XCircle className="h-4 w-4" />
            반려
          </button>
          <button
            type="button"
            disabled={!hasReason}
            onClick={() => onDecide('changes')}
            className="bg-warning-bg text-warning hover:bg-warning-bg/70 flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
          >
            <AlertCircle className="h-4 w-4" />
            보완 요청
          </button>
          <button
            type="button"
            onClick={() => onDecide('approve')}
            className="bg-success hover:bg-success/90 text-on-color flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-bold"
          >
            <Check className="h-4 w-4" />
            승인
          </button>
        </div>
      </div>
    </div>
  )
}
