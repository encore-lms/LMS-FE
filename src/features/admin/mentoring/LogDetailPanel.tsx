import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/shared/lib/cn'
import { LOG_STATUS_META, logDisplayStatus } from './statusMeta'
import type { AdminMentoringLogDetail } from './types'

interface LogDetailPanelProps {
  detail: AdminMentoringLogDetail | null
  isPending: boolean
}

/**
 * 선택 일지 상세 — 과정·기수·회차 / 멘토 / 등록 날짜 / 인증 시간 + 템플릿 항목별 질문·답변.
 * 운영자는 직접 수정 불가 — 승인·수정 요청은 모달 푸터에서 처리(§30).
 */
export function LogDetailPanel({ detail, isPending }: LogDetailPanelProps) {
  if (isPending) {
    return (
      <div className="text-fg-muted p-2 text-sm">일지 상세를 불러오는 중…</div>
    )
  }
  if (!detail) {
    return (
      <div className="text-fg-subtle p-2 text-sm">
        행을 선택하면 일지 상세가 표시됩니다.
      </div>
    )
  }

  const statusMeta = LOG_STATUS_META[logDisplayStatus(detail)]
  // '2026-07-28 20:00 → 23:00' → 등록 날짜 / 인증 시간(시작 → 종료) 분리.
  const [conductedDate, ...conductedRest] =
    detail.conductedRangeLabel.split(' ')
  const conductedTime = conductedRest.join(' ')

  return (
    <div className="flex flex-col gap-5">
      {/* 상단 — 과정·기수·회차 / 멘토 / 상태 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-fg text-lg font-bold">
            {detail.teamName} · {detail.roundLabel}
          </p>
          <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
        </div>
        <div className="flex items-center gap-2">
          <Avatar name={detail.mentorName} size={26} />
          <span className="text-fg text-sm font-bold">
            {detail.mentorName} 멘토
          </span>
        </div>

        {/* 등록 날짜 · 인증 시간 */}
        <dl className="bg-surface-muted flex flex-col gap-2 rounded-xl px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-fg-subtle text-[12px] font-medium">
              등록 날짜
            </dt>
            <dd className="text-fg text-[13px] font-bold tabular-nums">
              {conductedDate}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-fg-subtle text-[12px] font-medium">
              인증 시간
            </dt>
            <dd className="text-fg text-[13px] font-bold tabular-nums">
              {conductedTime || detail.conductedRangeLabel}
            </dd>
          </div>
        </dl>

        {/* 미해결 수정 요청(있을 때만) — 사유 코드 + 상세 메모 */}
        {detail.changeRequest && (
          <div className="bg-info-bg flex flex-col gap-1.5 rounded-xl p-3.5">
            <p className="text-info text-[12px] font-bold">
              수정 요청 중 · {detail.changeRequest.reasonLabel} ·{' '}
              {detail.changeRequest.requestedAtLabel}
            </p>
            <p className="text-fg-muted text-[12px] leading-5">
              {detail.changeRequest.note}
            </p>
          </div>
        )}
      </div>

      {/* 템플릿 항목 — 질문 + 답변 */}
      <div className="flex flex-col gap-4">
        {detail.snapshotItems.map((item) => (
          <div key={item.order} className="flex flex-col gap-1.5">
            <p className="flex items-center gap-2">
              <span className="bg-brand/10 text-brand inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold">
                {item.order}
              </span>
              <span className="text-fg text-[14px] font-bold">
                {item.title}
                <span className="text-fg-subtle ml-1 text-[12px] font-medium">
                  ({item.required ? '필수' : '선택'})
                </span>
              </span>
            </p>
            <p
              className={cn(
                'rounded-lg px-3.5 py-3 text-[13px] leading-6 whitespace-pre-line',
                item.answer
                  ? 'bg-surface-muted text-fg'
                  : 'bg-surface-muted text-fg-subtle italic',
              )}
            >
              {item.answer || '미입력'}
            </p>
          </div>
        ))}
        {detail.snapshotItems.length === 0 && (
          <p className="text-fg-subtle text-[13px]">
            작성된 템플릿 항목이 없어요.
          </p>
        )}
      </div>
    </div>
  )
}
