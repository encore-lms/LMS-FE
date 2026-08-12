import { Search, Send, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { SearchInput } from '@/components/ui/SearchInput'
import { type TeamCandidate, type Tone } from '../../types'
import { Avatar } from '../wizardShared'
import { card } from '../wizardConstants'

/* ── Step 2 팀 설정 ── */
export function Step2(p: {
  pmName: string
  pmMeta: string
  cohortLabel: string
  candidates: TeamCandidate[]
  searchQuery: string
  /** 검색 칸에 그대로 보일 값 — searchQuery 는 걸러내기용이라 공백이 잘려 있다. */
  search: string
  onSearchChange: (value: string) => void
  invited: string[]
  team: {
    id: string
    name: string
    meta: string
    avatarTone: Tone
    pm: boolean
  }[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <section className={cn(card, 'flex items-center gap-3')}>
        <Avatar name={p.pmName} tone="brand" />
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="text-fg text-[14px] font-bold">
              {p.pmName} (본인)
            </span>
            <span className="bg-accent-bg text-accent-strong rounded px-2 py-0.5 text-[10px] font-bold">
              📌 PM · 자동 지정
            </span>
          </div>
          <span className="text-fg-subtle text-[11px]">{p.pmMeta}</span>
        </div>
      </section>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-fg text-[15px] font-bold">팀원 초대</span>
            <span className="text-fg-subtle text-[11px]">
              같은 기수({p.cohortLabel}) 동료 중 검색하여 초대
            </span>
          </div>
          <span className="bg-brand/10 text-brand rounded-full px-3 py-1 text-[12px] font-bold">
            초대 {p.invited.length} / 6명
          </span>
        </div>
        <SearchInput
          value={p.search}
          onChange={p.onSearchChange}
          placeholder="이름이나 영문 닉네임으로 검색"
          ariaLabel="팀원 검색"
          className="w-full rounded-[10px] px-4 py-3"
        />
        {p.searchQuery === '' ? (
          <div className="border-border text-fg-subtle flex flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-8 text-center">
            <Search className="size-5" aria-hidden="true" />
            <span className="text-[12px] font-semibold">
              이름이나 영문 닉네임으로 검색해 동료를 초대하세요
            </span>
            <span className="text-[11px]">
              같은 기수({p.cohortLabel}) 동료만 검색됩니다
            </span>
          </div>
        ) : (
          <>
            <span className="text-fg-subtle text-[11px]">
              검색 결과 ({p.candidates.length}명)
            </span>
            {p.candidates.length === 0 ? (
              <div className="border-border text-fg-subtle rounded-xl border border-dashed px-4 py-6 text-center text-[12px]">
                ‘{p.searchQuery}’에 해당하는 동료를 찾지 못했어요
              </div>
            ) : (
              p.candidates.map((c) => {
                const on = p.invited.includes(c.id)
                return (
                  <div key={c.id} className="flex items-center gap-3">
                    <Avatar name={c.name} tone={c.avatarTone} />
                    <div className="flex flex-1 flex-col">
                      <span className="text-fg text-[13px] font-bold">
                        {c.name}
                      </span>
                      <span className="text-fg-subtle text-[11px]">
                        {c.meta}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => p.onToggle(c.id)}
                      className={cn(
                        'rounded-lg px-3.5 py-2 text-[12px] font-bold',
                        on
                          ? 'bg-success-bg text-success'
                          : 'bg-brand-deep text-white',
                      )}
                    >
                      {on ? '✓ 초대됨' : '초대하기'}
                    </button>
                  </div>
                )
              })
            )}
          </>
        )}
      </section>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-fg text-[15px] font-bold">현재 팀 구성</span>
            <span className="text-fg-subtle text-[11px]">
              PM 1명 + 최대 팀원 6명 · 초대한 동료는 수락해야 팀원이 됩니다
            </span>
          </div>
          <span className="text-brand flex items-center gap-1 text-[12px] font-bold">
            <Send className="size-3.5" aria-hidden="true" /> {p.team.length} / 7
          </span>
        </div>
        {p.team.map((m) => (
          <div key={m.id} className="flex items-center gap-3">
            <Avatar name={m.name} tone={m.avatarTone} />
            <div className="flex flex-1 flex-col">
              <span className="text-fg text-[13px] font-bold">
                {m.name}
                {m.pm && ' (본인)'}
              </span>
              <span className="text-fg-subtle text-[11px]">{m.meta}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* 고른 것만으로 팀원이 되지는 않는다 — 상대가 받아들여야 한다. */}
              <span
                className={cn(
                  'rounded px-2 py-0.5 text-[10px] font-bold',
                  m.pm
                    ? 'bg-accent-strong text-white'
                    : 'bg-warning-bg text-warning',
                )}
              >
                {m.pm ? 'PM' : '초대 대기'}
              </span>
              {!m.pm && (
                <button
                  type="button"
                  onClick={() => p.onToggle(m.id)}
                  aria-label={`${m.name} 초대 취소`}
                  className="border-border text-fg-subtle hover:text-fg flex size-7 items-center justify-center rounded-lg border"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ))}
        <div className="bg-info-bg/60 text-fg-muted flex items-center gap-2 rounded-xl p-3 text-[11px]">
          <Send className="text-info size-4 shrink-0" aria-hidden="true" />
          초대한 동료에게 알림이 갑니다. 상대가 수락한 시점부터 팀원이 되고
          워크스페이스에 참여할 수 있습니다.
        </div>
      </section>
    </div>
  )
}
