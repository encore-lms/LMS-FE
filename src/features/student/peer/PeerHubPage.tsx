import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePeerHub } from '../api/peer'
import type { Tone } from './types'

// 동료 평가 허브 (/student/peer-evaluations) — Figma 401:1586.
const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const DOT: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}

export default function PeerHubPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = usePeerHub()

  if (isPending)
    return <div className="text-fg-muted p-8">동료 평가를 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="동료 평가를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-fg text-[22px] font-bold">동료 평가 허브</h1>
        <p className="text-fg-muted text-[12px]">
          동기·동료에게 PeerTag와 5축 평가를 남깁니다. 모든 평가는 익명이며 같은
          기수 내에서만 가능합니다.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.stats.map((s) => (
          <div key={s.key} className={cn(card, 'flex flex-col gap-2')}>
            <div className="flex items-start justify-between">
              <span className="text-fg-muted text-[12px]">{s.label}</span>
              <span className={cn('size-2 rounded-full', DOT[s.tone])} />
            </div>
            <span className="text-fg text-[24px] leading-none font-bold">
              {s.value}
              <span className="text-fg-muted ml-0.5 text-[13px]">{s.unit}</span>
            </span>
            <span className="text-fg-subtle text-[11px]">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PeerActionCard
          tone="success"
          title="PeerTag 부여"
          progressLabel={`진행 중 ${data.tagProgress.done}/${data.tagProgress.total}`}
          desc="동기 동료에게 어울리는 협업 태그를 익명으로 부여합니다. 부여한 태그는 동료의 증명서 태그 클라우드에 반영됩니다."
          done={data.tagProgress.done}
          total={data.tagProgress.total}
          remaining={data.tagProgress.remaining}
          bullets={[
            '기수 동료까지 자유 부여',
            '1인당 최대 5개 태그',
            '익명 처리 · 평가자 정보 비공개',
          ]}
          actionLabel="PeerTag 부여하기 →"
          onClick={() => navigate('/student/peer-tag')}
        />
        <PeerActionCard
          tone="accent"
          title="PeerReputation 5축 평가"
          progressLabel={`진행 중 ${data.repProgress.done}/${data.repProgress.total}`}
          desc="기술·책임감·소통·성장·팀워크 5축으로 동료를 평가하고 추천도를 남깁니다. 동료의 증명서 360° 비교에 반영됩니다."
          done={data.repProgress.done}
          total={data.repProgress.total}
          remaining={data.repProgress.remaining}
          bullets={[
            '5축 0~5점 + 자유 코멘트 (선택)',
            '수료 직전까지 갱신 가능',
            '익명 · 가중 평균으로 집계',
          ]}
          actionLabel="5축 평가하기 →"
          onClick={() => navigate('/student/peer-reputation')}
        />
      </div>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-fg text-[15px] font-bold">
              받은 평판 요약
            </span>
            <span className="text-fg-subtle text-[11px]">
              동료 12명이 작성 · 익명·집계만 · 증명서 360° 비교 값에 사용
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate('/student/certificate?tab=growth-reputation')
            }
            className="text-brand text-[12px] font-semibold"
          >
            증명서에서 보기 →
          </button>
        </div>
        {data.receivedReputation.map((r) => (
          <div key={r.key} className="flex items-center gap-3">
            <div className="flex w-40 shrink-0 flex-col">
              <span className="text-fg text-[13px] font-bold">{r.key}</span>
              <span className="text-fg-subtle text-[11px]">{r.sub}</span>
            </div>
            <div className="bg-surface-muted h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-accent-strong h-full rounded-full"
                style={{ width: `${(r.score / 5) * 100}%` }}
              />
            </div>
            <span className="text-fg w-12 shrink-0 text-right text-[13px] font-bold">
              {r.score.toFixed(1)}{' '}
              <span className="text-fg-subtle text-[11px] font-normal">
                / 5.0
              </span>
            </span>
          </div>
        ))}
      </section>
    </div>
  )
}

function PeerActionCard({
  tone,
  title,
  progressLabel,
  desc,
  done,
  total,
  remaining,
  bullets,
  actionLabel,
  onClick,
}: {
  tone: 'success' | 'accent'
  title: string
  progressLabel: string
  desc: string
  done: number
  total: number
  remaining: number
  bullets: string[]
  actionLabel: string
  onClick: () => void
}) {
  const solid = tone === 'accent' ? 'bg-accent-strong' : 'bg-success'
  const tint =
    tone === 'accent'
      ? 'bg-accent-bg text-accent-strong'
      : 'bg-success-bg text-success'
  return (
    <section className={cn(card, 'flex flex-col gap-3')}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-lg text-white',
            solid,
          )}
        >
          ★
        </span>
        <span className="text-fg text-[16px] font-bold">{title}</span>
        <span
          className={cn(
            'ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold',
            tint,
          )}
        >
          {progressLabel}
        </span>
      </div>
      <span className="text-fg-muted text-[12px] leading-5">{desc}</span>
      <div className="bg-surface-muted/50 flex items-center justify-between rounded-xl p-3.5">
        <div className="flex flex-col">
          <span className="text-fg-subtle text-[11px]">부여 진행률</span>
          <span className="text-fg text-[18px] font-bold">
            {done}{' '}
            <span className="text-fg-subtle text-[12px]">/ {total}명</span>
          </span>
        </div>
        <div className="flex flex-1 flex-col items-end gap-1 pl-4">
          <span className="text-fg-subtle text-[11px]">
            남은 인원 {remaining}명
          </span>
          <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className={cn('h-full rounded-full', solid)}
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <ul className="flex flex-col gap-1">
        {bullets.map((b) => (
          <li key={b} className="text-fg-muted flex gap-1.5 text-[12px]">
            <span
              className={
                tone === 'accent' ? 'text-accent-strong' : 'text-success'
              }
            >
              •
            </span>
            {b}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'mt-1 rounded-lg py-3 text-[13px] font-bold text-white',
          solid,
        )}
      >
        {actionLabel}
      </button>
    </section>
  )
}
