import { Clock, FileText } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/shared/lib/cn'
import { LOG_STATUS_META, logDisplayStatus } from './statusMeta'
import type { AdminMentoringLogDetail } from './types'

const HISTORY_TONE: Record<string, string> = {
  success: 'bg-success-bg text-success',
  info: 'bg-info-bg text-info',
  neutral: 'bg-surface-muted text-fg-muted',
}

interface LogDetailPanelProps {
  detail: AdminMentoringLogDetail | null
  isPending: boolean
  onRequestChange: () => void
}

/**
 * 선택 일지 상세 패널(우측 420w) — 작성 당시 항목 스냅샷·답변·장소·이력.
 * 운영자는 직접 수정 불가 — 수정 요청만(§30, 폐기·반려 없음 05-31 확정).
 * 메트릭 스트립(실제/인정/초과/장소)은 Figma 에서 h-0 collapse 였으나 의도 콘텐츠로 보고 포함.
 */
export function LogDetailPanel({
  detail,
  isPending,
  onRequestChange,
}: LogDetailPanelProps) {
  if (isPending) {
    return (
      <aside className="border-border bg-surface text-fg-muted rounded-2xl border p-5 text-sm">
        일지 상세를 불러오는 중…
      </aside>
    )
  }
  if (!detail) {
    return (
      <aside className="border-border bg-surface text-fg-subtle rounded-2xl border p-5 text-sm">
        행을 선택하면 작성 당시 항목 스냅샷 · 답변 · 장소 · 이력이 표시됩니다.
      </aside>
    )
  }

  const statusMeta = LOG_STATUS_META[logDisplayStatus(detail)]
  const metrics: { label: string; value: string; accent?: boolean }[] = [
    { label: '실제', value: `${detail.actualMinutes}분` },
    {
      label: '인정',
      value:
        detail.recognizedHours !== null ? `${detail.recognizedHours}h` : '-',
      accent: true,
    },
    {
      label: '초과',
      value: detail.excessHours > 0 ? `${detail.excessHours}h` : '-',
    },
    { label: '장소', value: detail.locationLabel.split(' · ')[0] },
  ]

  // 수정 요청 게이트(FE 선차단): 초안 대상 불가(422) · 미해결 요청 1건(409).
  const requestDisabled = detail.status !== 'valid'
  const requestDisabledReason =
    detail.status === 'draft'
      ? '초안 일지는 수정 요청 대상이 아니에요'
      : detail.status === 'change_requested'
        ? '미해결 수정 요청이 있어요 — 멘토 재제출 대기'
        : null

  return (
    <aside className="border-border bg-surface flex flex-col rounded-2xl border">
      <div className="border-divider flex items-start justify-between gap-2 border-b px-5 pt-4 pb-3">
        <div>
          <p className="text-fg text-sm font-bold">선택 일지 상세</p>
          <p className="text-fg-subtle mt-0.5 text-[11px]">
            작성 당시 항목 스냅샷 · 답변 · 장소 · 이력
          </p>
        </div>
        <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
      </div>

      <div className="flex flex-col gap-3 px-5 py-4">
        <p className="text-fg text-[15px] font-bold">
          {detail.teamName} · {detail.roundLabel}
        </p>
        <div className="flex items-center gap-2">
          <Avatar name={detail.mentorName} size={24} />
          <span className="text-fg text-xs font-bold">
            {detail.mentorName} 멘토
          </span>
          <span className="text-fg-subtle text-[11px]">
            · {detail.conductedRangeLabel}
          </span>
        </div>

        {/* 메트릭 스트립 — 실제 / 인정 / 초과 / 장소 */}
        <div className="bg-surface-muted grid grid-cols-4 divide-x divide-[var(--color-border)] rounded-lg px-2 py-3">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col items-center gap-0.5">
              <span className="text-fg-subtle text-[10px] font-medium tracking-[0.6px]">
                {m.label}
              </span>
              <span
                className={cn(
                  'text-[13px] font-bold',
                  m.accent ? 'text-brand' : 'text-fg',
                )}
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>

        {/* 미해결 수정 요청 — 사유 코드 + 상세 메모(수강생 비공개) */}
        {detail.changeRequest && (
          <div className="bg-info-bg flex flex-col gap-1.5 rounded-lg p-3">
            <p className="text-info text-[11px] font-bold">
              수정 요청 중 · {detail.changeRequest.reasonLabel} ·{' '}
              {detail.changeRequest.requestedAtLabel}
            </p>
            <p className="text-fg-muted text-xs leading-5">
              {detail.changeRequest.note}
            </p>
          </div>
        )}

        {/* 작성 당시 항목 스냅샷 */}
        <div className="mt-1 flex items-center gap-1.5">
          <FileText className="text-fg-muted h-3.5 w-3.5" />
          <span className="text-fg text-xs font-bold">
            작성 당시 항목 스냅샷
          </span>
          <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 text-[10px] font-medium">
            {detail.templateLabel}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {detail.snapshotItems.map((item) => (
            <div
              key={item.order}
              className="border-divider rounded-lg border px-3 py-2.5"
            >
              <p className="flex items-center gap-1.5">
                <span className="bg-brand/10 text-brand inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded text-[10px] font-bold">
                  {item.order}
                </span>
                <span className="text-fg text-[11px] font-bold">
                  {item.title}{' '}
                  <span className="text-fg-subtle font-medium">
                    ({item.required ? '필수' : '선택'})
                  </span>
                </span>
              </p>
              <p
                className={cn(
                  'mt-1 text-[11px] leading-4 whitespace-pre-line',
                  item.answer ? 'text-fg-muted' : 'text-fg-subtle',
                )}
              >
                {item.answer || '미입력'}
              </p>
            </div>
          ))}
        </div>

        {/* 제출/수정 이력 */}
        <div className="mt-1 flex items-center gap-1.5">
          <Clock className="text-fg-muted h-3.5 w-3.5" />
          <span className="text-fg text-xs font-bold">제출/수정 이력</span>
        </div>
        <ul className="flex flex-col gap-1.5">
          {detail.history.map((entry, i) => (
            <li
              key={`${entry.atLabel}-${i}`}
              className="flex items-center gap-2 text-[11px]"
            >
              <span className="text-fg font-bold">{entry.atLabel}</span>
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-bold',
                  HISTORY_TONE[entry.tone],
                )}
              >
                {entry.actionLabel}
              </span>
              <span className="text-fg-subtle">{entry.actor}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 처리 — 운영자 직접 수정 불가 · 수정 요청만(반려·폐기 없음, 05-31 확정) */}
      <div className="border-divider flex flex-col gap-2 border-t px-5 py-4">
        <button
          type="button"
          onClick={onRequestChange}
          disabled={requestDisabled}
          className="border-info text-info hover:bg-info-bg w-full rounded-lg border bg-white px-3 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          수정 요청 — 사유 코드 + 상세 메모 필수
        </button>
        {requestDisabledReason && (
          <p className="text-fg-subtle text-[11px]">{requestDisabledReason}</p>
        )}
      </div>
    </aside>
  )
}
