import { useState } from 'react'
import { Check, Info, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { MAX_STACKS } from '../ProjectWizardPage'
import { DELIVERABLES, DOMAINS, STACK_CATALOG, type Tone } from '../../types'
import { TONE_SOLID } from '@/shared/lib/tone'
import { card, CHIP_ON, DOMAIN_ICON } from '../wizardConstants'

/* ── Step 3 상세 설정 ── */
export function Step3(p: {
  stacks: string[]
  stackToneFor: (s: string) => Tone
  customStacksByGroup: Record<string, string[]>
  domain: string
  deliverables: string[]
  onStack: (v: string) => void
  onAddStack: (group: string, value: string) => void
  onDomain: (v: string) => void
  onDeliverable: (v: string) => void
}) {
  // 스택 직접 추가(그룹별 인라인 입력) · 도메인 '기타' 직접 입력 — 입력값을 칩으로 추가/선택.
  const [openStackGroup, setOpenStackGroup] = useState<string | null>(null)
  const [stackInput, setStackInput] = useState('')
  const [domainInput, setDomainInput] = useState('')

  const addStack = () => {
    const v = stackInput.trim()
    if (v && openStackGroup) p.onAddStack(openStackGroup, v)
    setStackInput('')
    setOpenStackGroup(null)
  }
  const addDomain = () => {
    const v = domainInput.trim()
    if (!v) return
    p.onDomain(v)
    setDomainInput('')
  }
  // 커스텀 도메인은 RHF domain 값에서 파생 — Step3 언마운트 후 복귀해도 칩 유지.
  const isCustomDomain = Boolean(p.domain) && !DOMAINS.includes(p.domain)

  return (
    <div className="flex flex-col gap-4">
      <section className={cn(card, 'flex flex-col gap-4')}>
        <div className="flex items-center justify-between">
          <span className="text-fg text-[15px] font-bold">
            기술 스택 <span className="text-danger text-[11px]">필수</span>
          </span>
          <span className="bg-brand/10 text-brand rounded-full px-3 py-1 text-[12px] font-bold">
            선택 {p.stacks.length} / {MAX_STACKS}
          </span>
        </div>
        {p.stacks.length > 0 && (
          <div className="bg-surface-muted/50 flex flex-wrap gap-1.5 rounded-xl p-3">
            {p.stacks.map((s) => (
              <span
                key={s}
                className={cn(
                  'flex items-center gap-1.5 rounded-full py-1 pr-1.5 pl-3 text-[12px] font-bold text-white',
                  TONE_SOLID[p.stackToneFor(s)],
                )}
              >
                {s}
                <button
                  type="button"
                  onClick={() => p.onStack(s)}
                  aria-label={`${s} 제거`}
                  className="flex size-[18px] items-center justify-center rounded-full bg-white/25 text-white transition-colors hover:bg-white/40"
                >
                  <X className="size-3" strokeWidth={2.5} aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        )}
        {STACK_CATALOG.map((g) => (
          <div key={g.label} className="flex flex-col gap-2">
            <span className="text-fg-muted flex items-center gap-1.5 text-[12px] font-semibold">
              <span className={cn('size-2 rounded-full', TONE_SOLID[g.tone])} />
              {g.label}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[...g.items, ...(p.customStacksByGroup[g.label] ?? [])].map(
                (it) => {
                  const on = p.stacks.includes(it)
                  return (
                    <button
                      key={it}
                      type="button"
                      onClick={() => p.onStack(it)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-[12px] font-semibold',
                        on
                          ? CHIP_ON[g.tone]
                          : 'border-border text-fg-muted hover:border-brand/50',
                      )}
                    >
                      {on && '✓ '}
                      {it}
                    </button>
                  )
                },
              )}
              <button
                type="button"
                onClick={() => {
                  setOpenStackGroup(g.label)
                  setStackInput('')
                }}
                className="border-border text-fg-subtle hover:border-brand/50 rounded-full border border-dashed px-3 py-1.5 text-[12px]"
              >
                + 직접 추가
              </button>
              {openStackGroup === g.label && (
                <span className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={stackInput}
                    maxLength={30}
                    onChange={(e) => setStackInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addStack()
                      } else if (e.key === 'Escape') {
                        setOpenStackGroup(null)
                        setStackInput('')
                      }
                    }}
                    placeholder="스택 이름"
                    aria-label={`${g.label} 스택 직접 입력`}
                    className="border-brand w-32 rounded-full border px-3 py-1.5 text-[12px] outline-none"
                  />
                  <button
                    type="button"
                    onClick={addStack}
                    disabled={!stackInput.trim()}
                    className="bg-brand rounded-full px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
                  >
                    추가
                  </button>
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[15px] font-bold">
          도메인 <span className="text-danger text-[11px]">필수</span>
        </span>
        <span className="text-fg-subtle text-[11px]">
          프로젝트가 다루는 도메인을 선택하세요 (1개)
        </span>
        <div className="flex flex-wrap gap-2">
          {(isCustomDomain ? [...DOMAINS, p.domain] : DOMAINS).map((d) => {
            const on = d === p.domain
            const Icon = DOMAIN_ICON[d] ?? Info
            return (
              <button
                key={d}
                type="button"
                onClick={() => p.onDomain(d)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[12px] font-semibold',
                  on
                    ? 'border-brand bg-brand text-white'
                    : 'border-border text-fg-muted hover:border-brand/50',
                )}
              >
                <Icon
                  className={cn('size-4', on ? 'text-white' : 'text-fg-subtle')}
                  aria-hidden="true"
                />
                {d}
                {on && <Check className="size-3.5" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
        {p.domain === '기타' && (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={domainInput}
              maxLength={30}
              onChange={(e) => setDomainInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addDomain()
                }
              }}
              placeholder="도메인을 직접 입력하고 추가하세요"
              aria-label="기타 도메인 직접 입력"
              className="border-border focus:border-brand flex-1 rounded-lg border px-3.5 py-2 text-[12px] outline-none"
            />
            <button
              type="button"
              onClick={addDomain}
              disabled={!domainInput.trim()}
              className="border-brand text-brand shrink-0 rounded-lg border px-4 py-2 text-[12px] font-semibold disabled:opacity-40"
            >
              추가
            </button>
          </div>
        )}
      </section>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[15px] font-bold">
          산출물 형태 <span className="text-danger text-[11px]">필수</span>
        </span>
        <span className="text-fg-subtle text-[11px]">
          최종 인증 시 검사가 인정할 산출물 형태 (복수 선택)
        </span>
        <div className="flex flex-wrap gap-2">
          {DELIVERABLES.map((d) => {
            const on = p.deliverables.includes(d)
            return (
              <button
                key={d}
                type="button"
                onClick={() => p.onDeliverable(d)}
                className={cn(
                  'rounded-lg border px-3.5 py-2 text-[12px] font-semibold',
                  on
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border text-fg-muted hover:border-brand/50',
                )}
              >
                {on && '✓ '}
                {d}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
