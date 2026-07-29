import { Command, FileText, Info, Send } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { type Tone } from '../../types'
import { TONE_SOFT } from '@/shared/lib/tone'
import { Avatar, SummaryCard } from '../wizardShared'
import { card, DELIVERABLE_META, DOMAIN_ICON } from '../wizardConstants'

/* ── Step 4 생성 확인 ── */
export function Step4(p: {
  name: string
  desc: string
  team: { id: string; name: string; avatarTone: Tone; pm: boolean }[]
  stacks: string[]
  stackToneFor: (s: string) => Tone
  domain: string
  deliverables: string[]
  checks: boolean[]
  onEditStep: (step: number) => void
  onCheck: (i: number) => void
}) {
  const DomainIcon = DOMAIN_ICON[p.domain] ?? Info
  const memberCount = p.team.filter((m) => !m.pm).length
  const CONFIRMS = [
    '초대된 팀원에게 알림이 발송되며, 수락 시점부터 워크스페이스에 참여할 수 있습니다.',
    '프로젝트 생성 후에도 워크스페이스에서 항목별로 수정 가능합니다.',
    '인증 완료된 프로젝트는 직접 수정 불가 · 변경 제안으로만 수정합니다.',
  ]
  return (
    <div className="flex flex-col gap-4">
      <SummaryCard
        step="STEP 1"
        title="기본 정보"
        sub="프로젝트명·설명·기간"
        icon={FileText}
        iconTone="success"
        onEdit={() => p.onEditStep(1)}
      >
        <span className="text-fg-subtle text-[11px]">프로젝트명</span>
        <span className="text-fg text-[15px] font-bold">{p.name}</span>
        <span className="text-fg-muted bg-surface-muted/50 mt-1 rounded-lg p-3 text-[12px] leading-5">
          {p.desc}
        </span>
      </SummaryCard>

      <SummaryCard
        step="STEP 2"
        title="팀 구성"
        sub={`PM 1명 + 팀원 ${memberCount}명`}
        icon={Send}
        iconTone="info"
        onEdit={() => p.onEditStep(2)}
      >
        {p.team.map((m) => (
          <div key={m.id} className="flex items-center gap-2 py-1">
            <Avatar name={m.name} tone={m.avatarTone} sm />
            <span className="text-fg flex-1 text-[13px] font-semibold">
              {m.name}
              {m.pm && ' (본인)'}
            </span>
            <span
              className={cn(
                'rounded px-2 py-0.5 text-[10px] font-bold',
                m.pm
                  ? 'bg-accent-strong text-white'
                  : 'bg-surface-muted text-fg-muted',
              )}
            >
              {m.pm ? 'PM' : '팀원'}
            </span>
          </div>
        ))}
      </SummaryCard>

      <SummaryCard
        step="STEP 3"
        title="상세 설정"
        sub={`스택 ${p.stacks.length} · 도메인 1 · 산출물 ${p.deliverables.length}`}
        icon={Command}
        iconTone="warning"
        onEdit={() => p.onEditStep(3)}
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-fg-subtle text-[11px]">기술 스택</span>
          <div className="flex flex-wrap gap-1.5">
            {p.stacks.map((s) => (
              <span
                key={s}
                className={cn(
                  'rounded-md px-2 py-0.5 text-[11px] font-bold',
                  TONE_SOFT[p.stackToneFor(s)],
                )}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-fg-subtle text-[11px]">도메인</span>
            <span className="bg-brand flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold text-white">
              <DomainIcon className="size-3.5" aria-hidden="true" />
              {p.domain}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-fg-subtle text-[11px]">
              산출물 형태 · {p.deliverables.length}건
            </span>
            <div className="flex flex-wrap gap-1.5">
              {p.deliverables.map((d) => {
                const meta = DELIVERABLE_META[d]
                const Icon = meta?.icon ?? FileText
                return (
                  <span
                    key={d}
                    className={cn(
                      'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold',
                      TONE_SOFT[meta?.tone ?? 'brand'],
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {d}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </SummaryCard>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[13px] font-bold">
          ⓘ 생성 전 확인 사항
        </span>
        {CONFIRMS.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => p.onCheck(i)}
            className="flex items-start gap-2.5 text-left"
          >
            <span
              className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                p.checks[i]
                  ? 'bg-success text-white'
                  : 'border-border text-fg-subtle border',
              )}
            >
              {p.checks[i] ? '✓' : ''}
            </span>
            <span className="text-fg-muted text-[12px] leading-5">{c}</span>
          </button>
        ))}
      </section>
    </div>
  )
}
