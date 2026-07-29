import { CalendarCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Empty } from '@/components/ui/Empty'
import { InteractiveCard } from '@/components/ui/InteractiveCard'
import { useMentoringRequests } from '../api/requests'
import {
  MENTORING_PLACE_TYPE_LABEL,
  type MentoringRequestItem,
} from '../types/requests'

// 일지 작성 시 확정된 예약을 골라 진행 일시·장소를 그대로 가져온다.
// 손으로 다시 옮겨 적으면 예약과 일지가 어긋나기 쉽다.

const pad2 = (n: number) => String(n).padStart(2, '0')

/** ISO 시각 → 폼이 쓰는 'YYYY-MM-DD' 와 'HH:mm'(현지 시각). */
export function splitIso(iso?: string | null) {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { date: '', time: '' }
  return {
    date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
  }
}

export interface ReservationPick {
  teamId: string
  sessionDate: string
  startTime: string
  endTime: string
  placeType: 'offline' | 'online' | 'etc'
  placeDetail: string
}

export function ReservationPickModal({
  open,
  onClose,
  onPick,
}: {
  open: boolean
  onClose: () => void
  onPick: (pick: ReservationPick) => void
}) {
  const { data } = useMentoringRequests()
  // 실제로 진행이 정해진 것만 — 요청 대기·거절 건을 일지로 옮길 일은 없다.
  const rows: MentoringRequestItem[] = (data?.requests ?? []).filter(
    (r) =>
      (r.status === 'confirmed' || r.status === 'completed') && !!r.confirmed,
  )

  return (
    <Modal open={open} onClose={onClose} size="md" title="예약 불러오기">
      {rows.length === 0 ? (
        <Empty
          title="가져올 예약이 없어요"
          description="확정된 멘토링 예약이 있으면 여기에서 골라 채울 수 있어요."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => {
            const slot = r.confirmed!
            const from = splitIso(slot.startsAt)
            const to = splitIso(slot.endsAt)
            return (
              <InteractiveCard
                key={r.requestId}
                ariaLabel={`${slot.dateTimeLabel} 예약 불러오기`}
                onOpen={() =>
                  onPick({
                    teamId: r.teamId,
                    sessionDate: from.date,
                    startTime: from.time,
                    endTime: to.time,
                    placeType: slot.placeType,
                    placeDetail: slot.placeDetail,
                  })
                }
                className="flex flex-col gap-1 p-4"
              >
                <div className="flex items-center gap-2">
                  <CalendarCheck
                    className="text-brand size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-fg text-[13px] font-bold">
                    {slot.dateTimeLabel}
                  </span>
                </div>
                <span className="text-fg-muted text-[12px]">
                  {r.cohortLabel} · {r.teamName} ·{' '}
                  {MENTORING_PLACE_TYPE_LABEL[slot.placeType]}
                  {slot.placeDetail ? ` · ${slot.placeDetail}` : ''}
                </span>
              </InteractiveCard>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
