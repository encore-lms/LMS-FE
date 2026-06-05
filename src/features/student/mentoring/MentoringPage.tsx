import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useMentoring } from '../api/mentoring'
import { MentoringHero } from './components/MentoringHero'
import { MentoringStatCards } from './components/MentoringStatCards'
import { ActiveRequestCard } from './components/ActiveRequestCard'
import { NewRequestForm } from './components/NewRequestForm'
import { ConfirmedReservationCard } from './components/ConfirmedReservationCard'
import { HistoryTable } from './components/HistoryTable'
import { CancelRequestModal } from './components/CancelRequestModal'
import { BannerNotice, type BannerTone } from './components/BannerNotice'
import type { MentoringData } from './types'

type BannerKey = 'requested' | 'accepted' | 'canceled'
const BANNER: Record<
  BannerKey,
  {
    tone: BannerTone
    label: string
    message: string
    sub: string
    action: string
  }
> = {
  requested: {
    tone: 'success',
    label: 'REQUESTED',
    message: '멘토링 요청이 제출되었습니다',
    sub: '멘토가 응답하면 알림으로 안내됩니다.',
    action: '멘토 배정 보기 →',
  },
  accepted: {
    tone: 'success',
    label: 'ACCEPTED',
    message: '멘토 제안을 수락했습니다',
    sub: '예약이 확정되었습니다. 아래 확정 예약에서 확인하세요.',
    action: '확정 예약 보기 →',
  },
  canceled: {
    tone: 'warning',
    label: 'CANCELED',
    message: '멘토링 요청이 취소되었습니다',
    sub: '진행 중 요청이 없어 새 멘토링 요청을 다시 보낼 수 있습니다.',
    action: '새 요청 작성 →',
  },
}

const POLICY = [
  { k: '요청 단위', v: '팀 단위만 허용' },
  { k: '요청 권한', v: '팀원 누구나 · 요청자 기록' },
  { k: '중복', v: '팀당 진행 중 1개' },
  { k: '취소', v: '확정 전까지 수강생 가능' },
  { k: '확정 후', v: '멘토만 변경/취소' },
  { k: '일지', v: '상세 비공개 · 요약만' },
]

/**
 * 수강생 멘토링 (/student/mentoring) — Figma 2651:5430 외 5개 변형.
 * 상단 인라인 배너(?toast=requested/accepted/canceled)·취소 모달(?modal=)·멘토 미배정(?state=no-mentor).
 */
export default function MentoringPage() {
  const [params] = useSearchParams()
  const { data, isPending, isError, refetch } = useMentoring()
  const [modalOpen, setModalOpen] = useState(
    params.get('modal') === 'cancel-request',
  )
  const initial = params.get('toast') as BannerKey | null
  const [banner, setBanner] = useState<BannerKey | null>(
    initial && BANNER[initial] ? initial : null,
  )

  if (isPending)
    return <div className="text-fg-muted p-8">멘토링을 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="멘토링을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const noMentor = params.get('state') === 'no-mentor' || !data.mentor.assigned
  // 멘토 미배정: 히어로(배정 대기)·0 통계·비활성 폼·정책만. 진행 요청/예약/기록은 숨김.
  const display: MentoringData = noMentor
    ? {
        ...data,
        mentor: { ...data.mentor, assigned: false },
        kpis: {
          inProgress: 0,
          requestLimit: 1,
          completed: 0,
          cumulativeHours: 0,
          remainingHours: 0,
        },
        stats: data.stats.map((s) => ({ ...s, value: 0 })),
        activeRequest: null,
        reservation: null,
        history: [],
      }
    : data

  const hasActive = !!display.activeRequest
  const cfg = banner ? BANNER[banner] : null

  return (
    <div className="flex flex-col gap-5 p-8">
      {cfg && (
        <BannerNotice
          tone={cfg.tone}
          label={cfg.label}
          message={cfg.message}
          sub={cfg.sub}
          actionLabel={cfg.action}
          onClose={() => setBanner(null)}
        />
      )}

      {/* 정책 안내 칩 */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-fg text-[12px] font-medium">멘토링</span>
        <span className="bg-surface-muted text-fg-muted rounded-md px-2.5 py-1 text-[11px] font-medium">
          ⓘ 팀당 진행 중 요청 1개만 허용 · 확정 후 변경/취소는 멘토만 가능
        </span>
      </div>

      <MentoringHero data={display} />
      <MentoringStatCards stats={display.stats} />

      {display.activeRequest?.status === 'proposed' && (
        <ActiveRequestCard
          request={display.activeRequest}
          onCancel={() => setModalOpen(true)}
          onReject={() => setModalOpen(true)}
          onAccept={() => setBanner('accepted')}
        />
      )}

      <NewRequestForm
        disabled={hasActive || noMentor}
        variant={noMentor ? 'no-mentor' : 'active'}
      />

      {display.reservation && (
        <ConfirmedReservationCard r={display.reservation} />
      )}
      {display.history.length > 0 && <HistoryTable rows={display.history} />}

      {/* 멘토링 정책 */}
      <section className="bg-info-bg border-info flex items-center gap-3.5 rounded-[14px] border p-[18px]">
        <span className="bg-surface text-info flex size-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold">
          ⓘ
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-fg text-[14px] font-bold">멘토링 정책</span>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {POLICY.map((p) => (
              <div key={p.k} className="flex flex-col gap-px">
                <span className="text-fg-subtle text-[10px] font-medium tracking-wider">
                  {p.k}
                </span>
                <span className="text-fg text-[12px] font-bold">{p.v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CancelRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={() => {
          setModalOpen(false)
          setBanner('canceled')
        }}
      />
    </div>
  )
}
