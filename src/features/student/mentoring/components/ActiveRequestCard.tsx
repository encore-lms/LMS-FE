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
  const cls = tone === 'student' ? 'bg-info-bg' : 'bg-warning-bg'
  const dot = tone === 'student' ? 'bg-info' : 'bg-warning'
  return (
    <div className={cn('flex flex-1 flex-col gap-2.5 rounded-xl p-4', cls)}>
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

  // 상태 강조색 — 대기(info) / 조정 제안(warning). 좌측 스트라이프 + 배지에만 쓴다.
  const accentText = hasProposal ? 'text-warning' : 'text-info'
  const accentBg = hasProposal ? 'bg-warning' : 'bg-info'
  const stripe = hasProposal ? 'bg-warning' : 'bg-info'

  return (
    <section className="bg-surface flex overflow-hidden rounded-2xl shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
      {/* 상태 스트라이프 */}
      <div className={cn('w-1 shrink-0', stripe)} />

      <div className="flex-1">
        {/* 헤더 — 상태 배지 + 제목 + 안내 (요청 ID 등 내부 식별자 미노출) */}
        <div className="flex flex-col gap-1.5 px-6 pt-5 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-fg text-[15px] font-bold">진행 중 요청</span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
                hasProposal ? 'bg-warning-bg' : 'bg-info-bg',
                accentText,
              )}
            >
              <span className={cn('size-1.5 rounded-full', accentBg)} />
              {title}
            </span>
          </div>
          <span className="text-fg-muted text-[12.5px]">{description}</span>
        </div>

        {/* 본문: 희망 vs 제안 */}
        <div className="flex items-stretch gap-3 px-6 pb-5">
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
        <div className="border-divider flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
          <span className="text-fg-subtle text-[11.5px] font-medium">
            {hasProposal ? '제안 받은 시각' : '요청 시각'}{' '}
            {request.proposedAtLabel}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-3.5 py-[9px] text-[12px] font-medium transition-colors"
            >
              요청 취소
            </button>
            {hasProposal && (
              <>
                <button
                  type="button"
                  onClick={onReject}
                  className="border-danger text-danger hover:bg-danger-bg rounded-lg border px-3.5 py-[9px] text-[12px] font-medium transition-colors"
                >
                  제안 거절 후 새로 요청
                </button>
                <button
                  type="button"
                  onClick={onAccept}
                  className="bg-warning hover:bg-warning/90 rounded-lg px-[18px] py-[9px] text-[12px] font-bold text-white transition-colors"
                >
                  제안 수락 후 확정
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
