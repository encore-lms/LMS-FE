import { cn } from '@/shared/lib/cn'
import type { MentoringActiveRequest, MentoringSlot } from '../types'

// 진행 중 요청(조정 제안) 카드 — 희망 일정(수강생) vs 멘토 제안 + 응답 액션.
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-fg-muted text-[11px] font-medium">{label}</span>
      <span className="text-fg text-right text-[12px] font-bold">{value}</span>
    </div>
  )
}

function SlotCard({
  slot,
  title,
  tone,
  personLabel,
  datetimeLabel,
  memoLabel,
}: {
  slot: MentoringSlot
  title: string
  tone: 'student' | 'mentor'
  personLabel: string
  datetimeLabel: string
  memoLabel: string
}) {
  const cls =
    tone === 'student'
      ? 'bg-info-bg border-info'
      : 'bg-warning-bg border-warning'
  const dot = tone === 'student' ? 'bg-info' : 'bg-warning'
  return (
    <div
      className={cn('flex flex-1 flex-col gap-2.5 rounded-xl border p-4', cls)}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn('size-1.5 rounded-full', dot)} />
        <span className="text-fg text-[12px] font-bold">{title}</span>
      </div>
      <Row label={personLabel} value={slot.person} />
      <Row label={datetimeLabel} value={slot.datetime} />
      <Row label="장소 유형" value={slot.placeType} />
      <Row label="상세 장소" value={slot.placeDetail} />
      <Row label={memoLabel} value={slot.memo} />
    </div>
  )
}

export function ActiveRequestCard({
  request,
  onCancel,
  onReject,
  onAccept,
}: {
  request: MentoringActiveRequest
  onCancel: () => void
  onReject: () => void
  onAccept: () => void
}) {
  const hasProposal = request.status === 'proposed' && !!request.proposal
  const title = hasProposal
    ? '조정 제안 — 응답 대기'
    : '요청 대기 — 멘토 확인 중'
  const description = hasProposal
    ? '멘토가 다른 일정·장소를 제안했습니다. 수락하거나 요청을 취소할 수 있습니다.'
    : '멘토가 요청을 확인한 뒤 확정하거나 조정 제안을 보낼 수 있습니다.'

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border-[1.5px] shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]',
        hasProposal ? 'border-warning' : 'border-info',
      )}
    >
      {/* 헤더 */}
      <div
        className={cn(
          'flex items-center justify-between border-b px-6 py-[18px]',
          hasProposal
            ? 'bg-warning-bg border-warning'
            : 'bg-info-bg border-info',
        )}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'bg-surface flex size-9 items-center justify-center rounded-[10px] text-[15px] font-bold',
              hasProposal ? 'text-warning' : 'text-info',
            )}
          >
            {hasProposal ? '!' : 'i'}
          </span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-fg text-[15px] font-bold">
                진행 중 요청 1건
              </span>
              <span
                className={cn(
                  'rounded-[5px] px-[7px] py-[3px] text-[11px] font-bold text-white',
                  hasProposal ? 'bg-warning' : 'bg-info',
                )}
              >
                {title}
              </span>
            </div>
            <span className="text-fg-muted text-[12px]">{description}</span>
          </div>
        </div>
        <span className="text-fg-subtle text-[11px] font-medium">
          요청 #{request.id}
        </span>
      </div>

      {/* 본문: 희망 vs 제안 */}
      <div className="bg-surface flex items-stretch gap-3 px-6 py-[18px]">
        <SlotCard
          slot={request.student}
          title="희망 일정 (수강생)"
          tone="student"
          personLabel="요청자"
          datetimeLabel="희망 일시"
          memoLabel="요청 메모"
        />
        {hasProposal && request.proposal && (
          <>
            <div className="text-fg-subtle flex items-center justify-center">
              →
            </div>
            <SlotCard
              slot={request.proposal}
              title="멘토 제안"
              tone="mentor"
              personLabel="응답자"
              datetimeLabel="새 일시"
              memoLabel="멘토 메모"
            />
          </>
        )}
      </div>

      {/* 액션 */}
      <div className="bg-surface border-divider flex items-center justify-between border-t px-6 pt-3.5 pb-[18px]">
        <span className="text-fg-subtle text-[11px] font-medium">
          {hasProposal ? '제안 받은 시각' : '요청 시각'}{' '}
          {request.proposedAtLabel}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border-border text-fg-muted rounded-lg border px-3.5 py-[9px] text-[12px] font-medium"
          >
            요청 취소
          </button>
          {hasProposal && (
            <>
              <button
                type="button"
                onClick={onReject}
                className="border-danger text-danger rounded-lg border px-3.5 py-[9px] text-[12px] font-medium"
              >
                제안 거절 후 새로 요청
              </button>
              <button
                type="button"
                onClick={onAccept}
                className="bg-warning rounded-lg px-[18px] py-[9px] text-[12px] font-bold text-white"
              >
                제안 수락 후 확정
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
