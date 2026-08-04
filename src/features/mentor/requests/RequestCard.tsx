import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Home } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/shared/lib/cn'
import type { MentoringRequestItem, MentoringRequestSlot } from '../types'
import { MENTORING_PLACE_TYPE_LABEL } from '../types'
import { CohortChip } from '../components/chips'
import { REQUEST_STATUS_META } from './requestMeta'
import {
  DdayChip,
  RequestStatusChip,
  RoleBadge,
  SlotLabelChip,
} from './RequestChips'

const ACTION_BASE =
  'inline-flex items-center justify-center rounded-[10px] px-3.5 py-2 text-[13px] whitespace-nowrap'
const ACTION_OUTLINE = 'border-border bg-surface border font-medium'

const slotSummary = (slot: MentoringRequestSlot) =>
  `${MENTORING_PLACE_TYPE_LABEL[slot.placeType]} · ${slot.placeDetail} · 예상 ${slot.expectedMinutes}분`

/** 희망/확정 일정 박스 — 미니 라벨 칩 + 일시 + 장소·예상 + (있으면) 메모 1줄. */
function ScheduleBox({
  label,
  slot,
}: {
  label: string
  slot: MentoringRequestSlot
}) {
  return (
    <div className="bg-surface-muted flex min-w-0 flex-1 flex-col gap-2 rounded-[10px] p-3.5">
      <SlotLabelChip label={label} />
      <span className="text-fg flex items-center gap-1.5 text-[13px] font-semibold">
        <Calendar className="h-3 w-3 shrink-0" />
        {slot.dateTimeLabel}
      </span>
      <span className="text-fg-muted flex items-center gap-1.5 text-xs font-medium">
        <Home className="h-3 w-3 shrink-0" />
        {slotSummary(slot)}
      </span>
      {slot.memo && (
        <p className="bg-surface border-divider text-fg-muted line-clamp-1 rounded-lg border px-3 py-2.5 text-xs leading-[18px]">
          {slot.memo}
        </p>
      )}
    </div>
  )
}

/** 내 조정 제안 박스 — accent 틴트(#f0edfa→accent-bg) + '수강생 응답 대기'. */
function ProposalBox({ slot }: { slot: MentoringRequestSlot }) {
  return (
    <div className="bg-accent-bg flex min-w-0 flex-1 flex-col gap-2 rounded-[10px] p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-accent-strong text-on-color rounded px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
          내 조정 제안
        </span>
        <span className="text-accent-strong text-[11px] font-medium">
          수강생 응답 대기
        </span>
      </div>
      <span className="text-fg flex items-center gap-1.5 text-[13px] font-semibold">
        <Calendar className="h-3 w-3 shrink-0" />
        {slot.dateTimeLabel}
      </span>
      <span className="text-accent-strong flex items-center gap-1.5 text-xs font-medium">
        <Home className="h-3 w-3 shrink-0" />
        {slotSummary(slot)}
      </span>
    </div>
  )
}

/** 상태별 우상단 액션 — 응답은 모달(공통 Modal) 오픈 + 모드 프리셀렉트, 제안 취소만 즉시 mutation. */
/**
 * 응답 화면으로 가는 버튼 — 팀 안에서는 라우트로 나가지 않고 그 자리에서 연다.
 *
 * <p>라우트로 나가면 사이드바에서 사라진 전체 예약 목록 위에 모달이 떠, 팀을 벗어나고
 * 배경도 다른 팀 요청이 된다(일지 '열기'에서 겪은 것과 같다).</p>
 */
function ActionLink({
  to,
  mode,
  onOpen,
  className,
  children,
}: {
  to: string
  mode: string
  onOpen?: (mode: string) => void
  className: string
  children: ReactNode
}) {
  if (onOpen) {
    return (
      <button type="button" onClick={() => onOpen(mode)} className={className}>
        {children}
      </button>
    )
  }
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  )
}

function CardActions({
  request,
  onCancelProposal,
  cancelPending,
  onOpen,
}: {
  request: MentoringRequestItem
  onCancelProposal: (requestId: string) => void
  cancelPending: boolean
  onOpen?: (mode: string) => void
}) {
  const base = `/mentor/mentoring-requests/${request.requestId}`
  switch (request.status) {
    case 'requested':
      return (
        <>
          <ActionLink
            to={`${base}?mode=reject`}
            mode="reject"
            onOpen={onOpen}
            className={cn(
              ACTION_BASE,
              ACTION_OUTLINE,
              'text-danger hover:bg-danger-bg/50',
            )}
          >
            거절
          </ActionLink>
          <ActionLink
            to={`${base}?mode=counter`}
            mode="counter"
            onOpen={onOpen}
            className={cn(
              ACTION_BASE,
              ACTION_OUTLINE,
              'text-accent-strong hover:bg-accent-bg',
            )}
          >
            조정 제안
          </ActionLink>
          <ActionLink
            to={`${base}?mode=confirm`}
            mode="confirm"
            onOpen={onOpen}
            className={cn(
              ACTION_BASE,
              'bg-brand text-on-color hover:bg-brand/90 font-bold',
            )}
          >
            확정
          </ActionLink>
        </>
      )
    case 'counter_proposed':
      return (
        <>
          <button
            type="button"
            disabled={cancelPending}
            onClick={() => onCancelProposal(request.requestId)}
            className={cn(
              ACTION_BASE,
              ACTION_OUTLINE,
              'text-fg-muted hover:bg-surface-muted disabled:opacity-50',
            )}
          >
            제안 취소
          </button>
          <ActionLink
            to={`${base}?mode=counter`}
            mode="counter"
            onOpen={onOpen}
            className={cn(
              ACTION_BASE,
              'bg-accent-strong text-on-color hover:bg-accent-strong/90 font-bold',
            )}
          >
            제안 수정
          </ActionLink>
        </>
      )
    case 'confirmed':
      // 확정 카드 시안 미제공 — 확정 후 변경(멘토만 가능) 진입만 보수적으로 제공.
      return (
        <ActionLink
          to={base}
          mode="confirm"
          onOpen={onOpen}
          className={cn(
            ACTION_BASE,
            ACTION_OUTLINE,
            'text-fg-muted hover:bg-surface-muted',
          )}
        >
          확정 정보 변경
        </ActionLink>
      )
    default:
      return (
        <Link
          to={base}
          className={cn(
            ACTION_BASE,
            ACTION_OUTLINE,
            'text-fg-muted hover:bg-surface-muted',
          )}
        >
          상세 보기
        </Link>
      )
  }
}

// 예약 요청 카드 — Figma 2553:3820. 좌측 상태 스트라이프 + 칩 행 + 팀명 + 요청자 행 +
// 우측 액션 + 하단 일정 박스(조정 제안 상태는 희망/제안 2열).
export function RequestCard({
  request,
  onCancelProposal,
  cancelPending,
  onOpen,
}: {
  request: MentoringRequestItem
  onCancelProposal: (requestId: string) => void
  cancelPending: boolean
  /** 주면 응답 화면을 라우트 대신 그 자리에서 연다(팀 상세 '예약' 탭). */
  onOpen?: (mode: string) => void
}) {
  const meta = REQUEST_STATUS_META[request.status]
  const resolvedSlot = request.confirmed ?? request.desired
  return (
    <article className="bg-surface relative overflow-hidden rounded-2xl shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(18,23,38,0.05)]">
      <span
        className={cn('absolute inset-y-0 left-0 w-1.5', meta.stripe)}
        aria-hidden
      />
      <div className="flex flex-col gap-3.5 p-[22px] pl-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <CohortChip label={request.cohortLabel} />
              <RequestStatusChip status={request.status} />
              {request.dDayLabel && <DdayChip label={request.dDayLabel} />}
            </div>
            <p className="text-fg text-[17px] font-bold">{request.teamName}</p>
            <div className="flex items-center gap-2">
              <span className="text-fg-subtle text-[11px]">요청자</span>
              <Avatar name={request.requester.name} size={24} />
              <span className="text-fg text-xs font-semibold">
                {request.requester.name}
              </span>
              <RoleBadge role={request.requester.role} />
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <CardActions
              request={request}
              onCancelProposal={onCancelProposal}
              cancelPending={cancelPending}
              onOpen={onOpen}
            />
          </div>
        </div>
        {request.status === 'counter_proposed' && request.proposal ? (
          <div className="flex flex-col gap-3.5 lg:flex-row">
            <ScheduleBox label="희망 일정" slot={request.desired} />
            <ProposalBox slot={request.proposal} />
          </div>
        ) : request.status === 'confirmed' || request.status === 'completed' ? (
          <ScheduleBox label="확정 일정" slot={resolvedSlot} />
        ) : (
          <ScheduleBox label="희망 일정" slot={request.desired} />
        )}
      </div>
    </article>
  )
}
