import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { usePeerTag } from '../api/peer'
import { PEER_TAGS, type PeerMemberStatus, type Tone } from './types'

// PeerTag 부여 (/student/peer-tag) — Figma 402:1644.
const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const STATUS: Record<PeerMemberStatus, string> = {
  editing: 'bg-brand/10 text-brand',
  done: 'bg-success-bg text-success',
  todo: 'bg-surface-muted text-fg-subtle',
}
const AVA: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}

export default function PeerTagPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = usePeerTag()
  const [selectedId, setSelectedId] = useState('m1')
  const [tags, setTags] = useState<string[]>([
    '#분위기메이커',
    '#꼼꼼한기록',
    '#끝까지간다',
    '#문서화장인',
  ])
  usePageHeader(
    'PeerTag 부여',
    '동기·동료에게 어울리는 협업 태그를 익명으로 부여합니다.',
  )

  if (isPending) return <div className="text-fg-muted p-8">불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const target =
    data.members.find((m) => m.id === selectedId) ?? data.members[0]
  const toggleTag = (t: string) =>
    setTags((p) =>
      p.includes(t)
        ? p.filter((x) => x !== t)
        : p.length >= data.maxTags
          ? p
          : [...p, t],
    )

  return (
    <div className="flex flex-col gap-5 p-8 pb-28">
      <div className="flex items-center gap-3">
        <span className="text-fg text-[15px] font-bold">동기수 동료</span>
        <span className="text-fg-subtle text-[12px]">
          {data.progress.total}명
        </span>
        <div className="bg-surface-muted ml-2 h-2 w-48 overflow-hidden rounded-full">
          <div
            className="bg-brand h-full rounded-full"
            style={{
              width: `${(data.progress.done / data.progress.total) * 100}%`,
            }}
          />
        </div>
        <span className="text-fg-subtle text-[12px]">
          {data.progress.done} / {data.progress.total}명
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {data.members.map((m) => {
          const on = m.id === target?.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedId(m.id)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-2xl border p-5 text-center transition-colors',
                on
                  ? 'border-brand bg-brand/5'
                  : 'border-border bg-surface hover:border-brand/40',
              )}
            >
              <span
                className={cn(
                  'flex size-12 items-center justify-center rounded-full text-[16px] font-bold text-white',
                  AVA[m.avatarTone],
                )}
              >
                {m.name.slice(0, 1)}
              </span>
              <span className="text-fg text-[14px] font-bold">{m.name}</span>
              <span className="text-fg-subtle text-[11px]">{m.role}</span>
              <span
                className={cn(
                  'rounded px-2 py-0.5 text-[10px] font-bold',
                  STATUS[m.status],
                )}
              >
                {m.statusLabel}
              </span>
            </button>
          )
        })}
      </div>

      {target && (
        <section
          className={cn(card, 'border-brand/30 flex flex-col gap-3 border')}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex size-7 items-center justify-center rounded-full text-[12px] font-bold text-white',
                AVA[target.avatarTone],
              )}
            >
              {target.name.slice(0, 1)}
            </span>
            <span className="text-fg text-[14px] font-bold">
              {target.name} 님에게 PeerTag 부여
            </span>
            <span className="bg-brand/10 text-brand ml-auto rounded-full px-3 py-1 text-[12px] font-bold">
              선택 {tags.length} / {data.maxTags}
            </span>
          </div>
          <span className="text-fg-subtle text-[11px]">
            어울리는 협업 태그를 골라주세요 · 한 동료에게 최대 {data.maxTags}
            개까지 선택 가능
          </span>
          <div className="flex flex-wrap gap-2">
            {PEER_TAGS.map((t) => {
              const on = tags.includes(t)
              const full = !on && tags.length >= data.maxTags
              return (
                <button
                  key={t}
                  type="button"
                  disabled={full}
                  onClick={() => toggleTag(t)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors',
                    on
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border text-fg-muted hover:border-brand/50 disabled:cursor-not-allowed disabled:opacity-40',
                  )}
                >
                  {on && '✓ '}
                  {t}
                </button>
              )
            })}
          </div>
          <div className="bg-info-bg/60 text-fg-muted rounded-xl p-3 text-[11px]">
            ⓘ 익명이며 자주 보인 모습을 선택하세요. 한 번 저장하면 같은 동료에게
            다시 부여할 수 없습니다.
          </div>
        </section>
      )}

      <div className="bg-brand-deep fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between rounded-2xl px-6 py-4 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
        <div className="flex flex-col">
          <span className="text-[13px] font-bold">
            {target?.name} 님에게 {tags.length}개 태그 부여 준비
          </span>
          <span className="text-[11px] text-white/70">
            저장 후엔 같은 동료에게 재부여 불가 · 익명 처리됨
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/student/peer-evaluations')}
            className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold"
          >
            다른 동료 선택
          </button>
          <button
            type="button"
            onClick={() => navigate('/student/peer-evaluations')}
            className="bg-brand rounded-lg px-5 py-2.5 text-[13px] font-bold"
          >
            태그 저장 ({tags.length}개) →
          </button>
        </div>
      </div>
    </div>
  )
}
